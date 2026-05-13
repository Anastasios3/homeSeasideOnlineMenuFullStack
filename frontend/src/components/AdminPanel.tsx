import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { FC, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import {
  Plus, Pencil, Trash2, X, FolderPlus, Search,
  Upload, Image as ImageIcon, Crop, Clock, RotateCcw,
  ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { getAdminToken } from "../auth";
import {
  DEFAULT_SCHEDULE,
  PHASE_ORDER,
  getSchedule,
  saveSchedule,
  resetSchedule,
  type DayPhase,
  type DaySchedule,
} from "../config/schedule";
import {
  MAIN_CATEGORIES as SUB_MAIN_CATEGORIES,
  EMPTY_OVERRIDES,
  getOverrides,
  mergeDerivedWithOverrides,
  saveSubcategoryOverrides,
  type MainCategoryId as SubMainCategoryId,
  type SubcategoryOverrides,
} from "../config/subcategories";
import {
  getHomepagePhotos,
  saveHomepagePhotos,
  type HomepagePhotosOverrides,
} from "../config/homepagePhotos";
import { uploadResponsivePhoto } from "../lib/imageUpload";
import type { JourneySlot, GallerySlot } from "../api/siteSetting";
import "../styles/AdminPanel.css";

/** Build Authorization header from stored JWT */
const authHeaders = () => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type Language = "EN" | "EL";
type PricingType = "single" | "single_double" | "glass_bottle";
type MainCategoryId = "coffee" | "spirits" | "cocktails" | "beer&wine" | "food";

interface LocalizedField {
  en: string;
  el: string;
}

interface MenuItemData {
  _id: { $oid: string } | string;
  name: LocalizedField;
  description?: LocalizedField;
  main_category?: MainCategoryId;
  category: LocalizedField;
  price: number;
  pricing_type?: PricingType;
  price_secondary?: number | null;
  available: boolean;
  allergens: string[];
  image_url?: string | null;
}

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/menu_items`
  : "http://localhost:3000/menu_items";

const UPLOAD_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/uploads`
  : "http://localhost:3000/uploads";

const KNOWN_ALLERGENS = [
  "Dairy", "Gluten", "Eggs", "Nuts",
  "Seafood", "Shellfish", "Alcohol", "Soy",
];

/* ============================================================
   The 5 fixed main categories (never added/removed by admin)
   ============================================================ */
const MAIN_CATEGORIES: { id: MainCategoryId; en: string; el: string }[] = [
  { id: "coffee", en: "Coffee & More", el: "Καφές & Άλλα" },
  { id: "spirits", en: "Spirits", el: "Ποτά" },
  { id: "cocktails", en: "Cocktails", el: "Κοκτέιλ" },
  { id: "beer&wine", en: "Beer & Wine", el: "Μπύρα & Κρασί" },
  { id: "food", en: "Food", el: "Φαγητό" },
];

/* ============================================================
   Subcategories — all dynamic, none hardcoded as "default"
   ============================================================ */
interface SubcategoryDef {
  en: string;
  el: string;
  parent: MainCategoryId;
}

const STORAGE_KEY = "homeseaside_subcategories_v3";

/** Build subcategories from existing menu items */
const buildSubcategoriesFromItems = (items: MenuItemData[]): SubcategoryDef[] => {
  const seen = new Set<string>();
  const subs: SubcategoryDef[] = [];
  for (const item of items) {
    const en = typeof item.category === "object" ? item.category.en : (item.category ?? "");
    const el = typeof item.category === "object" ? item.category.el : (item.category ?? "");
    const parent = item.main_category ?? ("coffee" as MainCategoryId);
    const key = `${parent}::${en.toLowerCase()}`;
    if (en && !seen.has(key)) {
      seen.add(key);
      subs.push({ en, el: el || en, parent });
    }
  }
  return subs;
};

const loadSubcategories = (): SubcategoryDef[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as SubcategoryDef[];
  } catch { /* ignore */ }
  return [];
};

const saveSubcategories = (subs: SubcategoryDef[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
};

const getId = (item: MenuItemData): string => {
  if (typeof item._id === "string") return item._id;
  return item._id?.$oid ?? "";
};

const getField = (
  field: LocalizedField | string | undefined,
  lang: Language
): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return lang === "EN" ? field.en : field.el;
};

const getImageFullUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("/")) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${base}${url}`;
  }
  return url;
};

/* ============================================================
   Image Cropper — simple 1:1 drag-to-crop
   ============================================================ */
interface ImageCropperProps {
  file: File;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropper: FC<ImageCropperProps> = ({ file, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Derive the blob URL synchronously from the file so we don't need a
  // setState-in-effect — the cleanup effect below revokes on unmount/file change.
  const imgSrc = useMemo(() => URL.createObjectURL(file), [file]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => () => URL.revokeObjectURL(imgSrc), [imgSrc]);

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
    const minDim = Math.min(dw, dh);
    const cropSize = minDim * 0.8;
    setCropArea({ x: (dw - cropSize) / 2, y: (dh - cropSize) / 2, size: cropSize });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const newX = Math.max(0, Math.min(displaySize.w - cropArea.size, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(displaySize.h - cropArea.size, e.clientY - dragStart.y));
    setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
  }, [dragging, dragStart, displaySize, cropArea.size]);

  const handleMouseUp = useCallback(() => { setDragging(false); }, []);

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
    const sSize = cropArea.size * scaleX;
    const outputSize = Math.min(800, sSize);
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, "image/jpeg", 0.85);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setCropArea((prev) => {
      const newSize = Math.max(60, Math.min(Math.min(displaySize.w, displaySize.h), prev.size + delta));
      const newX = Math.max(0, Math.min(displaySize.w - newSize, prev.x - (newSize - prev.size) / 2));
      const newY = Math.max(0, Math.min(displaySize.h - newSize, prev.y - (newSize - prev.size) / 2));
      return { x: newX, y: newY, size: newSize };
    });
  };

  return (
    <div className="image-cropper">
      <div className="image-cropper__header">
        <Crop size={16} />
        <span>Crop to 1:1 — drag to move, scroll to resize</span>
      </div>
      <div ref={containerRef} className="image-cropper__container" onWheel={handleWheel}>
        {imgSrc && (
          <div style={{ position: "relative", width: displaySize.w, height: displaySize.h, margin: "0 auto" }}>
            <img src={imgSrc} onLoad={handleImageLoad} style={{ display: imgLoaded ? "block" : "none", width: displaySize.w || "auto", height: displaySize.h || "auto" }} alt="Crop preview" draggable={false} />
            {imgLoaded && (
              <>
                <div className="image-cropper__overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropArea.x}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y + cropArea.size}px, ${cropArea.x + cropArea.size}px ${cropArea.y + cropArea.size}px, ${cropArea.x + cropArea.size}px ${cropArea.y}px, ${cropArea.x}px ${cropArea.y}px)`, pointerEvents: "none" }} />
                <div className="image-cropper__handle" style={{ position: "absolute", left: cropArea.x, top: cropArea.y, width: cropArea.size, height: cropArea.size, border: "2px solid white", borderRadius: "var(--radius-md)", cursor: "move", boxShadow: "0 0 0 9999px transparent" }} onMouseDown={handleMouseDown} />
              </>
            )}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="image-cropper__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={handleCrop}><Crop size={14} /> Apply Crop</button>
      </div>
    </div>
  );
};

/* ============================================================
   Photo Manager — admin overrides for homepage hero/journey/gallery
   ============================================================ */
interface PhotoManagerProps {
  onClose: () => void;
  onSaved: () => void;
}

function resolvePreviewUrl(url: string | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API}${url.replace(/^\/menu_items/, "")}`.replace("/menu_items", "");
  return url;
}

function genSlotId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const PhotoManager: FC<PhotoManagerProps> = ({ onClose, onSaved }) => {
  const [draft, setDraft] = useState<HomepagePhotosOverrides>(() => getHomepagePhotos());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "journey" | "gallery">("hero");

  // ---------- HERO ----------
  const handleHeroUpload = async (file: File) => {
    setUploadingFor("hero");
    setError(null);
    try {
      const manifest = await uploadResponsivePhoto(file);
      setDraft((prev) => ({
        ...prev,
        hero: {
          url: manifest.url,
          srcset: {
            "640": manifest.srcset[640],
            "1280": manifest.srcset[1280],
            "1920": manifest.srcset[1920],
          },
          width: manifest.width,
          height: manifest.height,
          alt_en: prev.hero?.alt_en ?? "",
          alt_el: prev.hero?.alt_el ?? "",
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hero upload failed");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleHeroAlt = (field: "alt_en" | "alt_el", value: string) => {
    setDraft((prev) => prev.hero
      ? { ...prev, hero: { ...prev.hero, [field]: value } }
      : prev);
  };

  const handleHeroClear = () => {
    setDraft((prev) => ({ ...prev, hero: null }));
  };

  // ---------- JOURNEY ----------
  const handleJourneyUpload = async (id: string, file: File) => {
    setUploadingFor(`journey-${id}`);
    setError(null);
    try {
      const manifest = await uploadResponsivePhoto(file);
      setDraft((prev) => ({
        ...prev,
        journey: prev.journey.map((s) =>
          s.id === id
            ? {
                ...s,
                url: manifest.url,
                srcset: {
                  "640": manifest.srcset[640],
                  "1280": manifest.srcset[1280],
                  "1920": manifest.srcset[1920],
                },
                width: manifest.width,
                height: manifest.height,
              }
            : s),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey upload failed");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleJourneyAdd = () => {
    setDraft((prev) => ({
      ...prev,
      journey: [
        ...prev.journey,
        {
          id: genSlotId("journey"),
          url: "",
          alt_en: "",
          alt_el: "",
          caption_en: "",
          caption_el: "",
          position: prev.journey.length,
        },
      ],
    }));
  };

  const handleJourneyChange = (id: string, patch: Partial<JourneySlot>) => {
    setDraft((prev) => ({
      ...prev,
      journey: prev.journey.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const handleJourneyRemove = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      journey: prev.journey.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i })),
    }));
  };

  const handleJourneyMove = (id: string, direction: -1 | 1) => {
    setDraft((prev) => {
      const idx = prev.journey.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev.journey];
      const swap = idx + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...prev, journey: next.map((s, i) => ({ ...s, position: i })) };
    });
  };

  // ---------- GALLERY ----------
  const handleGalleryUpload = async (id: string, file: File) => {
    setUploadingFor(`gallery-${id}`);
    setError(null);
    try {
      const manifest = await uploadResponsivePhoto(file);
      setDraft((prev) => ({
        ...prev,
        gallery: prev.gallery.map((s) =>
          s.id === id
            ? {
                ...s,
                url: manifest.url,
                srcset: {
                  "640": manifest.srcset[640],
                  "1280": manifest.srcset[1280],
                  "1920": manifest.srcset[1920],
                },
                width: manifest.width,
                height: manifest.height,
              }
            : s),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gallery upload failed");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleGalleryAdd = () => {
    setDraft((prev) => ({
      ...prev,
      gallery: [
        ...prev.gallery,
        {
          id: genSlotId("gallery"),
          url: "",
          alt_en: "",
          alt_el: "",
          position: prev.gallery.length,
        },
      ],
    }));
  };

  const handleGalleryChange = (id: string, patch: Partial<GallerySlot>) => {
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const handleGalleryRemove = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i })),
    }));
  };

  const handleGalleryMove = (id: string, direction: -1 | 1) => {
    setDraft((prev) => {
      const idx = prev.gallery.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev.gallery];
      const swap = idx + direction;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...prev, gallery: next.map((s, i) => ({ ...s, position: i })) };
    });
  };

  // ---------- SAVE ----------
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Drop empty journey/gallery slots (no image was ever uploaded).
      const cleaned: HomepagePhotosOverrides = {
        hero: draft.hero,
        journey: draft.journey.filter((s) => s.url).map((s, i) => ({ ...s, position: i })),
        gallery: draft.gallery.filter((s) => s.url).map((s, i) => ({ ...s, position: i })),
      };
      await saveHomepagePhotos(cleaned);
      setDraft(cleaned);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="photos-title">
      <div className="modal modal--photos">
        <div className="modal-header">
          <h2 id="photos-title" className="modal-title">Homepage Photos</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="modal-tabs" role="tablist" aria-label="Photo sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "hero"}
            className={`modal-tab ${activeTab === "hero" ? "modal-tab--active" : ""}`}
            onClick={() => setActiveTab("hero")}
          >
            Hero
            <span className="modal-tab__time">{draft.hero ? "custom" : "default"}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "journey"}
            className={`modal-tab ${activeTab === "journey" ? "modal-tab--active" : ""}`}
            onClick={() => setActiveTab("journey")}
          >
            Journey
            <span className="modal-tab__time">{draft.journey.length} photos</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "gallery"}
            className={`modal-tab ${activeTab === "gallery" ? "modal-tab--active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            Gallery
            <span className="modal-tab__time">{draft.gallery.length} photos</span>
          </button>
        </div>

        <div className="modal-body">
          <p className="schedule__intro">
            Photos are auto-resized to 640 / 1280 / 1920 px before upload —
            phones download the small size, laptops get the big one.
          </p>

          {/* HERO */}
          {activeTab === "hero" && (
            <section className="photo-section" style={{ borderBottom: "none", paddingTop: 0 }}>
              <h3 className="photo-section__title">Hero photo</h3>
              <p className="photo-section__hint">
                Full-bleed photo at the top of the homepage. Leave blank and the
                site auto-picks a time-of-day photo from the built-in set.
              </p>
              <div className="photo-hero-card">
                <div className="photo-hero-card__preview">
                  {draft.hero?.url ? (
                    <img src={resolvePreviewUrl(draft.hero.url)} alt="" />
                  ) : (
                    <div className="photo-hero-card__placeholder">
                      <ImageIcon size={32} strokeWidth={1.4} />
                      <span>Using built-in default</span>
                    </div>
                  )}
                </div>
                <div className="photo-hero-card__controls">
                  <label className="btn btn--secondary">
                    <Upload size={14} />
                    {uploadingFor === "hero" ? "Uploading…" : draft.hero?.url ? "Replace" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleHeroUpload(f);
                        e.target.value = "";
                      }}
                      disabled={uploadingFor !== null}
                    />
                  </label>
                  {draft.hero && (
                    <>
                      <label className="subcat-edit-field">
                        <span className="subcat-edit-field__label">Alt text (English)</span>
                        <input
                          type="text"
                          className="form-input form-input--sm"
                          value={draft.hero.alt_en}
                          onChange={(e) => handleHeroAlt("alt_en", e.target.value)}
                          placeholder="e.g. The sea at golden hour outside Home Seaside"
                        />
                      </label>
                      <label className="subcat-edit-field">
                        <span className="subcat-edit-field__label">Alt text (Ελληνικά)</span>
                        <input
                          type="text"
                          className="form-input form-input--sm"
                          value={draft.hero.alt_el}
                          onChange={(e) => handleHeroAlt("alt_el", e.target.value)}
                          placeholder="π.χ. Η θάλασσα στη χρυσή ώρα έξω από το Home Seaside"
                        />
                      </label>
                      <button type="button" className="btn btn--danger btn--sm" onClick={handleHeroClear}>
                        <Trash2 size={14} /> Use built-in default again
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* JOURNEY */}
          {activeTab === "journey" && (
            <section className="photo-section" style={{ borderBottom: "none", paddingTop: 0 }}>
              <h3 className="photo-section__title">Journey photos</h3>
              <p className="photo-section__hint">
                Photos that scroll through morning → night on the homepage.
                Order them with the arrows — they appear in this exact order.
              </p>
              <ul className="photo-slot-list">
                {draft.journey.map((slot, idx) => (
                  <li key={slot.id} className="photo-slot">
                    <div className="photo-slot__thumb">
                      {slot.url
                        ? <img src={resolvePreviewUrl(slot.url)} alt="" />
                        : <div className="photo-slot__placeholder"><ImageIcon size={24} /></div>}
                    </div>
                    <div className="photo-slot__fields">
                      <label className="btn btn--secondary btn--sm">
                        <Upload size={12} />
                        {uploadingFor === `journey-${slot.id}` ? "Uploading…" : slot.url ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleJourneyUpload(slot.id, f);
                            e.target.value = "";
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </label>
                      <div className="subcat-edit-fields">
                        <label className="subcat-edit-field">
                          <span className="subcat-edit-field__label">Caption (EN)</span>
                          <input type="text" className="form-input form-input--sm"
                            value={slot.caption_en}
                            onChange={(e) => handleJourneyChange(slot.id, { caption_en: e.target.value })} />
                        </label>
                        <label className="subcat-edit-field">
                          <span className="subcat-edit-field__label">Caption (EL)</span>
                          <input type="text" className="form-input form-input--sm"
                            value={slot.caption_el}
                            onChange={(e) => handleJourneyChange(slot.id, { caption_el: e.target.value })} />
                        </label>
                      </div>
                    </div>
                    <div className="photo-slot__controls">
                      <button type="button" className="schedule__order-btn"
                        aria-label="Move up" disabled={idx === 0}
                        onClick={() => handleJourneyMove(slot.id, -1)}>
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" className="schedule__order-btn"
                        aria-label="Move down" disabled={idx === draft.journey.length - 1}
                        onClick={() => handleJourneyMove(slot.id, 1)}>
                        <ChevronDown size={14} />
                      </button>
                      <button type="button" className="schedule__order-btn"
                        aria-label="Remove photo"
                        onClick={() => handleJourneyRemove(slot.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleJourneyAdd}>
                <Plus size={14} /> Add journey photo
              </button>
              <p className="photo-section__deferred">
                Journey photos save to the server. Customer-side display currently
                shows bundled photos — uploaded ones will appear on the homepage
                once the homepage strip is wired up (on the punch list).
              </p>
            </section>
          )}

          {/* GALLERY */}
          {activeTab === "gallery" && (
            <section className="photo-section" style={{ borderBottom: "none", paddingTop: 0 }}>
              <h3 className="photo-section__title">Gallery photos</h3>
              <p className="photo-section__hint">
                Supporting photos for the homepage gallery strip. Add as many as you want.
              </p>
              <ul className="photo-slot-list">
                {draft.gallery.map((slot, idx) => (
                  <li key={slot.id} className="photo-slot">
                    <div className="photo-slot__thumb">
                      {slot.url
                        ? <img src={resolvePreviewUrl(slot.url)} alt="" />
                        : <div className="photo-slot__placeholder"><ImageIcon size={24} /></div>}
                    </div>
                    <div className="photo-slot__fields">
                      <label className="btn btn--secondary btn--sm">
                        <Upload size={12} />
                        {uploadingFor === `gallery-${slot.id}` ? "Uploading…" : slot.url ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleGalleryUpload(slot.id, f);
                            e.target.value = "";
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </label>
                      <div className="subcat-edit-fields">
                        <label className="subcat-edit-field">
                          <span className="subcat-edit-field__label">Alt (EN)</span>
                          <input type="text" className="form-input form-input--sm"
                            value={slot.alt_en}
                            onChange={(e) => handleGalleryChange(slot.id, { alt_en: e.target.value })} />
                        </label>
                        <label className="subcat-edit-field">
                          <span className="subcat-edit-field__label">Alt (EL)</span>
                          <input type="text" className="form-input form-input--sm"
                            value={slot.alt_el}
                            onChange={(e) => handleGalleryChange(slot.id, { alt_el: e.target.value })} />
                        </label>
                      </div>
                    </div>
                    <div className="photo-slot__controls">
                      <button type="button" className="schedule__order-btn"
                        aria-label="Move up" disabled={idx === 0}
                        onClick={() => handleGalleryMove(slot.id, -1)}>
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" className="schedule__order-btn"
                        aria-label="Move down" disabled={idx === draft.gallery.length - 1}
                        onClick={() => handleGalleryMove(slot.id, 1)}>
                        <ChevronDown size={14} />
                      </button>
                      <button type="button" className="schedule__order-btn"
                        aria-label="Remove photo"
                        onClick={() => handleGalleryRemove(slot.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleGalleryAdd}>
                <Plus size={14} /> Add gallery photo
              </button>
              <p className="photo-section__deferred">
                Gallery customer-side display wiring is on the punch list —
                uploads save to the server but the homepage still shows the
                bundled photos for now.
              </p>
            </section>
          )}

          {error && <div className="schedule__error" role="alert">{error}</div>}
        </div>
        <div className="modal-footer">
          <div className="modal-footer__right">
            <button className="btn btn--secondary" onClick={onClose} disabled={saving || uploadingFor !== null}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSave} disabled={saving || uploadingFor !== null}>
              {saving ? "Saving…" : "Save photos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Subcategory Editor — server-backed rename / reorder / hide
   ============================================================ */
interface SubcategoryEditorProps {
  items: MenuItemData[];
  onClose: () => void;
  onSaved: () => void;
}

const SUB_MAIN_LABELS: Record<SubMainCategoryId, string> = {
  coffee:     "Coffee & More",
  cocktails:  "Cocktails",
  "beer&wine": "Beer & Wine",
  food:       "Food",
  spirits:    "Spirits",
};

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

const SubcategoryEditor: FC<SubcategoryEditorProps> = ({ items, onClose, onSaved }) => {
  // Derive the canonical slug list from current items, keyed by main_category.
  const derived = useMemo(() => {
    const out: Record<SubMainCategoryId, { slug: string; label_en: string; label_el: string }[]> = {
      coffee: [], cocktails: [], "beer&wine": [], food: [], spirits: [],
    };
    const seen = new Set<string>();
    for (const item of items) {
      const main = (item.main_category ?? "coffee") as SubMainCategoryId;
      const enLabel = typeof item.category === "object" ? item.category.en : (item.category ?? "");
      const elLabel = typeof item.category === "object" ? item.category.el : (item.category ?? "");
      const slug = enLabel;
      if (!slug) continue;
      const key = `${main}::${slug.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out[main].push({ slug, label_en: enLabel, label_el: elLabel || enLabel });
    }
    return out;
  }, [items]);

  // Initial draft is the merge of derived + server overrides.
  const initial = useMemo(() => {
    void getOverrides; // hydration already happens at boot
    return mergeDerivedWithOverrides(derived);
  }, [derived]);

  const [draft, setDraft] = useState<SubcategoryOverrides>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openGroup, setOpenGroup] = useState<SubMainCategoryId | null>(() => SUB_MAIN_CATEGORIES[0]);

  // Refresh draft whenever the derived list shifts (e.g., an item was added).
  useEffect(() => { setDraft(initial); }, [initial]);

  const update = (main: SubMainCategoryId, idx: number, patch: Partial<SubcategoryOverrides[SubMainCategoryId][number]>) => {
    setDraft((prev) => {
      const arr = prev[main];
      const next = arr.map((row, i) => (i === idx ? { ...row, ...patch } : row));
      return { ...prev, [main]: next };
    });
  };

  const move = (main: SubMainCategoryId, idx: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const next = moveInArray(prev[main], idx, idx + direction).map((row, i) => ({ ...row, position: i }));
      return { ...prev, [main]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Renumber positions before saving to guarantee 0..N-1.
      const normalized: SubcategoryOverrides = { ...EMPTY_OVERRIDES };
      for (const mc of SUB_MAIN_CATEGORIES) {
        normalized[mc] = draft[mc].map((row, i) => ({ ...row, position: i }));
      }
      await saveSubcategoryOverrides(normalized);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save subcategories");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="subcat-editor-title">
      <div className="modal modal--subcat-editor">
        <div className="modal-header">
          <h2 id="subcat-editor-title" className="modal-title">Subcategories</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="schedule__intro">
            Rename subcategories per language, drag with the arrows to set the
            order, or hide a subcategory from the customer menu (items will
            still exist — they just won't appear).
          </p>

          {SUB_MAIN_CATEGORIES.map((mc) => {
            const rows = draft[mc];
            const isOpen = openGroup === mc;
            const hiddenCount = rows.filter((r) => r.hidden).length;
            return (
              <div key={mc} className="accordion-group">
                <button
                  type="button"
                  className="accordion-header"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : mc)}
                >
                  <span className="accordion-header__title">{SUB_MAIN_LABELS[mc]}</span>
                  <span className="accordion-header__right">
                    <span className="accordion-header__meta">
                      {rows.length} {rows.length === 1 ? "subcategory" : "subcategories"}
                      {hiddenCount > 0 && ` · ${hiddenCount} hidden`}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`accordion-header__chevron ${isOpen ? "accordion-header__chevron--open" : ""}`}
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="accordion-body">
                    {rows.length === 0 ? (
                      <p className="subcat-group__empty">No subcategories under this main category yet.</p>
                    ) : (
                      <ul className="subcat-edit-list">
                        {rows.map((row, idx) => (
                          <li key={row.slug} className={`subcat-edit-row ${row.hidden ? "subcat-edit-row--hidden" : ""}`}>
                            <span className="schedule__order-controls">
                              <button
                                type="button"
                                className="schedule__order-btn"
                                aria-label={`Move ${row.label_en} up`}
                                disabled={idx === 0}
                                onClick={() => move(mc, idx, -1)}
                              ><ChevronUp size={14} /></button>
                              <button
                                type="button"
                                className="schedule__order-btn"
                                aria-label={`Move ${row.label_en} down`}
                                disabled={idx === rows.length - 1}
                                onClick={() => move(mc, idx, 1)}
                              ><ChevronDown size={14} /></button>
                            </span>
                            <div className="subcat-edit-fields">
                              <label className="subcat-edit-field">
                                <span className="subcat-edit-field__label">English</span>
                                <input
                                  type="text"
                                  className="form-input form-input--sm"
                                  value={row.label_en}
                                  onChange={(e) => update(mc, idx, { label_en: e.target.value })}
                                />
                              </label>
                              <label className="subcat-edit-field">
                                <span className="subcat-edit-field__label">Ελληνικά</span>
                                <input
                                  type="text"
                                  className="form-input form-input--sm"
                                  value={row.label_el}
                                  onChange={(e) => update(mc, idx, { label_el: e.target.value })}
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              className={`schedule__order-btn subcat-edit-hide ${row.hidden ? "subcat-edit-hide--on" : ""}`}
                              aria-label={row.hidden ? `Show ${row.label_en} on menu` : `Hide ${row.label_en} from menu`}
                              aria-pressed={row.hidden}
                              onClick={() => update(mc, idx, { hidden: !row.hidden })}
                            >
                              {row.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {error && <div className="schedule__error" role="alert">{error}</div>}
        </div>
        <div className="modal-footer">
          <div className="modal-footer__right">
            <button className="btn btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save subcategories"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Item Form (modal) — with main category + subcategory + pricing
   ============================================================ */
interface ItemFormProps {
  item: MenuItemData | null;
  subcategories: SubcategoryDef[];
  onSave: () => void;
  onClose: () => void;
}

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: "single", label: "Single Price" },
  { value: "single_double", label: "Single / Double" },
  { value: "glass_bottle", label: "Glass / Bottle" },
];

const emptyForm = {
  nameEn: "",
  nameEl: "",
  descEn: "",
  descEl: "",
  mainCategory: "coffee" as MainCategoryId,
  subcategoryEn: "",
  price: "",
  pricingType: "single" as PricingType,
  priceSecondary: "",
  available: true,
  allergens: [] as string[],
  imageUrl: "" as string,
};

const ItemForm: FC<ItemFormProps> = ({ item, subcategories, onSave, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subcategories filtered by selected main category
  const availableSubs = subcategories.filter((s) => s.parent === form.mainCategory);

  useEffect(() => {
    if (item) {
      const mainCat = item.main_category || "coffee";
      const catEN = getField(item.category, "EN");
      setForm({
        nameEn: getField(item.name, "EN"),
        nameEl: getField(item.name, "EL"),
        descEn: getField(item.description, "EN"),
        descEl: getField(item.description, "EL"),
        mainCategory: mainCat,
        subcategoryEn: catEN,
        price: String(item.price),
        pricingType: item.pricing_type || "single",
        priceSecondary: item.price_secondary != null ? String(item.price_secondary) : "",
        available: item.available,
        allergens: item.allergens ?? [],
        imageUrl: item.image_url || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [item, subcategories]);

  // When main category changes, reset subcategory to first available
  const handleMainCategoryChange = (mc: MainCategoryId) => {
    const subs = subcategories.filter((s) => s.parent === mc);
    setForm((p) => ({
      ...p,
      mainCategory: mc,
      subcategoryEn: subs.length > 0 ? subs[0].en : "",
    }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    e.target.value = "";
  };

  const handleCropDone = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "item-photo.jpg");
      const res = await axios.post(UPLOAD_API, formData, {
        headers: { "Content-Type": "multipart/form-data", ...authHeaders() },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Find the subcategory definition
    const sub = subcategories.find((s) => s.en === form.subcategoryEn && s.parent === form.mainCategory);
    if (!sub) {
      setError("Please select a valid subcategory.");
      setSaving(false);
      return;
    }

    const payload = {
      menu_item: {
        name: { en: form.nameEn, el: form.nameEl },
        description: { en: form.descEn, el: form.descEl },
        main_category: form.mainCategory,
        category: { en: sub.en, el: sub.el },
        price: parseFloat(form.price) || 0,
        pricing_type: form.pricingType,
        price_secondary: form.pricingType !== "single" ? (parseFloat(form.priceSecondary) || null) : null,
        available: form.available,
        allergens: form.allergens,
        image_url: form.imageUrl || null,
      },
    };

    try {
      const config = { headers: authHeaders() };
      if (item) {
        await axios.patch(`${API}/${getId(item)}`, payload, config);
      } else {
        await axios.post(API, payload, config);
      }
      onSave();
    } catch {
      setError("Failed to save. Check all fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = getImageFullUrl(form.imageUrl);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={item ? "Edit menu item" : "Add menu item"}>
      <div className="modal-content modal-content--wide">
        <div className="modal-header">
          <h2 className="modal-title">{item ? "Edit Item" : "New Item"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="toast toast--error" style={{ position: "static", transform: "none", marginBottom: "var(--sp-5)" }} role="alert">
                {error}
              </div>
            )}

            {/* Photo upload */}
            <div className="form-group">
              <label className="form-label">Photo</label>
              {cropFile ? (
                <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />
              ) : previewUrl ? (
                <div className="image-preview">
                  <img src={previewUrl} alt="Item preview" className="image-preview__img" />
                  <div className="image-preview__actions">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={14} /> Replace
                    </button>
                    <button type="button" className="btn btn--danger btn--sm" onClick={handleRemoveImage}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="image-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <ImageIcon size={24} strokeWidth={1.5} />
                      <span>Click to upload photo</span>
                      <span className="image-upload-btn__hint">JPG, PNG, WebP — max 5MB — will be cropped to 1:1</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handleFileSelect} />
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Name</label>
              <div className="form-row">
                <div>
                  <input type="text" className="form-input" placeholder="English name" value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} required />
                  <span className="form-hint">EN</span>
                </div>
                <div>
                  <input type="text" className="form-input" placeholder="Ελληνικό όνομα" value={form.nameEl} onChange={(e) => setForm((p) => ({ ...p, nameEl: e.target.value }))} required />
                  <span className="form-hint">EL</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <div className="form-row">
                <div>
                  <textarea className="form-textarea" placeholder="English description (optional)" value={form.descEn} onChange={(e) => setForm((p) => ({ ...p, descEn: e.target.value }))} />
                  <span className="form-hint">EN</span>
                </div>
                <div>
                  <textarea className="form-textarea" placeholder="Ελληνική περιγραφή (προαιρετική)" value={form.descEl} onChange={(e) => setForm((p) => ({ ...p, descEl: e.target.value }))} />
                  <span className="form-hint">EL</span>
                </div>
              </div>
            </div>

            {/* Main category + Subcategory */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Main Category</label>
                <select className="form-select" value={form.mainCategory} onChange={(e) => handleMainCategoryChange(e.target.value as MainCategoryId)}>
                  {MAIN_CATEGORIES.map((mc) => (
                    <option key={mc.id} value={mc.id}>{mc.en}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={form.subcategoryEn}
                  onChange={(e) => setForm((p) => ({ ...p, subcategoryEn: e.target.value }))}
                >
                  {availableSubs.length === 0 && (
                    <option value="">— No subcategories —</option>
                  )}
                  {availableSubs.map((s) => (
                    <option key={s.en} value={s.en}>{s.en} / {s.el}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing type */}
            <div className="form-group">
              <label className="form-label">Pricing Type</label>
              <div className="pricing-type-selector">
                {PRICING_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    className={`pricing-type-option ${form.pricingType === pt.value ? "pricing-type-option--active" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, pricingType: pt.value }))}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price fields */}
            <div className="form-group">
              <label className="form-label">
                {form.pricingType === "single" ? "Price (€)" : "Prices (€)"}
              </label>
              {form.pricingType === "single" ? (
                <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
              ) : (
                <div className="form-row">
                  <div>
                    <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
                    <span className="form-hint">{form.pricingType === "single_double" ? "Single" : "Glass"}</span>
                  </div>
                  <div>
                    <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={form.priceSecondary} onChange={(e) => setForm((p) => ({ ...p, priceSecondary: e.target.value }))} required />
                    <span className="form-hint">{form.pricingType === "single_double" ? "Double" : "Bottle"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Allergens */}
            <div className="form-group">
              <label className="form-label">Allergens</label>
              <div className="allergen-grid">
                {KNOWN_ALLERGENS.map((a) => (
                  <label key={a} className="form-checkbox">
                    <input type="checkbox" checked={form.allergens.includes(a)} onChange={() => handleAllergenToggle(a)} />
                    <span className="form-checkbox__label">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Available */}
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm((p) => ({ ...p, available: e.target.checked }))} />
                <span className="form-checkbox__label">Available on menu</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
              {saving ? "Saving..." : item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================
   Schedule Panel — admin overrides for time-of-day phase cutoffs
   ============================================================ */
interface SchedulePanelProps {
  onClose: () => void;
  onSaved: () => void;
}

const PHASE_LABELS: Record<DayPhase, { label: string; hint: string }> = {
  morning:   { label: "Morning",   hint: "Opening, light coffee, food" },
  afternoon: { label: "Afternoon", hint: "Brunch, lighter cocktails" },
  golden:    { label: "Golden",    hint: "Aperitivo, sunset mood" },
  evening:   { label: "Evening",   hint: "Full bar, cocktails forward" },
  night:     { label: "Night",     hint: "Late, spirits, low-key" },
};

const CATEGORY_LABELS: Record<string, string> = {
  coffee:     "Coffee & More",
  cocktails:  "Cocktails",
  "beer&wine": "Beer & Wine",
  food:       "Food",
  spirits:    "Spirits",
};

const fmtHour = (h: number): string => `${String(h).padStart(2, "0")}:00`;

function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function schedulesEqual(a: DaySchedule, b: DaySchedule): boolean {
  for (const p of PHASE_ORDER) {
    if (a.cutoffs[p] !== b.cutoffs[p]) return false;
    const aOrder = a.categoryOrder[p];
    const bOrder = b.categoryOrder[p];
    if (aOrder.length !== bOrder.length) return false;
    for (let i = 0; i < aOrder.length; i++) {
      if (aOrder[i] !== bOrder[i]) return false;
    }
  }
  return true;
}

const SchedulePanel: FC<SchedulePanelProps> = ({ onClose, onSaved }) => {
  const [initial] = useState<DaySchedule>(() => getSchedule());
  const [draft, setDraft] = useState<DaySchedule>(() => getSchedule());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activePhase, setActivePhase] = useState<DayPhase>(PHASE_ORDER[0]);

  const validate = useCallback((d: DaySchedule): string | null => {
    let prev = -1;
    for (const phase of PHASE_ORDER) {
      const v = d.cutoffs[phase];
      if (!Number.isInteger(v) || v < 0 || v > 23) {
        return `${PHASE_LABELS[phase].label} must be an hour between 0 and 23.`;
      }
      if (v <= prev) {
        return `${PHASE_LABELS[phase].label} must come after the previous phase.`;
      }
      prev = v;
      if (!Array.isArray(d.categoryOrder[phase]) || d.categoryOrder[phase].length === 0) {
        return `${PHASE_LABELS[phase].label} must have at least one category.`;
      }
    }
    return null;
  }, []);

  const handleCutoffChange = (phase: DayPhase, value: number) => {
    const next: DaySchedule = {
      ...draft,
      cutoffs: { ...draft.cutoffs, [phase]: value },
    };
    setDraft(next);
    setError(validate(next));
  };

  const handleMove = (phase: DayPhase, from: number, direction: -1 | 1) => {
    const next: DaySchedule = {
      ...draft,
      categoryOrder: {
        ...draft.categoryOrder,
        [phase]: reorderArray(draft.categoryOrder[phase], from, from + direction),
      },
    };
    setDraft(next);
    setError(validate(next));
  };

  const handleSave = async () => {
    const err = validate(draft);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await saveSchedule(draft);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetSchedule();
      setDraft(DEFAULT_SCHEDULE);
      setError(null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset schedule");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = !schedulesEqual(draft, initial);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="schedule-title">
      <div className="modal modal--schedule">
        <div className="modal-header">
          <h2 id="schedule-title" className="modal-title">Daily Schedule</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Phase tabs — one tab per phase, shows cutoff time below the label */}
        <div className="modal-tabs" role="tablist" aria-label="Day phases">
          {PHASE_ORDER.map((phase) => (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={activePhase === phase}
              className={`modal-tab ${activePhase === phase ? "modal-tab--active" : ""}`}
              onClick={() => setActivePhase(phase)}
            >
              {PHASE_LABELS[phase].label}
              <span className="modal-tab__time">{fmtHour(draft.cutoffs[phase])}</span>
            </button>
          ))}
        </div>

        <div className="modal-body">
          <p className="schedule__intro">
            Set when this phase starts and which categories appear first. Switch
            tabs to configure other phases. The cutoff times must be in ascending
            order across all five phases.
          </p>

          <div className="schedule__phase-card" role="tabpanel">
            <div className="schedule__phase-header">
              <div>
                <div className="schedule__phase-name">{PHASE_LABELS[activePhase].label}</div>
                <div className="schedule__phase-hint">{PHASE_LABELS[activePhase].hint}</div>
              </div>
              <label className="schedule__input-wrap">
                <span className="schedule__input-label">Starts at</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  step={1}
                  value={draft.cutoffs[activePhase]}
                  onChange={(e) => handleCutoffChange(activePhase, parseInt(e.target.value, 10))}
                  className="schedule__input"
                  aria-label={`${PHASE_LABELS[activePhase].label} start hour`}
                />
                <span className="schedule__input-suffix">{fmtHour(draft.cutoffs[activePhase])}</span>
              </label>
            </div>
            <ul className="schedule__order-list" aria-label={`Category order for ${PHASE_LABELS[activePhase].label}`}>
              {draft.categoryOrder[activePhase].map((cat, idx) => (
                <li key={cat} className="schedule__order-row">
                  <span className="schedule__order-rank">{idx + 1}</span>
                  <span className="schedule__order-name">{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="schedule__order-controls">
                    <button
                      type="button"
                      className="schedule__order-btn"
                      aria-label={`Move ${CATEGORY_LABELS[cat] ?? cat} up`}
                      disabled={idx === 0}
                      onClick={() => handleMove(activePhase, idx, -1)}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="schedule__order-btn"
                      aria-label={`Move ${CATEGORY_LABELS[cat] ?? cat} down`}
                      disabled={idx === draft.categoryOrder[activePhase].length - 1}
                      onClick={() => handleMove(activePhase, idx, 1)}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="schedule__error" role="alert">{error}</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={handleReset} disabled={saving}>
            <RotateCcw size={14} /> Reset to defaults
          </button>
          <div className="modal-footer__right">
            <button className="btn btn--secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSave} disabled={!!error || !isDirty || saving}>
              {saving ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Admin Panel (main)
   ============================================================ */
interface AdminPanelProps {
  language: Language;
}

type ToastState = { message: string; type: "success" | "error" } | null;

const AdminPanel: FC<AdminPanelProps> = ({ language }) => {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [showSubcatManager, setShowSubcatManager] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [knownSubcategories, setKnownSubcategories] = useState(loadSubcategories);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get<MenuItemData[]>(`${API}?all=true`);
      setItems(res.data);
    } catch {
      showToast("Failed to load items", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Build subcategories from fetched items, merging with any saved in localStorage
  useEffect(() => {
    if (items.length === 0) return;
    const fromItems = buildSubcategoriesFromItems(items);
    const saved = loadSubcategories();
    // Merge: start with items-derived, add any saved ones not already present
    const merged = [...fromItems];
    for (const s of saved) {
      const key = `${s.parent}::${s.en.toLowerCase()}`;
      if (!merged.some((m) => `${m.parent}::${m.en.toLowerCase()}` === key)) {
        merged.push(s);
      }
    }
    setKnownSubcategories(merged);
    saveSubcategories(merged);
  }, [items]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (item: MenuItemData) => {
    if (!window.confirm(`Delete "${getField(item.name, "EN")}"?`)) return;
    try {
      await axios.delete(`${API}/${getId(item)}`, { headers: authHeaders() });
      showToast("Item deleted", "success");
      fetchItems();
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingItem(null);
    showToast(editingItem ? "Item updated" : "Item created", "success");
    fetchItems();
  };

  const handleEdit = (item: MenuItemData) => { setEditingItem(item); setShowForm(true); };
  const handleAdd = () => { setEditingItem(null); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingItem(null); };

  // For filter pills — show subcategory names
  const categories = Array.from(new Set(items.map((i) => getField(i.category, "EN")))).sort();

  const filtered = items.filter((item) => {
    if (filterCategory && getField(item.category, "EN") !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        getField(item.name, "EN").toLowerCase().includes(q) ||
        getField(item.name, "EL").toLowerCase().includes(q) ||
        getField(item.category, "EN").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Menu Management</h1>
          <p className="admin-subtitle">
            {items.length} items total
            {filtered.length !== items.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div className="admin-header__actions">
          <button className="btn btn--secondary" onClick={() => setShowSchedule(true)}>
            <Clock size={16} /> Schedule
          </button>
          <button className="btn btn--secondary" onClick={() => setShowSubcatManager(true)}>
            <FolderPlus size={16} /> Subcategories
          </button>
          <button className="btn btn--secondary" onClick={() => setShowPhotos(true)}>
            <ImageIcon size={16} /> Photos
          </button>
          <button className="btn btn--primary" onClick={handleAdd}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search">
        <Search size={16} className="admin-search__icon" />
        <input type="text" className="admin-search__input" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {searchQuery && (
          <button className="admin-search__clear" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={14} /></button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="admin-filters" role="group" aria-label="Filter by category">
          <button className={`admin-filter-btn ${!filterCategory ? "admin-filter-btn--active" : ""}`} onClick={() => setFilterCategory(null)}>All</button>
          {categories.map((cat) => (
            <button key={cat} className={`admin-filter-btn ${filterCategory === cat ? "admin-filter-btn--active" : ""}`} onClick={() => setFilterCategory(cat)}>{cat}</button>
          ))}
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <p style={{ color: "var(--text-tertiary)", padding: "var(--sp-5)" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><p>{searchQuery ? "No items match your search." : "No items yet. Add your first item!"}</p></div>
      ) : (
        <div className="admin-list" role="list">
          {filtered.map((item) => {
            const thumbUrl = getImageFullUrl(item.image_url);
            return (
              <div key={getId(item)} className={`admin-item ${!item.available ? "admin-item--unavailable" : ""}`} role="listitem">
                {thumbUrl ? (
                  <div className="admin-item__thumb">
                    <img src={thumbUrl} alt="" className="admin-item__thumb-img" />
                  </div>
                ) : (
                  <div className="admin-item__thumb admin-item__thumb--empty">
                    <ImageIcon size={16} strokeWidth={1.5} />
                  </div>
                )}
                <div className="admin-item__info">
                  <div className="admin-item__name">{getField(item.name, language)}</div>
                  <div className="admin-item__meta">
                    <span className="admin-item__category">{getField(item.category, language)}</span>
                    {!item.available && (<><span className="admin-item__dot" /><span>Unavailable</span></>)}
                    {item.allergens && item.allergens.length > 0 && (
                      <><span className="admin-item__dot" /><span>{item.allergens.length} allergen{item.allergens.length > 1 ? "s" : ""}</span></>
                    )}
                  </div>
                </div>
                <span className="admin-item__price">
                  {item.pricing_type && item.pricing_type !== "single" && item.price_secondary != null
                    ? `${item.price.toFixed(2)}€ / ${item.price_secondary.toFixed(2)}€`
                    : `${item.price.toFixed(2)}€`}
                </span>
                <div className="admin-item__actions">
                  <button className="btn btn--secondary btn--sm" onClick={() => handleEdit(item)} aria-label={`Edit ${getField(item.name, "EN")}`}><Pencil size={14} /></button>
                  <button className="btn btn--danger btn--sm" onClick={() => handleDelete(item)} aria-label={`Delete ${getField(item.name, "EN")}`}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <ItemForm item={editingItem} subcategories={knownSubcategories} onSave={handleSave} onClose={handleCloseForm} />}
      {showSubcatManager && (
        <SubcategoryEditor
          items={items}
          onClose={() => setShowSubcatManager(false)}
          onSaved={() => showToast("Subcategories updated", "success")}
        />
      )}
      {showSchedule && <SchedulePanel onClose={() => setShowSchedule(false)} onSaved={() => showToast("Schedule updated", "success")} />}
      {showPhotos && <PhotoManager onClose={() => setShowPhotos(false)} onSaved={() => showToast("Photos updated", "success")} />}
      {toast && <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">{toast.message}</div>}
    </div>
  );
};

export default AdminPanel;
