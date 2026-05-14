/**
 * Browser-side image resize + multi-size upload.
 *
 * Why client-side: the Rails backend doesn't have libvips / ImageMagick
 * available, and shipping that dependency through Docker just to power the
 * admin photo manager is a yak too long. The admin pays a few seconds of
 * "uploading 3 sizes" once; customers never pay.
 *
 * Output format: WebP. At quality 0.82 a WebP is ~25–35 % smaller than the
 * equivalent JPEG with no visible difference, and every browser the menu
 * runs on (~99 % of global traffic in 2026) decodes WebP natively. Source
 * files can be any image MIME the backend accepts (jpg/png/webp/gif) —
 * the canvas re-encode normalises everything.
 *
 * The output is a manifest with three WebP URLs (640w, 1280w, 1920w) ready
 * to plug straight into <Picture srcSet=…> on the customer side.
 */

import axios from "axios";
import { getAdminToken } from "../auth";
import { API_URL } from "../config/api";


export const PHOTO_SIZES = [640, 1280, 1920] as const;
export type PhotoSize = typeof PHOTO_SIZES[number];

/** WebP encode quality. 0.82 is the sweet spot — same perceived quality as
 *  JPEG @ 0.90 at ~70 % of the byte size. Tune cautiously. */
const WEBP_QUALITY = 0.82;

export interface UploadedPhotoManifest {
  /** Display URL — the largest size, used as the default <img src>. */
  url: string;
  /** Per-width WebP URLs for the srcSet attribute. */
  srcset: Record<PhotoSize, string>;
  /** Intrinsic dimensions of the original (pre-resize) image. */
  width: number;
  height: number;
}

interface ResizedBlob {
  width: PhotoSize;
  blob: Blob;
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onerror = () => reject(new Error("Failed to decode image"));
    el.onload = () => resolve(el);
    el.src = dataUrl;
  });
}

/**
 * Render the given image at the requested target widths via an offscreen
 * canvas. Aspect ratio is preserved; if the source is narrower than a target
 * width we cap at the source width so we don't upscale.
 *
 * Each output is WebP — see WEBP_QUALITY for the encode setting.
 */
async function resizeToWidths(
  input: File | Blob,
  widths: ReadonlyArray<PhotoSize>,
  quality = WEBP_QUALITY,
): Promise<{ resized: ResizedBlob[]; width: number; height: number }> {
  const img = await blobToImage(input);
  const sourceW = img.naturalWidth;
  const sourceH = img.naturalHeight;
  const ratio = sourceH / sourceW;

  const resized: ResizedBlob[] = [];
  for (const target of widths) {
    const w = Math.min(target, sourceW);
    const h = Math.round(w * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2d context unavailable");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality),
    );
    if (!blob) throw new Error(`Failed to encode ${target}w blob`);
    resized.push({ width: target, blob });
  }

  return { resized, width: sourceW, height: sourceH };
}

async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const token = getAdminToken();
  if (!token) throw new Error("Not authenticated");
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await axios.post<{ url: string }>(`${API_URL}/uploads`, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  // Server returns absolute (S3) or relative (/uploads/...) URLs; the
  // customer side will resolve relative paths against VITE_API_URL when
  // rendering.
  return res.data.url;
}

/**
 * Take a file from <input type=file> (or a pre-cropped Blob from the
 * cropper), resize to 3 widths in WebP, upload each, and return a srcset
 * manifest ready to store in SiteSetting.homepage_photos.
 *
 * Throws on any individual failure — caller decides whether to retry or
 * roll back partial uploads.
 */
export async function uploadResponsivePhoto(input: File | Blob): Promise<UploadedPhotoManifest> {
  if (!input.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  // 5 MB matches the backend's UploadsController guard — fail early.
  // Note: this is the SOURCE size; outputs are typically far smaller.
  if (input.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const { resized, width, height } = await resizeToWidths(input, PHOTO_SIZES);

  const sourceName = input instanceof File && input.name
    ? input.name.replace(/\.[^.]+$/, "")
    : "photo";
  const srcset: Partial<Record<PhotoSize, string>> = {};
  for (const r of resized) {
    const url = await uploadBlob(r.blob, `${sourceName}-${r.width}w.webp`);
    srcset[r.width] = url;
  }

  const url = srcset[1920] ?? srcset[1280] ?? srcset[640]!;
  return {
    url,
    srcset: srcset as Record<PhotoSize, string>,
    width,
    height,
  };
}
