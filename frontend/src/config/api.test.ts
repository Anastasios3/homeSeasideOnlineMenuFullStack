import { describe, expect, it } from 'vitest';
import { API_URL, apiUrl, resolveAssetUrl } from './api';

describe('API_URL', () => {
  it('falls back to localhost when VITE_API_URL is unset', () => {
    // vitest does not set VITE_API_URL by default, so we get the FALLBACK.
    expect(API_URL).toBe('http://localhost:3000');
  });

  it('never ends with a slash', () => {
    expect(API_URL.endsWith('/')).toBe(false);
  });
});

describe('apiUrl', () => {
  it('joins a path that already starts with a slash', () => {
    expect(apiUrl('/menu_items')).toBe('http://localhost:3000/menu_items');
  });

  it('inserts a slash for paths that don’t start with one', () => {
    expect(apiUrl('menu_items')).toBe('http://localhost:3000/menu_items');
  });
});

describe('resolveAssetUrl', () => {
  it('returns null for null/undefined/empty', () => {
    expect(resolveAssetUrl(null)).toBeNull();
    expect(resolveAssetUrl(undefined)).toBeNull();
    expect(resolveAssetUrl('')).toBeNull();
  });

  it('passes through absolute https URLs unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.com/x.webp')).toBe('https://cdn.example.com/x.webp');
  });

  it('passes through absolute http URLs unchanged', () => {
    expect(resolveAssetUrl('http://cdn.example.com/x.webp')).toBe('http://cdn.example.com/x.webp');
  });

  it('resolves a relative /uploads path against the API origin (photo display regression)', () => {
    expect(resolveAssetUrl('/uploads/abc.webp')).toBe('http://localhost:3000/uploads/abc.webp');
  });

  it('returns non-rooted, non-absolute strings unchanged', () => {
    // Defensive — if someone stores "abc.webp" we don't try to invent a host.
    expect(resolveAssetUrl('abc.webp')).toBe('abc.webp');
  });
});
