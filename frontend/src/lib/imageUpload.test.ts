/**
 * Tests for the multi-size photo upload pipeline.
 *
 * The pipeline is: validate → resize-to-3-widths → encode-WebP → upload-each →
 * return manifest. jsdom doesn't have a real canvas, so we mock the canvas
 * and FileReader bits and intercept axios — this isolates the business logic
 * (validation, manifest assembly, upload count, naming) from the encode path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { PHOTO_SIZES, uploadResponsivePhoto } from './imageUpload';
import { setAdminToken } from '../auth';

vi.mock('axios');

const mockedPost = vi.mocked(axios.post);

beforeEach(() => {
  setAdminToken('test-token');

  // FileReader: emit a data: URL synchronously so blobToImage's reader
  // resolves without an actual file system.
  class FakeFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    result: string = '';
    error: unknown = null;
    readAsDataURL() {
      this.result = 'data:image/png;base64,iVBORw0KGgo=';
      queueMicrotask(() => this.onload?.({ target: { result: this.result } }));
    }
  }
  vi.stubGlobal('FileReader', FakeFileReader);

  // <img>: pretend the decode succeeds with known intrinsic dimensions.
  // We need an actual <img> so canvas.drawImage can be called with it.
  const OriginalImage = globalThis.Image;
  class FakeImage extends OriginalImage {
    constructor() {
      super();
      // Trigger onload on next microtask — the real Image fires async too.
      queueMicrotask(() => {
        Object.defineProperty(this, 'naturalWidth', { value: 2000, configurable: true });
        Object.defineProperty(this, 'naturalHeight', { value: 1000, configurable: true });
        this.onload?.(new Event('load'));
      });
    }
  }
  vi.stubGlobal('Image', FakeImage);

  // canvas.getContext + canvas.toBlob — jsdom returns null from getContext,
  // so we patch the prototype to return a stub that satisfies the code path.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    drawImage: vi.fn(),
  })) as unknown as HTMLCanvasElement['getContext'];

  HTMLCanvasElement.prototype.toBlob = function (this: HTMLCanvasElement, callback: BlobCallback, type?: string) {
    // Tag the blob with the requested width so we can assert per-size below.
    const tag = `width-${this.width}`;
    const blob = new Blob([tag], { type: type ?? 'image/webp' });
    queueMicrotask(() => callback(blob));
  } as HTMLCanvasElement['toBlob'];

  mockedPost.mockImplementation(async (_url: string, data: unknown) => {
    // Reflect the filename back in the response URL so the test can assert
    // each size landed at the right slot.
    const form = data as FormData;
    const file = form.get('file') as File;
    return { data: { url: `/uploads/${file.name}` } };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadResponsivePhoto', () => {
  it('rejects non-image input early', async () => {
    const txt = new File(['hi'], 'note.txt', { type: 'text/plain' });
    await expect(uploadResponsivePhoto(txt)).rejects.toThrow(/Only image files/);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5 MB', async () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await expect(uploadResponsivePhoto(big)).rejects.toThrow(/5MB or smaller/);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('uploads one file per declared photo size', async () => {
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    await uploadResponsivePhoto(file);
    expect(mockedPost).toHaveBeenCalledTimes(PHOTO_SIZES.length);
  });

  it('returns a manifest with srcset entries for every declared size', async () => {
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    const result = await uploadResponsivePhoto(file);
    for (const size of PHOTO_SIZES) {
      expect(result.srcset[size]).toMatch(new RegExp(`-${size}w\\.webp$`));
    }
  });

  it('the manifest url is the 1920w entry (largest) when available', async () => {
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    const result = await uploadResponsivePhoto(file);
    expect(result.url).toBe(result.srcset[1920]);
  });

  it('records intrinsic source dimensions in the manifest', async () => {
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    const result = await uploadResponsivePhoto(file);
    expect(result.width).toBe(2000);
    expect(result.height).toBe(1000);
  });

  it('names each upload <source>-<width>w.webp', async () => {
    const file = new File([new Uint8Array(1024)], 'beach-vibes.png', { type: 'image/png' });
    await uploadResponsivePhoto(file);
    const names = mockedPost.mock.calls.map((call) => {
      const f = call[1] as FormData;
      return (f.get('file') as File).name;
    });
    expect(names).toEqual([
      'beach-vibes-640w.webp',
      'beach-vibes-1280w.webp',
      'beach-vibes-1920w.webp',
    ]);
  });

  it('throws if no admin token is in sessionStorage', async () => {
    sessionStorage.clear();
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    await expect(uploadResponsivePhoto(file)).rejects.toThrow(/Not authenticated/);
  });

  it('passes the Bearer token in the Authorization header', async () => {
    const file = new File([new Uint8Array(1024)], 'pic.png', { type: 'image/png' });
    await uploadResponsivePhoto(file);
    const [, , config] = mockedPost.mock.calls[0];
    expect((config as { headers: Record<string, string> }).headers.Authorization).toBe('Bearer test-token');
  });
});
