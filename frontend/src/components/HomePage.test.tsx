import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from './HomePage';
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
  mockedGet.mockResolvedValue({ data: [] });
  // jsdom has no IntersectionObserver (ParallaxBlock / journey may use it).
  if (!('IntersectionObserver' in window)) {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  }
});

const renderHome = (language: 'EN' | 'EL' = 'EN') =>
  render(
    <MemoryRouter>
      <HomePage language={language} />
    </MemoryRouter>,
  );

describe('HomePage — default content (pixel-identical guarantee)', () => {
  it('renders the exact pre-CMS English section copy', () => {
    renderHome();
    expect(screen.getByText('Drinks, food, and a chair by the sea, in Rethymno.')).toBeInTheDocument();
    expect(screen.getByText('An Ordinary Day, Slowed Down')).toBeInTheDocument();
    expect(screen.getByText(/Home Seaside sits on the Rethymno seafront\. The hour drifts here\./)).toBeInTheDocument();
    expect(screen.getByText('Read more about us →')).toBeInTheDocument();
    expect(screen.getByText('Come See Us')).toBeInTheDocument();
    expect(screen.getByText('Plan your visit →')).toBeInTheDocument();
    expect(screen.getByText('Hours & Location')).toBeInTheDocument();
    expect(screen.getByText('Say Hello')).toBeInTheDocument();
  });

  it('renders the exact pre-CMS Greek section copy', () => {
    renderHome('EL');
    expect(screen.getByText('Ποτά, φαγητό, και μια καρέκλα δίπλα στη θάλασσα, στο Ρέθυμνο.')).toBeInTheDocument();
    expect(screen.getByText('Μια συνηθισμένη μέρα, σε αργό ρυθμό')).toBeInTheDocument();
    expect(screen.getByText('Έλα να μας βρεις')).toBeInTheDocument();
    expect(screen.getByText('Ώρες & Τοποθεσία')).toBeInTheDocument();
  });

  it('renders the exact default hours rows', () => {
    renderHome();
    expect(screen.getByText('Monday – Thursday')).toBeInTheDocument();
    expect(screen.getAllByText('09:00 – 00:00')).not.toHaveLength(0);
    expect(screen.getByText('Friday – Saturday')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 02:00')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('10:00 – 00:00')).toBeInTheDocument();
  });

  it('renders the venue facts with derived links', () => {
    renderHome();
    const phone = screen.getByText('+30 2831 022782').closest('a');
    expect(phone).toHaveAttribute('href', 'tel:+302831022782');
    const email = screen.getByText('home_seaside_rethimno@hotmail.com').closest('a');
    expect(email).toHaveAttribute('href', 'mailto:home_seaside_rethimno@hotmail.com');
    const ig = screen.getByText('@home_seaside').closest('a');
    expect(ig).toHaveAttribute('href', 'https://www.instagram.com/home_seaside');
    const address = screen.getByText('Leof. Emmanouil Kefalogianni 18, Rethymno 741 31, Greece').closest('a');
    expect(address).toHaveAttribute('href', 'https://maps.app.goo.gl/Bni5sF7oQSpCuB2w8');
  });

  it('derives the map embed from coordinates — byte-identical to the old hardcoded URL', () => {
    renderHome();
    const iframe = document.querySelector('iframe[title="Home Seaside location map"]');
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.openstreetmap.org/export/embed.html?bbox=24.4712788%2C35.3698449%2C24.4772788%2C35.3738449&layer=mapnik&marker=35.3718449%2C24.4742788',
    );
  });

  it('uses the default illustrations', () => {
    renderHome();
    expect(document.querySelector('img[src="/illustration-centaur.webp"]')).not.toBeNull();
    expect(document.querySelector('img[src="/illustration-vase.webp"]')).not.toBeNull();
  });
});

describe('HomePage — admin overrides', () => {
  it('renders overridden copy, hours, and venue facts', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        home: {
          heroSubtitle: { en: 'New subtitle here.', el: 'Νέος υπότιτλος.' },
          hours: {
            title: { en: 'Opening Times', el: 'Ωράριο' },
            rows: [{ id: 'all', day: { en: 'Every day', el: 'Κάθε μέρα' }, time: '08:00 – 01:00' }],
          },
        },
        venue: { phone: '+30 1234 567890', lat: 35.5, lng: 24.5 },
      }),
    );
    refreshSiteContentFromStorage();
    renderHome();
    expect(screen.getByText('New subtitle here.')).toBeInTheDocument();
    expect(screen.getByText('Opening Times')).toBeInTheDocument();
    expect(screen.getByText('Every day')).toBeInTheDocument();
    expect(screen.getByText('08:00 – 01:00')).toBeInTheDocument();
    expect(screen.queryByText('Monday – Thursday')).toBeNull();
    const phone = screen.getByText('+30 1234 567890').closest('a');
    expect(phone).toHaveAttribute('href', 'tel:+301234567890');
    const iframe = document.querySelector('iframe[title="Home Seaside location map"]');
    expect(iframe?.getAttribute('src')).toContain('marker=35.5%2C24.5');
    // Untouched copy keeps defaults:
    expect(screen.getByText('An Ordinary Day, Slowed Down')).toBeInTheDocument();
  });

  it('uses an uploaded illustration when overridden', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        illustrations: { homeAbout: { kind: 'custom', url: '/uploads/new-illu.webp' } },
      }),
    );
    refreshSiteContentFromStorage();
    renderHome();
    expect(document.querySelector('img[src="http://localhost:3000/uploads/new-illu.webp"]')).not.toBeNull();
    expect(document.querySelector('img[src="/illustration-centaur.webp"]')).toBeNull();
    // The other slot still uses its default:
    expect(document.querySelector('img[src="/illustration-vase.webp"]')).not.toBeNull();
  });
});
