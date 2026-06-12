/**
 * Site-content CMS editor modal.
 *
 * Tabs: Home · About · Visit · FAQ · Categories · Business Info · Illustrations
 *
 * Lifecycle footer:
 *   [Discard draft] [Restore previous]  ·  [Save draft] [Preview] [Publish]
 *
 * Seeds from the server draft when one exists, else from published content.
 * Validates both languages before publishing; errors are clickable to jump
 * to the relevant tab.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import type { FC, ChangeEvent } from "react";
import {
  X, Plus, Trash2, ChevronUp, ChevronDown,
  Image as ImageIcon, Upload, RotateCcw, Eye, FileText,
} from "lucide-react";
import {
  DEFAULT_SITE_CONTENT,
  fetchContentDraft,
  saveContentDraft,
  discardContentDraft,
  publishContent,
  revertContent,
  enterContentPreview,
  getPublishedSiteContent,
  normalizeSiteContent,
  validateForPublish,
  illustrationSrc,
  type SiteContent,
  type AboutChapter,
  type FaqItem,
  type HoursRow,
  type ContentPhotoRef,
  type IllustrationRef,
  type LocalizedText,
  type CategoryContentSlug,
  type PublishError,
} from "../config/siteContent";
import { uploadResponsivePhoto } from "../lib/imageUpload";
import { ALBUM1_PHOTOS } from "../assets/photos/album1";
import { resolveAssetUrl } from "../config/api";
import ImageCropper from "./ImageCropper";
import "../styles/ContentManager.css";

/* ============================================================
   Reusable field atoms
   ============================================================ */

interface LocalizedInputProps {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

const LocalizedInput: FC<LocalizedInputProps> = ({
  label, value, onChange, multiline = false, rows = 3, required,
}) => (
  <div style={{ marginBottom: "var(--sp-4)" }}>
    <span className="cm-field-label">{label}</span>
    <div className="cm-localized">
      <div>
        <span className="cm-localized__label">English</span>
        {multiline ? (
          <textarea
            className="form-input"
            rows={rows}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            required={required}
            style={{ width: "100%", resize: "vertical" }}
          />
        ) : (
          <input
            type="text"
            className="form-input"
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            required={required}
          />
        )}
      </div>
      <div>
        <span className="cm-localized__label">Greek</span>
        {multiline ? (
          <textarea
            className="form-input"
            rows={rows}
            value={value.el}
            onChange={(e) => onChange({ ...value, el: e.target.value })}
            required={required}
            style={{ width: "100%", resize: "vertical" }}
          />
        ) : (
          <input
            type="text"
            className="form-input"
            value={value.el}
            onChange={(e) => onChange({ ...value, el: e.target.value })}
            required={required}
          />
        )}
      </div>
    </div>
  </div>
);

/* ── Photo Reference Picker ────────────────────────────────── */

interface PhotoRefPickerProps {
  label: string;
  value: ContentPhotoRef;
  onChange: (next: ContentPhotoRef) => void;
  /** "hero" = 16:9, "chapter" = 4:3 (default) */
  variant?: "hero" | "chapter";
}

const PhotoRefPicker: FC<PhotoRefPickerProps> = ({
  label, value, onChange, variant = "chapter",
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = variant === "hero" ? 16 / 9 : 4 / 3;

  const thumbSrc = (() => {
    if (value.kind === "bundled") {
      const meta = ALBUM1_PHOTOS[value.slug];
      return meta ? meta.src.jpg[400] : null;
    }
    return resolveAssetUrl(value.srcset?.["640"] ?? value.url) ?? null;
  })();

  const handleCropDone = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setUploadError(null);
    try {
      const manifest = await uploadResponsivePhoto(blob);
      onChange({
        kind: "custom",
        url: manifest.url,
        srcset: {
          "640": manifest.srcset[640],
          "1280": manifest.srcset[1280],
          "1920": manifest.srcset[1920],
        },
        width: manifest.width,
        height: manifest.height,
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (cropFile) {
    return (
      <div style={{ marginBottom: "var(--sp-4)" }}>
        <span className="cm-field-label">{label}</span>
        <ImageCropper
          file={cropFile}
          aspectRatio={aspectRatio}
          onCrop={(blob) => void handleCropDone(blob)}
          onCancel={() => setCropFile(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <span className="cm-field-label">{label}</span>
      <div className="cm-photo-slot">
        <div className={`cm-photo-slot__preview ${variant === "hero" ? "cm-photo-slot__preview--hero" : ""}`}>
          {thumbSrc ? (
            <img src={thumbSrc} alt="" />
          ) : (
            <div className="cm-photo-slot__empty">
              <ImageIcon size={28} strokeWidth={1.4} />
              <span>No photo selected</span>
            </div>
          )}
        </div>
        <div className="cm-photo-slot__actions">
          <span className="cm-photo-slug">
            {value.kind === "bundled" ? value.slug || "—" : "Custom upload"}
          </span>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setPickerOpen((v) => !v)}
          >
            {pickerOpen ? "Close library" : "Pick from library"}
          </button>
          <label className="btn btn--secondary btn--sm" style={{ cursor: "pointer" }}>
            <Upload size={12} />
            {uploading ? "Uploading…" : "Upload"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) setCropFile(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
          </label>
        </div>

        {uploadError && (
          <div className="schedule__error" role="alert" style={{ margin: "var(--sp-2) var(--sp-3)" }}>
            {uploadError}
          </div>
        )}

        {pickerOpen && (
          <div className="cm-album-picker">
            <p className="cm-album-picker__hint">Click a photo to select it as the {label.toLowerCase()}.</p>
            <div className="cm-album-grid">
              {Object.entries(ALBUM1_PHOTOS).map(([slug, meta]) => (
                <button
                  key={slug}
                  type="button"
                  className={`cm-album-thumb ${value.kind === "bundled" && value.slug === slug ? "cm-album-thumb--selected" : ""}`}
                  title={slug}
                  onClick={() => {
                    onChange({ kind: "bundled", slug });
                    setPickerOpen(false);
                  }}
                >
                  <img src={meta.src.jpg[400]} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Illustration Slot ─────────────────────────────────────── */

interface IllustrationSlotProps {
  label: string;
  value: IllustrationRef;
  defaultPath: string;
  onChange: (next: IllustrationRef) => void;
}

const IllustrationSlot: FC<IllustrationSlotProps> = ({ label, value, defaultPath, onChange }) => {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const src = illustrationSrc(value, defaultPath);

  const handleCropDone = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setUploadError(null);
    try {
      const manifest = await uploadResponsivePhoto(blob);
      onChange({
        kind: "custom",
        url: manifest.url,
        srcset: {
          "640": manifest.srcset[640],
          "1280": manifest.srcset[1280],
          "1920": manifest.srcset[1920],
        },
        width: manifest.width,
        height: manifest.height,
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (cropFile) {
    return (
      <div style={{ marginBottom: "var(--sp-4)" }}>
        <span className="cm-illus-slot__label">{label}</span>
        <ImageCropper
          file={cropFile}
          aspectRatio={1}
          onCrop={(blob) => void handleCropDone(blob)}
          onCancel={() => setCropFile(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <span className="cm-illus-slot__label">{label}</span>
      <div className="cm-illus-slot">
        <div className="cm-illus-slot__preview">
          <img src={src} alt="" />
        </div>
        <div className="cm-illus-slot__actions">
          <label className="btn btn--secondary btn--sm" style={{ cursor: "pointer" }}>
            <Upload size={12} />
            {uploading ? "Uploading…" : "Upload new"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) setCropFile(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
          </label>
          {value.kind === "custom" && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onChange({ kind: "default" })}
            >
              <RotateCcw size={12} /> Reset to default
            </button>
          )}
        </div>
        {uploadError && (
          <div className="schedule__error" role="alert" style={{ margin: "var(--sp-2) var(--sp-3)" }}>
            {uploadError}
          </div>
        )}
      </div>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
        {value.kind === "default" ? `Using bundled default (${defaultPath})` : "Custom upload active"}
      </span>
    </div>
  );
};

/* ============================================================
   Tab sections
   ============================================================ */

interface TabHomeProps {
  draft: SiteContent;
  setDraft: React.Dispatch<React.SetStateAction<SiteContent>>;
}

const TabHome: FC<TabHomeProps> = ({ draft, setDraft }) => {
  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteContent;
        const parts = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [setDraft],
  );

  const addHoursRow = () => {
    const newRow: HoursRow = { id: `row-${Date.now()}`, day: { en: "", el: "" }, time: "" };
    setDraft((prev) => ({
      ...prev,
      home: { ...prev.home, hours: { ...prev.home.hours, rows: [...prev.home.hours.rows, newRow] } },
    }));
  };

  const removeHoursRow = (idx: number) => {
    setDraft((prev) => {
      const rows = [...prev.home.hours.rows];
      rows.splice(idx, 1);
      return { ...prev, home: { ...prev.home, hours: { ...prev.home.hours, rows } } };
    });
  };

  const moveHoursRow = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const rows = [...prev.home.hours.rows];
      const to = idx + dir;
      if (to < 0 || to >= rows.length) return prev;
      [rows[idx], rows[to]] = [rows[to], rows[idx]];
      return { ...prev, home: { ...prev.home, hours: { ...prev.home.hours, rows } } };
    });
  };

  const updateHoursRow = (idx: number, patch: Partial<HoursRow>) => {
    setDraft((prev) => {
      const rows = prev.home.hours.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      return { ...prev, home: { ...prev.home, hours: { ...prev.home.hours, rows } } };
    });
  };

  const { home } = draft;

  return (
    <div className="cm-section">
      <p className="schedule__intro" style={{ marginTop: 0 }}>
        Hero subtitle, journey intro, the "About us" and "Come see us" blocks on the homepage, opening hours, and the contact section title.
      </p>

      <p className="cm-section__title">Hero</p>
      <LocalizedInput
        label="Hero subtitle"
        value={home.heroSubtitle}
        onChange={(v) => set("home.heroSubtitle", v)}
      />

      <p className="cm-section__title">Journey strip</p>
      <LocalizedInput
        label="Section title"
        value={home.journeyTitle}
        onChange={(v) => set("home.journeyTitle", v)}
      />

      <p className="cm-section__title">About block</p>
      <LocalizedInput label="Title" value={home.about.title} onChange={(v) => set("home.about.title", v)} />
      <LocalizedInput label="Body text" value={home.about.body} onChange={(v) => set("home.about.body", v)} multiline rows={3} />
      <LocalizedInput label="Link label" value={home.about.ctaLabel} onChange={(v) => set("home.about.ctaLabel", v)} />

      <p className="cm-section__title">Visit block</p>
      <LocalizedInput label="Title" value={home.visit.title} onChange={(v) => set("home.visit.title", v)} />
      <LocalizedInput label="Body text" value={home.visit.body} onChange={(v) => set("home.visit.body", v)} multiline rows={3} />
      <LocalizedInput label="Link label" value={home.visit.ctaLabel} onChange={(v) => set("home.visit.ctaLabel", v)} />

      <p className="cm-section__title">Opening hours</p>
      <LocalizedInput label="Section title" value={home.hours.title} onChange={(v) => set("home.hours.title", v)} />

      <ul className="cm-list">
        {home.hours.rows.map((row, idx) => (
          <li key={row.id} className="cm-list-item">
            <div className="cm-list-item__header">
              <span className="cm-list-item__num">{idx + 1}</span>
              <span className="cm-list-item__title">{row.day.en || "New row"}</span>
              <span className="cm-list-item__controls">
                <button
                  type="button"
                  className="schedule__order-btn"
                  disabled={idx === 0}
                  onClick={() => moveHoursRow(idx, -1)}
                  aria-label="Move up"
                ><ChevronUp size={14} /></button>
                <button
                  type="button"
                  className="schedule__order-btn"
                  disabled={idx === home.hours.rows.length - 1}
                  onClick={() => moveHoursRow(idx, 1)}
                  aria-label="Move down"
                ><ChevronDown size={14} /></button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => removeHoursRow(idx)}
                  aria-label="Remove row"
                ><Trash2 size={12} /></button>
              </span>
            </div>
            <LocalizedInput
              label="Day label"
              value={row.day}
              onChange={(v) => updateHoursRow(idx, { day: v })}
            />
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <span className="cm-field-label">Hours (shared, e.g. "09:00 – 00:00")</span>
              <input
                type="text"
                className="form-input"
                value={row.time}
                onChange={(e) => updateHoursRow(idx, { time: e.target.value })}
                placeholder="09:00 – 00:00"
              />
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="cm-add-btn" onClick={addHoursRow}>
        <Plus size={14} /> Add hours row
      </button>

      <p className="cm-section__title">Contact section</p>
      <LocalizedInput
        label="Section title"
        value={home.contactTitle}
        onChange={(v) => set("home.contactTitle", v)}
      />
    </div>
  );
};

/* ── About tab ──────────────────────────────────────────────── */

const TabAbout: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteContent;
        const parts = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [setDraft],
  );

  const addChapter = () => {
    const ch: AboutChapter = {
      id: `chapter-${Date.now()}`,
      title: { en: "", el: "" },
      body: { en: "", el: "" },
      photo: { kind: "bundled", slug: "" },
      photoAlt: { en: "", el: "" },
    };
    setDraft((prev) => ({
      ...prev,
      about: { ...prev.about, chapters: [...prev.about.chapters, ch] },
    }));
  };

  const removeChapter = (idx: number) => {
    setDraft((prev) => {
      const chapters = [...prev.about.chapters];
      chapters.splice(idx, 1);
      return { ...prev, about: { ...prev.about, chapters } };
    });
  };

  const moveChapter = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const chapters = [...prev.about.chapters];
      const to = idx + dir;
      if (to < 0 || to >= chapters.length) return prev;
      [chapters[idx], chapters[to]] = [chapters[to], chapters[idx]];
      return { ...prev, about: { ...prev.about, chapters } };
    });
  };

  const updateChapter = (idx: number, patch: Partial<AboutChapter>) => {
    setDraft((prev) => {
      const chapters = prev.about.chapters.map((c, i) => (i === idx ? { ...c, ...patch } : c));
      return { ...prev, about: { ...prev.about, chapters } };
    });
  };

  const { about } = draft;

  return (
    <div className="cm-section">
      <p className="cm-section__title">Page header</p>
      <LocalizedInput label="Eyebrow" value={about.eyebrow} onChange={(v) => set("about.eyebrow", v)} />
      <LocalizedInput label="Title" value={about.title} onChange={(v) => set("about.title", v)} />
      <LocalizedInput label="Intro paragraph" value={about.lede} onChange={(v) => set("about.lede", v)} multiline rows={3} />

      <p className="cm-section__title">Hero photo</p>
      <PhotoRefPicker
        label="Hero photo"
        value={about.heroPhoto}
        onChange={(v) => set("about.heroPhoto", v)}
        variant="hero"
      />
      <LocalizedInput label="Hero photo alt text" value={about.heroAlt} onChange={(v) => set("about.heroAlt", v)} />

      <p className="cm-section__title">Chapters ({about.chapters.length})</p>
      <ul className="cm-list">
        {about.chapters.map((ch, idx) => (
          <li key={ch.id} className="cm-list-item">
            <div className="cm-list-item__header">
              <span className="cm-list-item__num">{idx + 1}</span>
              <span className="cm-list-item__title">{ch.title.en || "New chapter"}</span>
              <span className="cm-list-item__controls">
                <button type="button" className="schedule__order-btn" disabled={idx === 0} onClick={() => moveChapter(idx, -1)} aria-label="Move up"><ChevronUp size={14} /></button>
                <button type="button" className="schedule__order-btn" disabled={idx === about.chapters.length - 1} onClick={() => moveChapter(idx, 1)} aria-label="Move down"><ChevronDown size={14} /></button>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => removeChapter(idx)} aria-label="Remove chapter"><Trash2 size={12} /></button>
              </span>
            </div>
            <LocalizedInput label="Chapter title" value={ch.title} onChange={(v) => updateChapter(idx, { title: v })} />
            <LocalizedInput
              label="Body (blank line = new paragraph; **bold** for emphasis; chapter 5 phone/@ will linkify)"
              value={ch.body}
              onChange={(v) => updateChapter(idx, { body: v })}
              multiline
              rows={6}
            />
            <PhotoRefPicker
              label="Chapter photo"
              value={ch.photo}
              onChange={(v) => updateChapter(idx, { photo: v })}
              variant="chapter"
            />
            <LocalizedInput label="Photo alt text" value={ch.photoAlt} onChange={(v) => updateChapter(idx, { photoAlt: v })} />
          </li>
        ))}
      </ul>
      <button type="button" className="cm-add-btn" onClick={addChapter}>
        <Plus size={14} /> Add chapter
      </button>
    </div>
  );
};

/* ── Visit tab ──────────────────────────────────────────────── */

const TabVisit: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteContent;
        const parts = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [setDraft],
  );

  const { visit } = draft;

  return (
    <div className="cm-section">
      <p className="cm-section__title">Page header</p>
      <LocalizedInput label="Eyebrow" value={visit.eyebrow} onChange={(v) => set("visit.eyebrow", v)} />
      <LocalizedInput label="Title" value={visit.title} onChange={(v) => set("visit.title", v)} />
      <LocalizedInput label="Intro" value={visit.lede} onChange={(v) => set("visit.lede", v)} multiline rows={3} />
      <LocalizedInput label="Instagram subtitle" value={visit.instagramSubtitle} onChange={(v) => set("visit.instagramSubtitle", v)} />

      <p className="cm-section__title">Review options</p>
      {(["google", "tripadvisor", "private"] as const).map((key) => (
        <div key={key}>
          <p className="cm-section__title" style={{ marginTop: "var(--sp-4)" }}>
            {key === "google" ? "Google review" : key === "tripadvisor" ? "TripAdvisor review" : "Private feedback"}
          </p>
          <LocalizedInput
            label="Button title"
            value={visit.choices[key].title}
            onChange={(v) => set(`visit.choices.${key}.title`, v)}
          />
          <LocalizedInput
            label="Description"
            value={visit.choices[key].description}
            onChange={(v) => set(`visit.choices.${key}.description`, v)}
            multiline
            rows={2}
          />
        </div>
      ))}
    </div>
  );
};

/* ── FAQ tab ────────────────────────────────────────────────── */

const TabFaq: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteContent;
        const parts = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [setDraft],
  );

  const addItem = () => {
    const item: FaqItem = { id: `faq-${Date.now()}`, question: { en: "", el: "" }, answer: { en: "", el: "" } };
    setDraft((prev) => ({ ...prev, faq: { ...prev.faq, items: [...prev.faq.items, item] } }));
  };

  const removeItem = (idx: number) => {
    setDraft((prev) => {
      const items = [...prev.faq.items];
      items.splice(idx, 1);
      return { ...prev, faq: { ...prev.faq, items } };
    });
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const items = [...prev.faq.items];
      const to = idx + dir;
      if (to < 0 || to >= items.length) return prev;
      [items[idx], items[to]] = [items[to], items[idx]];
      return { ...prev, faq: { ...prev.faq, items } };
    });
  };

  const updateItem = (idx: number, patch: Partial<FaqItem>) => {
    setDraft((prev) => {
      const items = prev.faq.items.map((f, i) => (i === idx ? { ...f, ...patch } : f));
      return { ...prev, faq: { ...prev.faq, items } };
    });
  };

  const { faq } = draft;

  return (
    <div className="cm-section">
      <LocalizedInput label="Section title" value={faq.title} onChange={(v) => set("faq.title", v)} />

      <p className="cm-section__title">Questions ({faq.items.length})</p>
      <ul className="cm-list">
        {faq.items.map((item, idx) => (
          <li key={item.id} className="cm-list-item">
            <div className="cm-list-item__header">
              <span className="cm-list-item__num">{idx + 1}</span>
              <span className="cm-list-item__title">{item.question.en || "New question"}</span>
              <span className="cm-list-item__controls">
                <button type="button" className="schedule__order-btn" disabled={idx === 0} onClick={() => moveItem(idx, -1)} aria-label="Move up"><ChevronUp size={14} /></button>
                <button type="button" className="schedule__order-btn" disabled={idx === faq.items.length - 1} onClick={() => moveItem(idx, 1)} aria-label="Move down"><ChevronDown size={14} /></button>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => removeItem(idx)} aria-label="Remove"><Trash2 size={12} /></button>
              </span>
            </div>
            <LocalizedInput label="Question" value={item.question} onChange={(v) => updateItem(idx, { question: v })} />
            <LocalizedInput label="Answer" value={item.answer} onChange={(v) => updateItem(idx, { answer: v })} multiline rows={3} />
          </li>
        ))}
      </ul>
      <button type="button" className="cm-add-btn" onClick={addItem}>
        <Plus size={14} /> Add question
      </button>
    </div>
  );
};

/* ── Categories tab ─────────────────────────────────────────── */

const CATEGORY_LABELS: Record<CategoryContentSlug, string> = {
  coffee: "Coffee & More",
  cocktails: "Cocktails",
  spirits: "Spirits",
  food: "Food",
};

const TabCategories: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const [active, setActive] = useState<CategoryContentSlug>("coffee");

  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as SiteContent;
        const parts = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    [setDraft],
  );

  const cat = draft.categories[active];

  return (
    <div className="cm-section">
      <p className="schedule__intro" style={{ marginTop: 0 }}>
        Each category page has its own title, search description, heading, and body text. The title and description also appear as the page {`<title>`} and meta description in search results.
      </p>

      <div className="modal-tabs" role="tablist" aria-label="Category pages" style={{ marginBottom: "var(--sp-5)" }}>
        {(Object.keys(CATEGORY_LABELS) as CategoryContentSlug[]).map((slug) => (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={active === slug}
            className={`modal-tab ${active === slug ? "modal-tab--active" : ""}`}
            onClick={() => setActive(slug)}
          >
            {CATEGORY_LABELS[slug]}
          </button>
        ))}
      </div>

      <LocalizedInput label="Browser title (also meta title)" value={cat.metaTitle} onChange={(v) => set(`categories.${active}.metaTitle`, v)} />
      <LocalizedInput label="Search description (meta description)" value={cat.metaDescription} onChange={(v) => set(`categories.${active}.metaDescription`, v)} multiline rows={2} />
      <LocalizedInput label="Page heading (h1)" value={cat.h1} onChange={(v) => set(`categories.${active}.h1`, v)} />
      <LocalizedInput
        label="Body text (blank line = paragraph; **bold** = <strong>)"
        value={cat.body}
        onChange={(v) => set(`categories.${active}.body`, v)}
        multiline
        rows={6}
      />
    </div>
  );
};

/* ── Business Info tab ──────────────────────────────────────── */

const TabVenue: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const update = (key: keyof SiteContent["venue"], value: string | number) => {
    setDraft((prev) => ({ ...prev, venue: { ...prev.venue, [key]: value } }));
  };

  const { venue } = draft;

  return (
    <div className="cm-section">
      <p className="schedule__intro" style={{ marginTop: 0 }}>
        Business facts used across the site: address, phone, email, Instagram handle, Google Maps link, and coordinates for the embedded map. The venue name and tagline are hardcoded — contact the developer to change those.
      </p>
      <p className="schedule__intro" style={{ color: "var(--color-warning, #d97706)" }}>
        Note: prose in the About page and FAQ that mentions the phone number or address is separate text — editing it there won't update these fields.
      </p>

      {(
        [
          ["address", "Address"],
          ["phone", "Phone"],
          ["email", "Email"],
          ["instagramHandle", "Instagram handle (e.g. @home_seaside)"],
          ["mapsLink", "Google Maps short link"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} style={{ marginBottom: "var(--sp-4)" }}>
          <label className="cm-field-label">{label}</label>
          <input
            type="text"
            className="form-input"
            value={venue[key]}
            onChange={(e) => update(key, e.target.value)}
          />
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
        <div>
          <label className="cm-field-label">Latitude (for map embed)</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={venue.lat}
            onChange={(e) => update("lat", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="cm-field-label">Longitude (for map embed)</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={venue.lng}
            onChange={(e) => update("lng", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Illustrations tab ──────────────────────────────────────── */

const TabIllustrations: FC<{ draft: SiteContent; setDraft: React.Dispatch<React.SetStateAction<SiteContent>> }> = ({ draft, setDraft }) => {
  const updateIllus = (key: keyof SiteContent["illustrations"], value: IllustrationRef) => {
    setDraft((prev) => ({ ...prev, illustrations: { ...prev.illustrations, [key]: value } }));
  };

  return (
    <div className="cm-section">
      <p className="schedule__intro" style={{ marginTop: 0 }}>
        Decorative illustrations used on the homepage and menu empty state. Upload a custom image or reset to the bundled default.
      </p>

      <IllustrationSlot
        label="Homepage — About section illustration"
        value={draft.illustrations.homeAbout}
        defaultPath="/illustration-centaur.webp"
        onChange={(v) => updateIllus("homeAbout", v)}
      />
      <IllustrationSlot
        label="Homepage — Visit section illustration"
        value={draft.illustrations.homeVisit}
        defaultPath="/illustration-vase.webp"
        onChange={(v) => updateIllus("homeVisit", v)}
      />
      <IllustrationSlot
        label="Menu — empty state illustration"
        value={draft.illustrations.menuEmpty}
        defaultPath="/illustration-vase.webp"
        onChange={(v) => updateIllus("menuEmpty", v)}
      />
    </div>
  );
};

/* ============================================================
   Main ContentManager modal
   ============================================================ */

type TabId = "home" | "about" | "visit" | "faq" | "categories" | "venue" | "illustrations";

const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "visit", label: "Visit" },
  { id: "faq", label: "FAQ" },
  { id: "categories", label: "Categories" },
  { id: "venue", label: "Business Info" },
  { id: "illustrations", label: "Illustrations" },
];

interface ContentManagerProps {
  onClose: () => void;
}

const ContentManager: FC<ContentManagerProps> = ({ onClose }) => {
  const [draft, setDraft] = useState<SiteContent>(() =>
    JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT)) as SiteContent,
  );
  const [hasPrevious, setHasPrevious] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [publishErrors, setPublishErrors] = useState<PublishError[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Seed the editor. Server draft takes priority over published content.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await fetchContentDraft();
        if (cancelled) return;
        if (state.draft) {
          setDraft(state.draft);
          setHasPrevious(state.hasPrevious);
          setDraftSavedAt(state.draftSavedAt);
        } else {
          setDraft(JSON.parse(JSON.stringify(getPublishedSiteContent())) as SiteContent);
          setHasPrevious(state.hasPrevious);
        }
      } catch {
        // Offline or auth error — seed from local published content
        setDraft(JSON.parse(JSON.stringify(getPublishedSiteContent())) as SiteContent);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const state = await saveContentDraft(draft);
      setDraftSavedAt(state.draftSavedAt);
      setHasPrevious(state.hasPrevious);
      setStatusMsg("Draft saved");
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const errors = validateForPublish(draft);
    if (errors.length > 0) {
      setPublishErrors(errors);
      return;
    }
    setPublishErrors([]);
    // Save current state as draft first so the server has the latest
    setPublishing(true);
    setStatusMsg(null);
    try {
      await saveContentDraft(draft);
      const result = await publishContent();
      setHasPrevious(result.hasPrevious);
      setDraftSavedAt(null);
      setStatusMsg("Published successfully");
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleRevert = async () => {
    if (!hasPrevious) return;
    if (!window.confirm("Swap live and previous versions? Press again to undo (redo).")) return;
    setReverting(true);
    setStatusMsg(null);
    try {
      const result = await revertContent();
      setHasPrevious(result.hasPrevious);
      // Re-seed editor from the now-live content
      setDraft(JSON.parse(JSON.stringify(getPublishedSiteContent())) as SiteContent);
      setStatusMsg("Reverted. Press again to redo.");
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Revert failed");
    } finally {
      setReverting(false);
    }
  };

  const handleDiscard = async () => {
    if (!window.confirm("Discard draft and exit preview mode?")) return;
    setDiscarding(true);
    setStatusMsg(null);
    try {
      await discardContentDraft();
      setDraft(JSON.parse(JSON.stringify(getPublishedSiteContent())) as SiteContent);
      setDraftSavedAt(null);
      setStatusMsg("Draft discarded");
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Discard failed");
    } finally {
      setDiscarding(false);
    }
  };

  const handlePreview = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await saveContentDraft(draft);
      enterContentPreview(normalizeSiteContent(draft));
      window.open("/", "_blank");
      setStatusMsg("Preview opened in new tab. Visitors still see the live version.");
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setSaving(false);
    }
  };

  const jumpToError = (error: PublishError) => {
    // Map the error path to a tab
    const path = error.path;
    if (path.startsWith("home.")) setActiveTab("home");
    else if (path.startsWith("about.")) setActiveTab("about");
    else if (path.startsWith("visit.")) setActiveTab("visit");
    else if (path.startsWith("faq.")) setActiveTab("faq");
    else if (path.startsWith("categories.")) setActiveTab("categories");
    else if (path.startsWith("venue.")) setActiveTab("venue");
    else if (path.startsWith("illustrations.")) setActiveTab("illustrations");
  };

  const busy = saving || publishing || reverting || discarding;

  const statusChip = draftSavedAt
    ? <span className="cm-status cm-status--draft">Draft saved</span>
    : <span className="cm-status">No draft</span>;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <div className="modal modal--photos modal--photos-wide" style={{ maxWidth: "900px" }}>
        <div className="modal-header">
          <h2 id="cm-title" className="modal-title" style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <FileText size={18} />
            Site Content
            {statusChip}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" role="tablist" aria-label="Content sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`modal-tab ${activeTab === tab.id ? "modal-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {loading ? (
            <p style={{ color: "var(--text-tertiary)", padding: "var(--sp-5)" }}>Loading content…</p>
          ) : (
            <>
              {activeTab === "home" && <TabHome draft={draft} setDraft={setDraft} />}
              {activeTab === "about" && <TabAbout draft={draft} setDraft={setDraft} />}
              {activeTab === "visit" && <TabVisit draft={draft} setDraft={setDraft} />}
              {activeTab === "faq" && <TabFaq draft={draft} setDraft={setDraft} />}
              {activeTab === "categories" && <TabCategories draft={draft} setDraft={setDraft} />}
              {activeTab === "venue" && <TabVenue draft={draft} setDraft={setDraft} />}
              {activeTab === "illustrations" && <TabIllustrations draft={draft} setDraft={setDraft} />}
            </>
          )}

          {publishErrors.length > 0 && (
            <div className="cm-publish-errors">
              <p className="cm-publish-errors__title">
                Fix these before publishing ({publishErrors.length} {publishErrors.length === 1 ? "issue" : "issues"}):
              </p>
              <ul className="cm-publish-errors__list">
                {publishErrors.map((err) => (
                  <li
                    key={err.path}
                    className="cm-publish-errors__item"
                    onClick={() => jumpToError(err)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && jumpToError(err)}
                  >
                    <span className="cm-publish-errors__label">{err.label}</span>
                    <span className="cm-publish-errors__problem">— {err.problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {statusMsg && (
            <div className="schedule__intro" role="status" style={{ marginTop: "var(--sp-4)", color: "var(--text-secondary)" }}>
              {statusMsg}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="cm-footer">
            <div className="cm-footer__left">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleDiscard}
                disabled={busy || !draftSavedAt}
                title="Discard draft and exit preview"
              >
                Discard draft
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleRevert}
                disabled={busy || !hasPrevious}
                title={hasPrevious ? "Swap live ↔ previous version (press again to undo)" : "No previous version"}
              >
                <RotateCcw size={14} />
                Restore previous
              </button>
            </div>
            <div className="cm-footer__right">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
                disabled={busy}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleSaveDraft}
                disabled={busy}
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePreview}
                disabled={busy}
                title="Save draft and open preview in a new tab"
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handlePublish}
                disabled={busy}
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManager;
