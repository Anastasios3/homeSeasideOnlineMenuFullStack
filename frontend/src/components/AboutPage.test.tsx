import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from './AboutPage';
import {
  refreshSiteContentFromStorage,
  SITE_CONTENT_STORAGE_KEY,
} from '../config/siteContent';

beforeEach(() => {
  localStorage.clear();
  refreshSiteContentFromStorage();
});

const renderAbout = (language: 'EN' | 'EL' = 'EN') =>
  render(
    <MemoryRouter>
      <AboutPage language={language} />
    </MemoryRouter>,
  );

describe('AboutPage — default content (pixel-identical guarantee)', () => {
  it('renders the exact pre-CMS English header', () => {
    renderAbout();
    expect(screen.getByText('Home Seaside, Rethymno')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'An ordinary day on the Rethymno seafront',
    );
    expect(
      screen.getByText(/Home Seaside Bar & More is a seafront café and cocktail bar on the Rethymno promenade in Crete\./),
    ).toBeInTheDocument();
  });

  it('renders the exact pre-CMS Greek header', () => {
    renderAbout('EL');
    expect(screen.getByText('Home Seaside, Ρέθυμνο')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Μια συνηθισμένη μέρα στην παραλιακή του Ρεθύμνου',
    );
  });

  it('renders all five chapter titles in EN', () => {
    renderAbout();
    expect(screen.getByText('Mornings start slow')).toBeInTheDocument();
    expect(screen.getByText('A bar built on rum and time')).toBeInTheDocument();
    expect(screen.getByText("Food that doesn't rush")).toBeInTheDocument();
    expect(screen.getByText('The room')).toBeInTheDocument();
    expect(screen.getByText('Finding us')).toBeInTheDocument();
  });

  it('renders all five chapter titles in EL', () => {
    renderAbout('EL');
    expect(screen.getByText('Τα πρωινά ξεκινούν αργά')).toBeInTheDocument();
    expect(screen.getByText('Ένα μπαρ χτισμένο στο ρούμι και τον χρόνο')).toBeInTheDocument();
    expect(screen.getByText('Φαγητό χωρίς βιασύνη')).toBeInTheDocument();
    expect(screen.getByText('Ο χώρος')).toBeInTheDocument();
    expect(screen.getByText('Πώς μας βρίσκεις')).toBeInTheDocument();
  });

  it('renders hero photo plus one photo per chapter', () => {
    renderAbout();
    expect(document.querySelectorAll('.about__hero')).toHaveLength(1);
    expect(document.querySelectorAll('.about__chapter-photo')).toHaveLength(5);
  });

  it('chapter bodies render two paragraphs each', () => {
    renderAbout();
    const firstChapterText = document.querySelector('.about__chapter-text');
    expect(firstChapterText?.querySelectorAll('p')).toHaveLength(2);
  });

  it('chapter 5 reproduces the tel: and Instagram anchors of the old JSX', () => {
    renderAbout();
    const tel = document.querySelector('a[href="tel:+302831022782"]');
    expect(tel).toHaveTextContent('+30 2831 022782');
    const ig = document.querySelector('.about__story a[href="https://www.instagram.com/home_seaside"]');
    expect(ig).toHaveTextContent('@home_seaside');
  });

  it('alternates chapter layout left/right', () => {
    renderAbout();
    const chapters = document.querySelectorAll('.about__chapter');
    expect(chapters[0].className).toContain('about__chapter--left');
    expect(chapters[1].className).toContain('about__chapter--right');
    expect(chapters[2].className).toContain('about__chapter--left');
  });
});

describe('AboutPage — admin overrides', () => {
  it('renders a replaced chapter list with a custom uploaded photo', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        about: {
          title: { en: 'Our new story', el: 'Η νέα μας ιστορία' },
          chapters: [
            {
              id: 'solo',
              title: { en: 'Only chapter', el: 'Μοναδικό κεφάλαιο' },
              body: { en: 'First para.\n\nSecond para.', el: 'Πρώτη.\n\nΔεύτερη.' },
              photo: { kind: 'custom', url: '/uploads/custom-chapter.webp' },
              photoAlt: { en: 'Custom photo', el: 'Προσαρμοσμένη φωτογραφία' },
            },
          ],
        },
      }),
    );
    refreshSiteContentFromStorage();
    renderAbout();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Our new story');
    expect(screen.getByText('Only chapter')).toBeInTheDocument();
    expect(screen.queryByText('Mornings start slow')).toBeNull();
    expect(document.querySelectorAll('.about__chapter-photo')).toHaveLength(1);
    // Custom upload renders inside an hs-picture box so the aspect CSS applies:
    const img = document.querySelector('.about__chapter-photo .hs-picture img');
    expect(img).toHaveAttribute('src', 'http://localhost:3000/uploads/custom-chapter.webp');
    expect(img).toHaveAttribute('alt', 'Custom photo');
  });

  it('skips the chapter figure when the photo slug is unknown', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        about: {
          chapters: [
            {
              id: 'no-photo',
              title: { en: 'Text only', el: 'Μόνο κείμενο' },
              body: { en: 'Body.', el: 'Σώμα.' },
              photo: { kind: 'bundled', slug: 'does-not-exist' },
              photoAlt: { en: '', el: '' },
            },
          ],
        },
      }),
    );
    refreshSiteContentFromStorage();
    renderAbout();
    expect(screen.getByText('Text only')).toBeInTheDocument();
    expect(document.querySelectorAll('.about__chapter-photo')).toHaveLength(0);
  });

  it('swaps the hero photo to another bundled slug', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        about: { heroPhoto: { kind: 'bundled', slug: 'food-session-1' } },
      }),
    );
    refreshSiteContentFromStorage();
    renderAbout();
    const heroImg = document.querySelector('.about__hero img');
    expect(heroImg?.getAttribute('src')).toContain('food-session-1');
  });
});
