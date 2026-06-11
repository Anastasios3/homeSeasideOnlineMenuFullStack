import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHASE_CUTOFFS,
  PHASE_ORDER,
  PHASE_THEME,
  phaseEndsAt,
  phaseForHour,
} from './schedule';

describe('phaseForHour', () => {
  it('maps each cutoff hour to the right phase (default schedule)', () => {
    expect(phaseForHour(6)).toBe('morning');
    expect(phaseForHour(11)).toBe('afternoon');
    expect(phaseForHour(16)).toBe('golden');
    expect(phaseForHour(19)).toBe('evening');
    expect(phaseForHour(23)).toBe('night');
  });

  it('hours before the morning cutoff are night', () => {
    expect(phaseForHour(0)).toBe('night');
    expect(phaseForHour(3)).toBe('night');
    expect(phaseForHour(5)).toBe('night');
  });

  it('normalises out-of-range hours via mod 24', () => {
    // 25 % 24 === 1, which falls in the night bucket (< morning cutoff).
    expect(phaseForHour(25)).toBe('night');
    expect(phaseForHour(30)).toBe('morning');  // 30 % 24 === 6
  });

  it('handles negative hours', () => {
    expect(phaseForHour(-1)).toBe('night');
  });

  it('accepts a custom cutoffs object', () => {
    const cutoffs = { morning: 7, afternoon: 12, golden: 17, evening: 20, night: 22 } as const;
    expect(phaseForHour(7, cutoffs)).toBe('morning');
    expect(phaseForHour(11, cutoffs)).toBe('morning'); // before afternoon=12
    expect(phaseForHour(6, cutoffs)).toBe('night');    // before morning=7
    expect(phaseForHour(21, cutoffs)).toBe('evening');
  });
});

describe('phaseEndsAt', () => {
  it('returns the start of the next phase', () => {
    expect(phaseEndsAt('morning')).toBe(DEFAULT_PHASE_CUTOFFS.afternoon);
    expect(phaseEndsAt('afternoon')).toBe(DEFAULT_PHASE_CUTOFFS.golden);
    expect(phaseEndsAt('golden')).toBe(DEFAULT_PHASE_CUTOFFS.evening);
    expect(phaseEndsAt('evening')).toBe(DEFAULT_PHASE_CUTOFFS.night);
  });

  it('night wraps past midnight', () => {
    expect(phaseEndsAt('night')).toBe(DEFAULT_PHASE_CUTOFFS.morning + 24);
  });
});

describe('PHASE_ORDER', () => {
  it('has all five phases in chronological order', () => {
    expect(PHASE_ORDER).toEqual(['morning', 'afternoon', 'golden', 'evening', 'night']);
  });
});

describe('PHASE_THEME', () => {
  it('maps every phase to a theme', () => {
    for (const p of PHASE_ORDER) {
      expect(['light', 'dark']).toContain(PHASE_THEME[p]);
    }
  });
});
