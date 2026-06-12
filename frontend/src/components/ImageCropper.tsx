/**
 * Drag-to-crop component extracted from AdminPanel so ContentManager can
 * reuse it for page photos and illustrations without importing the entire
 * admin panel tree.
 *
 * Output: WebP at quality 0.88 (higher than the resize pipeline because
 * this is the largest size — the downstream resizer re-encodes at 0.82).
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { FC } from "react";
import { Crop } from "lucide-react";

export interface ImageCropperProps {
  file: File;
  /** Width / height ratio of the crop area. 1 = square (default), 16/9 = hero, 4/3 = chapter. */
  aspectRatio?: number;
  /** Largest dimension of the output. Defaults to 1920. */
  outputMaxLong?: number;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropper: FC<ImageCropperProps> = ({
  file,
  aspectRatio = 1,
  outputMaxLong = 1920,
  onCrop,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, w: 200, h: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => () => URL.revokeObjectURL(imgSrc), [imgSrc]);

  const fitToAspect = useCallback(
    (boxW: number, boxH: number) => {
      let w = boxW;
      let h = w / aspectRatio;
      if (h > boxH) { h = boxH; w = h * aspectRatio; }
      return { w, h };
    },
    [aspectRatio],
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    setImgLoaded(true);
    const container = containerRef.current;
    if (!container) return;
    const maxW = container.clientWidth;
    const maxH = 400;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    setDisplaySize({ w: dw, h: dh });
    const fit = fitToAspect(dw, dh);
    const w = fit.w * 0.85;
    const h = fit.h * 0.85;
    setCropArea({ x: (dw - w) / 2, y: (dh - h) / 2, w, h });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const newX = Math.max(0, Math.min(displaySize.w - cropArea.w, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(displaySize.h - cropArea.h, e.clientY - dragStart.y));
      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    },
    [dragging, dragStart, displaySize, cropArea.w, cropArea.h],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const scaleX = img.naturalWidth / displaySize.w;
    const scaleY = img.naturalHeight / displaySize.h;
    const sx = cropArea.x * scaleX;
    const sy = cropArea.y * scaleY;
    const sw = cropArea.w * scaleX;
    const sh = cropArea.h * scaleY;
    const longSide = Math.max(sw, sh);
    const outScale = longSide > outputMaxLong ? outputMaxLong / longSide : 1;
    const outW = Math.round(sw * outScale);
    const outH = Math.round(sh * outScale);
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, "image/webp", 0.88);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setCropArea((prev) => {
      const minW = 60;
      const maxW = Math.min(displaySize.w, displaySize.h * aspectRatio);
      const newW = Math.max(minW, Math.min(maxW, prev.w + delta));
      const newH = newW / aspectRatio;
      const newX = Math.max(0, Math.min(displaySize.w - newW, prev.x - (newW - prev.w) / 2));
      const newY = Math.max(0, Math.min(displaySize.h - newH, prev.y - (newH - prev.h) / 2));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  const ratioLabel =
    aspectRatio === 1 ? "1:1"
    : aspectRatio === 16 / 9 ? "16:9"
    : aspectRatio === 4 / 3 ? "4:3"
    : aspectRatio.toFixed(2);

  return (
    <div className="image-cropper">
      <div className="image-cropper__header">
        <Crop size={16} />
        <span>Crop to {ratioLabel} — drag to move, scroll to resize</span>
      </div>
      <div ref={containerRef} className="image-cropper__container" onWheel={handleWheel}>
        {imgSrc && (
          <div style={{ position: "relative", width: displaySize.w, height: displaySize.h, margin: "0 auto" }}>
            <img
              src={imgSrc}
              onLoad={handleImageLoad}
              style={{ display: imgLoaded ? "block" : "none", width: displaySize.w || "auto", height: displaySize.h || "auto" }}
              alt="Crop preview"
              draggable={false}
            />
            {imgLoaded && (
              <>
                <div
                  className="image-cropper__overlay"
                  style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropArea.x}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y + cropArea.h}px, ${cropArea.x + cropArea.w}px ${cropArea.y + cropArea.h}px, ${cropArea.x + cropArea.w}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y}px)`,
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="image-cropper__handle"
                  style={{
                    position: "absolute",
                    left: cropArea.x, top: cropArea.y,
                    width: cropArea.w, height: cropArea.h,
                    border: "2px solid white",
                    borderRadius: "var(--radius-md)",
                    cursor: "move",
                    boxShadow: "0 0 0 9999px transparent",
                  }}
                  onMouseDown={handleMouseDown}
                />
              </>
            )}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="image-cropper__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={handleCrop}>
          <Crop size={14} /> Apply Crop
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
