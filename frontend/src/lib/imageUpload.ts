/**
 * Browser-side image resize + multi-size upload.
 *
 * Why client-side: the Rails backend doesn't have libvips / ImageMagick
 * available, and shipping that dependency through Docker just to power the
 * admin photo manager is a yak too long. The admin pays a few seconds of
 * "uploading 3 sizes" once; customers never pay.
 *
 * The output is a manifest with three JPG URLs (640w, 1280w, 1920w) ready to
 * plug straight into <Picture srcSet=…> on the customer side.
 */

import axios from "axios";
import { getAdminToken } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const PHOTO_SIZES = [640, 1280, 1920] as const;
export type PhotoSize = typeof PHOTO_SIZES[number];

export interface UploadedPhotoManifest {
  /** Display URL — the largest size, used as the default <img src>. */
  url: string;
  /** Per-width JPG URLs for the srcSet attribute. */
  srcset: Record<PhotoSize, string>;
  /** Intrinsic dimensions of the original (pre-resize) image. */
  width: number;
  height: number;
}

interface ResizedBlob {
  width: PhotoSize;
  blob: Blob;
}

/**
 * Render the given file at the requested target widths via an offscreen
 * canvas. Aspect ratio is preserved; if the source is narrower than a target
 * width we cap at the source width so we don't upscale.
 */
async function resizeToWidths(
  file: File,
  widths: ReadonlyArray<PhotoSize>,
  quality = 0.85,
): Promise<{ resized: ResizedBlob[]; width: number; height: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onerror = () => reject(new Error("Failed to decode image"));
    el.onload = () => resolve(el);
    el.src = dataUrl;
  });

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
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
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
 * Take a file from <input type=file>, resize to 3 widths, upload each, and
 * return a srcset manifest ready to store in SiteSetting.homepage_photos.
 *
 * Throws on any individual failure — caller decides whether to retry or
 * roll back partial uploads.
 */
export async function uploadResponsivePhoto(file: File): Promise<UploadedPhotoManifest> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  // 5 MB matches the backend's UploadsController guard — fail early.
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const { resized, width, height } = await resizeToWidths(file, PHOTO_SIZES);

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const srcset: Partial<Record<PhotoSize, string>> = {};
  for (const r of resized) {
    const url = await uploadBlob(r.blob, `${baseName}-${r.width}w.jpg`);
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
