import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import VisitPage from './VisitPage';
import {
  refreshSiteContentFromStorage,
  SITE_CONTENT_STORAGE_KEY,
} from '../config/siteContent';

beforeEach(() => {
  localStorage.clear();
  refreshSiteContentFromStorage();
});

describe('VisitPage — default content (pixel-identical guarantee)', () => {
  it('renders the exact pre-CMS English header and choices', () => {
    render(<VisitPage language="EN" />);
    expect(screen.getByText('Home Seaside · Rethymno')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Thanks for visiting today');
    expect(screen.getByText('Tell us how it went. Whichever option you pick, it lands with us, not a third party.')).toBeInTheDocument();
    expect(screen.getByText('Leave a Google review')).toBeInTheDocument();
    expect(screen.getByText('Leave a TripAdvisor review')).toBeInTheDocument();
    expect(screen.getByText('Send us private feedback')).toBeInTheDocument();
    expect(screen.getByText('Daily stories, drinks, sunset photos. The life of the bar.')).toBeInTheDocument();
  });

  it('renders the exact pre-CMS Greek header and choices', () => {
    render(<VisitPage language="EL" />);
    expect(screen.getByText('Home Seaside · Ρέθυμνο')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ευχαριστούμε για την επίσκεψη');
    expect(screen.getByText('Άφησε αξιολόγηση στο Google')).toBeInTheDocument();
    expect(screen.getByText('Άφησε αξιολόγηση στο TripAdvisor')).toBeInTheDocument();
    expect(screen.getByText('Στείλε μας ιδιωτικά τη γνώμη σου')).toBeInTheDocument();
  });

  it('links Instagram CTA to the derived handle URL and shows the handle', () => {
    render(<VisitPage language="EN" />);
    const cta = screen.getByText('@home_seaside').closest('a');
    expect(cta).toHaveAttribute('href', 'https://www.instagram.com/home_seaside');
  });

  it('builds the private-feedback mailto from the venue email', () => {
    render(<VisitPage language="EN" />);
    const link = screen.getByText('Send us private feedback').closest('a');
    expect(link?.getAttribute('href')).toContain('mailto:home_seaside_rethimno@hotmail.com');
  });
});

describe('VisitPage — admin overrides', () => {
  it('renders overridden copy and venue facts', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        visit: {
          title: { en: 'Cheers for stopping by', el: 'Ευχαριστούμε πολύ' },
          choices: { google: { title: { en: 'Rate us on Google', el: 'Βαθμολόγησέ μας' } } },
        },
        venue: { instagramHandle: '@new_handle', email: 'new@example.com' },
      }),
    );
    refreshSiteContentFromStorage();
    render(<VisitPage language="EN" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cheers for stopping by');
    expect(screen.getByText('Rate us on Google')).toBeInTheDocument();
    const cta = screen.getByText('@new_handle').closest('a');
    expect(cta).toHaveAttribute('href', 'https://www.instagram.com/new_handle');
    const fb = screen.getByText('Send us private feedback').closest('a');
    expect(fb?.getAttribute('href')).toContain('mailto:new@example.com');
    // Untouched fields keep defaults:
    expect(screen.getByText('Leave a TripAdvisor review')).toBeInTheDocument();
  });
});
