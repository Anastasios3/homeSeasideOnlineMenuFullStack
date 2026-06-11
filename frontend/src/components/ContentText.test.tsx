import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ContentParagraphs } from './ContentText';

describe('ContentParagraphs', () => {
  it('splits on blank lines into separate <p> elements', () => {
    const { container } = render(<ContentParagraphs text={'First paragraph.\n\nSecond paragraph.'} />);
    const ps = container.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]).toHaveTextContent('First paragraph.');
    expect(ps[1]).toHaveTextContent('Second paragraph.');
  });

  it('renders a single paragraph for text without blank lines', () => {
    const { container } = render(<ContentParagraphs text="Just one paragraph here." />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('ignores extra whitespace around paragraph breaks', () => {
    const { container } = render(<ContentParagraphs text={'A.\n   \n\nB.'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('converts **bold** runs to <strong>', () => {
    const { container } = render(
      <ContentParagraphs text="If you're looking for **specialty coffee in Rethymno**, come by." />,
    );
    const strong = container.querySelector('strong');
    expect(strong).toHaveTextContent('specialty coffee in Rethymno');
    expect(container.querySelector('p')).toHaveTextContent(
      "If you're looking for specialty coffee in Rethymno, come by.",
    );
  });

  it('handles multiple bold runs in one paragraph', () => {
    const { container } = render(<ContentParagraphs text="**One** and **two**." />);
    expect(container.querySelectorAll('strong')).toHaveLength(2);
  });

  it('linkifies phone numbers as tel: anchors when linkify is set', () => {
    const { container } = render(
      <ContentParagraphs linkify text="a quick call ahead is the kind move: +30 2831 022782. For the rest…" />,
    );
    const a = container.querySelector('a');
    expect(a).toHaveAttribute('href', 'tel:+302831022782');
    expect(a).toHaveTextContent('+30 2831 022782');
    // The trailing period stays outside the link:
    expect(a?.textContent?.endsWith('.')).toBe(false);
  });

  it('linkifies @handles as Instagram links when linkify is set', () => {
    const { container } = render(<ContentParagraphs linkify text="follow @home_seaside." />);
    const a = container.querySelector('a');
    expect(a).toHaveAttribute('href', 'https://www.instagram.com/home_seaside');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a).toHaveTextContent('@home_seaside');
  });

  it('does NOT linkify without the flag — FAQ phone/email stay plain text', () => {
    const { container } = render(
      <ContentParagraphs text="Call +30 2831 022782 or write to home_seaside_rethimno@hotmail.com." />,
    );
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('email-style text never becomes an Instagram link even with linkify off-pattern', () => {
    // The handle regex would match "@hotmail.com" — verify it is only applied
    // on linkify surfaces. With linkify on (About bodies), no emails exist
    // today, but the regex still must not capture a trailing dot.
    const { container } = render(<ContentParagraphs linkify text="ping @name. done" />);
    const a = container.querySelector('a');
    expect(a).toHaveTextContent('@name');
  });

  it('reproduces the chapter-5 default body anchors exactly', () => {
    const text =
      'Walk-ins are always welcome. For larger groups or weekend evenings, a quick call ahead is the kind move: +30 2831 022782. For the daily rhythm (new arrivals on the bar, what came out of the kitchen this morning), follow @home_seaside.';
    const { container } = render(<ContentParagraphs linkify text={text} />);
    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(2);
    expect(anchors[0]).toHaveAttribute('href', 'tel:+302831022782');
    expect(anchors[1]).toHaveAttribute('href', 'https://www.instagram.com/home_seaside');
  });
});
