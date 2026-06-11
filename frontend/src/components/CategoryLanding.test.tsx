import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import CategoryLanding from './CategoryLanding';
import {
  refreshSiteContentFromStorage,
  SITE_CONTENT_STORAGE_KEY,
} from '../config/siteContent';

vi.mock('axios');
const mockedGet = vi.mocked(axios.get);

beforeEach(() => {
  localStorage.clear();
  refreshSiteContentFromStorage();
  mockedGet.mockReset();
  mockedGet.mockResolvedValue({ data: [] }); // MenuSection fetch
});

const renderPage = (category: string, language: 'EN' | 'EL' = 'EN') =>
  render(
    <MemoryRouter>
      <CategoryLanding language={language} category={category} />
    </MemoryRouter>,
  );

describe('CategoryLanding — default content (pixel-identical guarantee)', () => {
  it('renders the exact pre-CMS coffee heading and body in EN', () => {
    renderPage('coffee');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Specialty Coffee in Rethymno');
    // The bold keyword run from the original <strong> markup:
    const strong = document.querySelector('.category-landing__prose strong');
    expect(strong).toHaveTextContent('specialty coffee in Rethymno');
    expect(screen.getByText(/Our coffee programme is built around fresh beans/)).toBeInTheDocument();
  });

  it('renders the exact pre-CMS coffee heading in EL', () => {
    renderPage('coffee', 'EL');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Specialty καφές στο Ρέθυμνο');
    expect(screen.getByText(/Το coffee programme μας είναι χτισμένο/)).toBeInTheDocument();
  });

  it('sets the document title from the category meta title', () => {
    renderPage('spirits');
    expect(document.title).toBe('Rum & Spirits in Rethymno — Home Seaside');
  });

  it('renders two paragraphs for each category body', () => {
    renderPage('food');
    expect(document.querySelectorAll('.category-landing__prose p')).toHaveLength(2);
  });

  it('related nav lists the other three categories by their h1', () => {
    renderPage('coffee');
    const nav = screen.getByRole('navigation', { name: 'Related categories' });
    expect(nav).toHaveTextContent('Handcrafted cocktails by the sea');
    expect(nav).toHaveTextContent('Rum selection & fine spirits at Home Seaside');
    expect(nav).toHaveTextContent('Comfort food on the Rethymno seafront');
    expect(nav).not.toHaveTextContent('Specialty Coffee');
  });
});

describe('CategoryLanding — admin overrides', () => {
  it('renders overridden h1, body, and meta title', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        categories: {
          coffee: {
            metaTitle: { en: 'New Coffee Title', el: 'Νέος τίτλος' },
            h1: { en: 'Fresh Coffee Heading', el: 'Νέα επικεφαλίδα' },
            body: { en: 'One paragraph.\n\nTwo paragraphs with **bold**.', el: 'Ένα.\n\nΔύο.' },
          },
        },
      }),
    );
    refreshSiteContentFromStorage();
    renderPage('coffee');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fresh Coffee Heading');
    expect(document.title).toBe('New Coffee Title');
    expect(document.querySelectorAll('.category-landing__prose p')).toHaveLength(2);
    expect(document.querySelector('.category-landing__prose strong')).toHaveTextContent('bold');
    // Other categories keep defaults:
    const nav = screen.getByRole('navigation', { name: 'Related categories' });
    expect(nav).toHaveTextContent('Handcrafted cocktails by the sea');
  });
});
