import { useState, useEffect, useCallback, useRef } from "react";
import type { FC, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import {
  Plus, Pencil, Trash2, X, FolderPlus, Search,
  Upload, Image as ImageIcon, Crop,
} from "lucide-react";
import { getAdminToken } from "../App";
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
  const [imgSrc, setImgSrc] = useState<string>("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
   Subcategory Management Modal — now grouped by main category
   ============================================================ */
interface SubcategoryManagerProps {
  subcategories: SubcategoryDef[];
  onSubcategoriesChange: (subs: SubcategoryDef[]) => void;
  onClose: () => void;
}

const SubcategoryManager: FC<SubcategoryManagerProps> = ({
  subcategories, onSubcategoriesChange, onClose,
}) => {
  const [newEn, setNewEn] = useState("");
  const [newEl, setNewEl] = useState("");
  const [newParent, setNewParent] = useState<MainCategoryId>("coffee");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimEn = newEn.trim();
    const trimEl = newEl.trim();
    if (!trimEn || !trimEl) {
      setError("Both English and Greek names are required.");
      return;
    }
    if (subcategories.some((c) => c.en.toLowerCase() === trimEn.toLowerCase())) {
      setError("A subcategory with this English name already exists.");
      return;
    }
    onSubcategoriesChange([...subcategories, { en: trimEn, el: trimEl, parent: newParent }]);
    setNewEn("");
    setNewEl("");
  };

  const handleDelete = (idx: number) => {
    onSubcategoriesChange(subcategories.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Manage subcategories">
      <div className="modal-content modal-content--wide">
        <div className="modal-header">
          <h2 className="modal-title">Manage Subcategories</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="toast toast--error" style={{ position: "static", transform: "none", marginBottom: "var(--sp-5)" }} role="alert">
              {error}
            </div>
          )}
          <form className="subcat-add-form" onSubmit={handleAdd}>
            <select className="form-select" value={newParent} onChange={(e) => setNewParent(e.target.value as MainCategoryId)} style={{ flex: "0 0 auto", width: "auto" }}>
              {MAIN_CATEGORIES.map((mc) => (
                <option key={mc.id} value={mc.id}>{mc.en}</option>
              ))}
            </select>
            <input type="text" className="form-input" placeholder="Name (English)" value={newEn} onChange={(e) => setNewEn(e.target.value)} />
            <input type="text" className="form-input" placeholder="Όνομα (Ελληνικά)" value={newEl} onChange={(e) => setNewEl(e.target.value)} />
            <button type="submit" className="btn btn--primary"><Plus size={16} /> Add</button>
          </form>

          {/* Grouped by main category */}
          {MAIN_CATEGORIES.map((mc) => {
            const subs = subcategories.filter((s) => s.parent === mc.id);
            if (subs.length === 0) return (
              <div key={mc.id} className="subcat-group">
                <div className="subcat-group__title">{mc.en}</div>
                <p className="subcat-group__empty">No subcategories yet</p>
              </div>
            );
            return (
              <div key={mc.id} className="subcat-group">
                <div className="subcat-group__title">{mc.en}</div>
                <div className="subcat-list" role="list">
                  {subs.map((sub) => {
                    const globalIdx = subcategories.indexOf(sub);
                    return (
                      <div key={sub.en} className="subcat-item" role="listitem">
                        <div className="subcat-item__info">
                          <span className="subcat-item__name">{sub.en}</span>
                          <span className="subcat-item__name-el">{sub.el}</span>
                        </div>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(globalIdx)} aria-label={`Delete ${sub.en}`}><Trash2 size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>Done</button>
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
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSubcategoriesChange = (subs: SubcategoryDef[]) => {
    setKnownSubcategories(subs);
    saveSubcategories(subs);
  };

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
          <button className="btn btn--secondary" onClick={() => setShowSubcatManager(true)}>
            <FolderPlus size={16} /> Subcategories
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
      {showSubcatManager && <SubcategoryManager subcategories={knownSubcategories} onSubcategoriesChange={handleSubcategoriesChange} onClose={() => setShowSubcatManager(false)} />}
      {toast && <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">{toast.message}</div>}
    </div>
  );
};

export default AdminPanel;
