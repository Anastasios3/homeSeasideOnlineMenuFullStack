/**
 * Customer-facing menu rendering, focused on the photo display path that
 * was reported as broken ("photo saves but won't showcase"). Each test sets
 * up axios to return a known menu_items payload and asserts what the user
 * actually sees in the DOM.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MenuSection from './MenuSection';

vi.mock('axios');
const mockedGet = vi.mocked(axios.get);

const espresso = {
  _id: '650000000000000000000001',
  name: { en: 'Espresso', el: 'Εσπρέσσο' },
  description: { en: 'Strong shot', el: 'Δυνατό σφηνάκι' },
  main_category: 'coffee',
  category: { en: 'Hot', el: 'Ζεστά' },
  price: 3.5,
  pricing_type: 'single',
  available: true,
  allergens: [],
  image_url: '/uploads/abc.webp',
};

const wineGlassBottle = {
  _id: '650000000000000000000002',
  name: { en: 'House White', el: 'Λευκός Οίνος' },
  description: { en: '', el: '' },
  main_category: 'beer&wine',
  category: { en: 'Wine', el: 'Κρασί' },
  price: 6,
  pricing_type: 'glass_bottle',
  price_secondary: 24,
  available: true,
  allergens: ['Alcohol'],
  image_url: null,
};

beforeEach(() => {
  mockedGet.mockReset();
});

describe('MenuSection — photo display', () => {
  it('renders a thumb image with the resolved absolute URL when image_url is a /uploads path (regression for photo-not-showing bug)', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso] });
    const { container } = render(<MenuSection language="EN" activeCategory={null} />);

    await screen.findByText('Espresso');
    const thumb = container.querySelector('.menu-item__thumb img');
    expect(thumb).not.toBeNull();
    expect(thumb).toHaveAttribute('src', 'http://localhost:3000/uploads/abc.webp');
  });

  it('passes through an absolute https image_url unchanged', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ ...espresso, image_url: 'https://cdn.example.com/x.webp' }],
    });
    const { container } = render(<MenuSection language="EN" activeCategory={null} />);
    await screen.findByText('Espresso');
    const thumb = container.querySelector('.menu-item__thumb img');
    expect(thumb).toHaveAttribute('src', 'https://cdn.example.com/x.webp');
  });

  it('renders no thumb when image_url is null', async () => {
    mockedGet.mockResolvedValueOnce({ data: [wineGlassBottle] });
    const { container } = render(<MenuSection language="EN" activeCategory={null} />);

    await screen.findByText('House White');
    expect(container.querySelector('.menu-item__thumb')).toBeNull();
  });

  it('renders no thumb when image_url is empty string', async () => {
    mockedGet.mockResolvedValueOnce({ data: [{ ...espresso, image_url: '' }] });
    const { container } = render(<MenuSection language="EN" activeCategory={null} />);
    await screen.findByText('Espresso');
    expect(container.querySelector('.menu-item__thumb')).toBeNull();
  });
});

describe('MenuSection — pricing display', () => {
  it('renders single price as XX.YY€', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso] });
    render(<MenuSection language="EN" activeCategory={null} />);
    await screen.findByText('Espresso');
    expect(screen.getByText('3.50€')).toBeInTheDocument();
  });

  it('renders dual price for glass/bottle with both values', async () => {
    mockedGet.mockResolvedValueOnce({ data: [wineGlassBottle] });
    render(<MenuSection language="EN" activeCategory={null} />);
    await screen.findByText('House White');
    expect(screen.getByText('6.00€')).toBeInTheDocument();
    expect(screen.getByText('24.00€')).toBeInTheDocument();
    expect(screen.getByText('Glass')).toBeInTheDocument();
    expect(screen.getByText('Bottle')).toBeInTheDocument();
  });

  it('renders EL labels under EL language', async () => {
    mockedGet.mockResolvedValueOnce({ data: [wineGlassBottle] });
    render(<MenuSection language="EL" activeCategory={null} />);
    await screen.findByText('Λευκός Οίνος');
    expect(screen.getByText('Ποτήρι')).toBeInTheDocument();
    expect(screen.getByText('Μπουκάλι')).toBeInTheDocument();
  });
});

describe('MenuSection — language switching', () => {
  it('shows the EN name under EN', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso] });
    render(<MenuSection language="EN" activeCategory={null} />);
    expect(await screen.findByText('Espresso')).toBeInTheDocument();
  });

  it('shows the EL name under EL', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso] });
    render(<MenuSection language="EL" activeCategory={null} />);
    expect(await screen.findByText('Εσπρέσσο')).toBeInTheDocument();
  });
});

describe('MenuSection — error state', () => {
  it('shows a "Could not load menu" message on API failure', async () => {
    mockedGet.mockRejectedValueOnce(new Error('boom'));
    render(<MenuSection language="EN" activeCategory={null} />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load menu/i);
    });
  });

  it('shows the empty state when the API returns []', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });
    render(<MenuSection language="EN" activeCategory={null} />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/no items available/i);
    });
  });
});

describe('MenuSection — category filtering', () => {
  it('filters by main_category when activeCategory is set', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso, wineGlassBottle] });
    render(<MenuSection language="EN" activeCategory="beer&wine" />);
    await screen.findByText('House White');
    expect(screen.queryByText('Espresso')).toBeNull();
  });

  it('shows all items when activeCategory is null', async () => {
    mockedGet.mockResolvedValueOnce({ data: [espresso, wineGlassBottle] });
    render(<MenuSection language="EN" activeCategory={null} />);
    expect(await screen.findByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('House White')).toBeInTheDocument();
  });
});
