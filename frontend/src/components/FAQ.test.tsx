import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FAQ from './FAQ';
import {
  refreshSiteContentFromStorage,
  SITE_CONTENT_STORAGE_KEY,
} from '../config/siteContent';

beforeEach(() => {
  localStorage.clear();
  refreshSiteContentFromStorage();
});

describe('FAQ — default content (pixel-identical guarantee)', () => {
  it('renders the exact pre-CMS English heading and questions', () => {
    render(<FAQ language="EN" />);
    expect(screen.getByText('Frequently Asked')).toBeInTheDocument();
    expect(screen.getByText('Where exactly is Home Seaside?')).toBeInTheDocument();
    expect(screen.getByText('What is Home Seaside best known for?')).toBeInTheDocument();
    expect(screen.getByText('When are you open?')).toBeInTheDocument();
    expect(screen.getByText('Do you take reservations?')).toBeInTheDocument();
    expect(screen.getByText('Do you serve breakfast and food all day?')).toBeInTheDocument();
    expect(screen.getByText('Is there outdoor seating with a sea view?')).toBeInTheDocument();
  });

  it('renders the exact pre-CMS Greek heading and questions', () => {
    render(<FAQ language="EL" />);
    expect(screen.getByText('Συχνές ερωτήσεις')).toBeInTheDocument();
    expect(screen.getByText('Πού ακριβώς βρίσκεται το Home Seaside;')).toBeInTheDocument();
    expect(screen.getByText('Ποιες ώρες είστε ανοιχτά;')).toBeInTheDocument();
  });

  it('first answer is open by default with its exact text', () => {
    render(<FAQ language="EN" />);
    expect(
      screen.getByText(
        "On the Rethymno seafront, at Leof. Emmanouil Kefalogianni 18. Two minutes' walk from the Fortezza and the Old Venetian Harbour. The terrace looks straight out at the water.",
      ),
    ).toBeInTheDocument();
  });

  it('accordion toggles open/closed', async () => {
    const user = userEvent.setup();
    render(<FAQ language="EN" />);
    const second = screen.getByRole('button', { name: /best known for/ });
    expect(second).toHaveAttribute('aria-expanded', 'false');
    await user.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('FAQ — admin overrides', () => {
  it('renders published override items instead of the defaults', () => {
    localStorage.setItem(
      SITE_CONTENT_STORAGE_KEY,
      JSON.stringify({
        faq: {
          title: { en: 'Questions', el: 'Ερωτήσεις' },
          items: [
            { id: 'q1', question: { en: 'New question?', el: 'Νέα ερώτηση;' }, answer: { en: 'New answer.', el: 'Νέα απάντηση.' } },
          ],
        },
      }),
    );
    refreshSiteContentFromStorage();
    render(<FAQ language="EN" />);
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('New question?')).toBeInTheDocument();
    expect(screen.getByText('New answer.')).toBeInTheDocument();
    expect(screen.queryByText('Frequently Asked')).toBeNull();
    expect(screen.queryByText('Where exactly is Home Seaside?')).toBeNull();
  });
});
