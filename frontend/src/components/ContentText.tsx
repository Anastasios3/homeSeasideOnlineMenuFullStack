/**
 * Renderer for admin-edited plain text.
 *
 *   - Blank line → paragraph break (<p>)
 *   - `**bold**` → <strong> (covers the category-page keyword emphasis)
 *   - With `linkify` (About chapter bodies only): international phone
 *     numbers become tel: links and @handles become Instagram links,
 *     reproducing the anchors the original hardcoded JSX had. FAQ and
 *     other surfaces show phone/email as plain text, exactly as before —
 *     so linkify stays opt-in.
 *
 * Output is built from React nodes; no HTML parsing, no
 * dangerouslySetInnerHTML, so admin text can never inject markup.
 */
import type { FC, ReactNode } from "react";
import { instagramUrl, telHref } from "../config/siteContent";

const BOLD_RE = /\*\*(.+?)\*\*/g;
// "+30 2831 022782" — a plus, then digits with optional single spaces,
// ending on a digit so trailing punctuation stays outside the link.
const PHONE_RE = /\+\d(?:[\d ]*\d)?/g;
// "@home_seaside" / "@some.account" — dots allowed inside, never trailing.
const HANDLE_RE = /@[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*/g;

function linkifySegment(text: string, keyBase: string): ReactNode[] {
  const matches: Array<{ start: number; end: number; node: ReactNode }> = [];

  for (const m of text.matchAll(PHONE_RE)) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      node: (
        <a key={`${keyBase}-tel-${m.index}`} href={telHref(m[0])}>
          {m[0]}
        </a>
      ),
    });
  }
  for (const m of text.matchAll(HANDLE_RE)) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      node: (
        <a
          key={`${keyBase}-ig-${m.index}`}
          href={instagramUrl(m[0])}
          target="_blank"
          rel="noopener noreferrer"
        >
          {m[0]}
        </a>
      ),
    });
  }

  if (matches.length === 0) return [text];
  matches.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue; // overlapping — keep the earlier one
    if (match.start > cursor) out.push(text.slice(cursor, match.start));
    out.push(match.node);
    cursor = match.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

function renderInline(text: string, linkify: boolean, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let boldIndex = 0;

  for (const m of text.matchAll(BOLD_RE)) {
    if (m.index > cursor) {
      const plain = text.slice(cursor, m.index);
      out.push(...(linkify ? linkifySegment(plain, `${keyBase}-${cursor}`) : [plain]));
    }
    out.push(
      <strong key={`${keyBase}-b-${boldIndex++}`}>
        {linkify ? linkifySegment(m[1], `${keyBase}-bs-${m.index}`) : m[1]}
      </strong>,
    );
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) {
    const plain = text.slice(cursor);
    out.push(...(linkify ? linkifySegment(plain, `${keyBase}-${cursor}`) : [plain]));
  }
  return out;
}

interface ContentParagraphsProps {
  text: string;
  /** Turn phone numbers and @handles into links (About chapter bodies). */
  linkify?: boolean;
}

export const ContentParagraphs: FC<ContentParagraphsProps> = ({ text, linkify = false }) => {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p, linkify, `p${i}`)}</p>
      ))}
    </>
  );
};
