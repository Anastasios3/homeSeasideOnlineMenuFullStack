import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
  DEFAULT_SITE_CONTENT,
  enterContentPreview,
  exitContentPreview,
  getPublishedSiteContent,
  getSiteContent,
  instagramUrl,
  illustrationSrc,
  isContentPreviewActive,
  loadSiteContentFromServer,
  mapsEmbedUrl,
  normalizeSiteContent,
  refreshSiteContentFromStorage,
  SITE_CONTENT_PREVIEW_KEY,
  SITE_CONTENT_STORAGE_KEY,
  telHref,
  validateForPublish,
} from './siteContent';

vi.mock('axios');
const mockedGet = vi.mocked(axios.get);

beforeEach(() => {
  localStorage.clear();
  refreshSiteContentFromStorage();
});

describe('normalizeSiteContent', () => {
  it('returns the defaults for undefined / null / garbage', () => {
    expect(normalizeSiteContent(undefined)).toEqual(DEFAULT_SITE_CONTENT);
    expect(normalizeSiteContent(null)).toEqual(DEFAULT_SITE_CONTENT);
    expect(normalizeSiteContent('not an object')).toEqual(DEFAULT_SITE_CONTENT);
    expect(normalizeSiteContent(42)).toEqual(DEFAULT_SITE_CONTENT);
  });

  it('returns a copy, never the DEFAULT_SITE_CONTENT object itself', () => {
    const a = normalizeSiteContent(undefined);
    expect(a).not.toBe(DEFAULT_SITE_CONTENT);
    a.home.heroSubtitle.en = 'mutated';
    expect(DEFAULT_SITE_CONTENT.home.heroSubtitle.en).not.toBe('mutated');
  });

  it('deep-merges a sparse override over the defaults', () => {
    const result = normalizeSiteContent({
      home: { heroSubtitle: { en: 'Custom subtitle', el: 'Προσαρμοσμένος' } },
    });
    expect(result.home.heroSubtitle.en).toBe('Custom subtitle');
    // Untouched siblings keep the defaults:
    expect(result.home.journeyTitle).toEqual(DEFAULT_SITE_CONTENT.home.journeyTitle);
    expect(result.about).toEqual(DEFAULT_SITE_CONTENT.about);
    expect(result.venue).toEqual(DEFAULT_SITE_CONTENT.venue);
  });

  it('merges per language inside a LocalizedText', () => {
    const result = normalizeSiteContent({
      home: { heroSubtitle: { en: 'Only English changed' } },
    });
    expect(result.home.heroSubtitle.en).toBe('Only English changed');
    expect(result.home.heroSubtitle.el).toBe(DEFAULT_SITE_CONTENT.home.heroSubtitle.el);
  });

  it('replaces chapters wholesale when a valid array is present', () => {
    const result = normalizeSiteContent({
      about: {
        chapters: [
          { title: { en: 'Solo', el: 'Μόνο' }, body: { en: 'B', el: 'Σ' }, photo: { kind: 'bundled', slug: 'food-session-1' } },
        ],
      },
    });
    expect(result.about.chapters).toHaveLength(1);
    expect(result.about.chapters[0].id).toBe('chapter-1'); // id backfilled
    expect(result.about.chapters[0].title.en).toBe('Solo');
    expect(result.about.chapters[0].photoAlt).toEqual({ en: '', el: '' }); // loose, not default-merged
  });

  it('falls back to the default photo ref when the override is invalid', () => {
    const result = normalizeSiteContent({
      about: { heroPhoto: { kind: 'bundled' } }, // missing slug
    });
    expect(result.about.heroPhoto).toEqual(DEFAULT_SITE_CONTENT.about.heroPhoto);
  });

  it('accepts a custom photo ref with srcset', () => {
    const result = normalizeSiteContent({
      about: {
        heroPhoto: {
          kind: 'custom',
          url: '/uploads/x.webp',
          srcset: { '640': '/uploads/x-640.webp', '1280': '/uploads/x-1280.webp', '1920': '/uploads/x-1920.webp' },
          width: 1920,
          height: 1080,
        },
      },
    });
    expect(result.about.heroPhoto.kind).toBe('custom');
    if (result.about.heroPhoto.kind === 'custom') {
      expect(result.about.heroPhoto.url).toBe('/uploads/x.webp');
      expect(result.about.heroPhoto.srcset?.['1280']).toBe('/uploads/x-1280.webp');
    }
  });

  it('rejects non-finite venue coordinates', () => {
    const result = normalizeSiteContent({ venue: { lat: 'north', lng: Infinity } });
    expect(result.venue.lat).toBe(DEFAULT_SITE_CONTENT.venue.lat);
    expect(result.venue.lng).toBe(DEFAULT_SITE_CONTENT.venue.lng);
  });

  it('normalizes invalid illustrations to default', () => {
    const result = normalizeSiteContent({ illustrations: { homeAbout: { kind: 'custom' } } }); // no url
    expect(result.illustrations.homeAbout).toEqual({ kind: 'default' });
  });
});

describe('derived helpers', () => {
  it('mapsEmbedUrl reproduces the original hardcoded VENUE.mapsEmbed exactly', () => {
    expect(mapsEmbedUrl(35.3718449, 24.4742788)).toBe(
      'https://www.openstreetmap.org/export/embed.html?bbox=24.4712788%2C35.3698449%2C24.4772788%2C35.3738449&layer=mapnik&marker=35.3718449%2C24.4742788',
    );
  });

  it('instagramUrl reproduces the original VENUE.instagram exactly', () => {
    expect(instagramUrl('@home_seaside')).toBe('https://www.instagram.com/home_seaside');
    expect(instagramUrl('home_seaside')).toBe('https://www.instagram.com/home_seaside');
  });

  it('telHref strips spaces', () => {
    expect(telHref('+30 2831 022782')).toBe('tel:+302831022782');
  });

  it('illustrationSrc returns the default path for default refs', () => {
    expect(illustrationSrc({ kind: 'default' }, '/illustration-vase.webp')).toBe('/illustration-vase.webp');
  });

  it('illustrationSrc resolves relative custom uploads against the API origin', () => {
    expect(
      illustrationSrc(
        { kind: 'custom', url: '/uploads/a.webp', srcset: { '640': '/uploads/a-640.webp', '1280': '/uploads/a-1280.webp', '1920': '/uploads/a-1920.webp' } },
        '/x.webp',
      ),
    ).toBe('http://localhost:3000/uploads/a-1280.webp');
  });
});

describe('preview overlay', () => {
  it('getSiteContent serves the preview draft while preview is active', () => {
    expect(isContentPreviewActive()).toBe(false);
    const draft = normalizeSiteContent({ home: { heroSubtitle: { en: 'DRAFT', el: 'ΠΡΟΧΕΙΡΟ' } } });
    enterContentPreview(draft);
    expect(isContentPreviewActive()).toBe(true);
    expect(getSiteContent().home.heroSubtitle.en).toBe('DRAFT');
    // Published content is unaffected:
    expect(getPublishedSiteContent().home.heroSubtitle.en).toBe(DEFAULT_SITE_CONTENT.home.heroSubtitle.en);
    exitContentPreview();
    expect(isContentPreviewActive()).toBe(false);
    expect(getSiteContent().home.heroSubtitle.en).toBe(DEFAULT_SITE_CONTENT.home.heroSubtitle.en);
  });

  it('boot hydration does not clobber an active preview', async () => {
    const draft = normalizeSiteContent({ home: { heroSubtitle: { en: 'DRAFT', el: 'ΠΡΟΧΕΙΡΟ' } } });
    enterContentPreview(draft);
    mockedGet.mockResolvedValueOnce({
      data: { site_content: { home: { heroSubtitle: { en: 'LIVE', el: 'ΖΩΝΤΑΝΟ' } } } },
    });
    await loadSiteContentFromServer();
    // live cache updated…
    expect(getPublishedSiteContent().home.heroSubtitle.en).toBe('LIVE');
    // …but the page still shows the preview:
    expect(getSiteContent().home.heroSubtitle.en).toBe('DRAFT');
    expect(localStorage.getItem(SITE_CONTENT_PREVIEW_KEY)).not.toBeNull();
  });

  it('loadSiteContentFromServer fails silently and keeps current content', async () => {
    mockedGet.mockRejectedValueOnce(new Error('offline'));
    await loadSiteContentFromServer();
    expect(getSiteContent()).toEqual(DEFAULT_SITE_CONTENT);
  });

  it('refreshSiteContentFromStorage picks up keys written by another tab', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({ home: { heroSubtitle: { en: 'From other tab', el: 'Από άλλη καρτέλα' } } }),
    );
    refreshSiteContentFromStorage();
    expect(getSiteContent().home.heroSubtitle.en).toBe('From other tab');
  });
});

describe('validateForPublish', () => {
  it('passes on the bundled defaults', () => {
    expect(validateForPublish(DEFAULT_SITE_CONTENT)).toEqual([]);
  });

  it('flags a missing Greek translation with the right label', () => {
    const c = normalizeSiteContent(undefined);
    c.about.chapters[1].title.el = '';
    const errors = validateForPublish(c);
    expect(errors).toHaveLength(1);
    expect(errors[0].label).toBe('About · Chapter 2 · Title');
    expect(errors[0].problem).toBe('missing Greek');
  });

  it('flags missing both languages', () => {
    const c = normalizeSiteContent(undefined);
    c.faq.items[0].answer = { en: ' ', el: '' };
    const errors = validateForPublish(c);
    expect(errors[0].problem).toBe('missing both languages');
  });

  it('flags an unresolvable bundled photo slug', () => {
    const c = normalizeSiteContent(undefined);
    c.about.chapters[0].photo = { kind: 'bundled', slug: 'no-such-photo' };
    const errors = validateForPublish(c);
    expect(errors[0].label).toBe('About · Chapter 1 · Photo');
    expect(errors[0].problem).toBe('photo not selected');
  });

  it('flags empty chapter and FAQ lists', () => {
    const c = normalizeSiteContent(undefined);
    c.about.chapters = [];
    c.faq.items = [];
    const problems = validateForPublish(c).map((e) => e.problem);
    expect(problems).toContain('needs at least one chapter');
    expect(problems).toContain('needs at least one question');
  });

  it('flags out-of-range coordinates', () => {
    const c = normalizeSiteContent(undefined);
    c.venue.lat = 123;
    const errors = validateForPublish(c);
    expect(errors[0].path).toBe('venue.lat');
  });

  it('flags blank venue fields', () => {
    const c = normalizeSiteContent(undefined);
    c.venue.phone = '  ';
    const errors = validateForPublish(c);
    expect(errors[0].label).toBe('Business info · Phone');
  });
});
