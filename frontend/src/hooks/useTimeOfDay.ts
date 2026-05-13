import { useEffect, useState, useCallback } from "react";
import {
  phaseForHour,
  phaseEndsAt,
  PHASE_THEME,
  SCHEDULE_STORAGE_KEY,
  type DayPhase,
} from "../config/schedule";

const THEME_OVERRIDE_KEY = "homeseaside_theme_override";

export type ThemeMode = "light" | "dark";
export type ThemeOverride = ThemeMode | "auto";

interface TimeOfDay {
  /** Resolved phase based on the current local hour. */
  phase: DayPhase;
  /** The theme that's actually applied: override if set, else phase-derived. */
  theme: ThemeMode;
  /** What the user has set: "auto" means follow the schedule. */
  override: ThemeOverride;
  /** Set the user's override. "auto" returns to schedule-driven. */
  setOverride: (next: ThemeOverride) => void;
}

function readOverride(): ThemeOverride {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem(THEME_OVERRIDE_KEY);
  return stored === "light" || stored === "dark" ? stored : "auto";
}

/**
 * Reactive day-phase + theme.
 *
 * The phase recomputes at the exact next cutoff (no polling — one timeout
 * scheduled per phase boundary). The hook also listens for storage events so
 * if you toggle the theme in another tab, this tab updates too.
 */
export function useTimeOfDay(): TimeOfDay {
  const compute = useCallback((): { phase: DayPhase; theme: ThemeMode; override: ThemeOverride } => {
    const phase = phaseForHour(new Date().getHours());
    const override = readOverride();
    const theme = override === "auto" ? PHASE_THEME[phase] : override;
    return { phase, theme, override };
  }, []);

  const [state, setState] = useState(compute);

  useEffect(() => {
    let timer: number | undefined;

    const tick = () => {
      setState(compute());
      const now = new Date();
      const currentPhase = phaseForHour(now.getHours());
      const endsAtHour = phaseEndsAt(currentPhase);
      const next = new Date(now);
      next.setHours(endsAtHour, 0, 0, 100); // +100ms buffer past the cutoff
      if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
      const delay = next.getTime() - now.getTime();
      timer = window.setTimeout(tick, delay);
    };

    tick();

    const onStorage = (e: StorageEvent) => {
      // React to theme override changes AND admin schedule edits — both feed
      // back into the resolved phase/theme.
      if (e.key === THEME_OVERRIDE_KEY || e.key === SCHEDULE_STORAGE_KEY) {
        if (timer !== undefined) window.clearTimeout(timer);
        tick();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [compute]);

  // Intentionally does NOT write data-theme to the DOM — that's the root
  // component's job (TopBar today, App in Phase 1). Multiple writers would
  // race. Consumers read `theme` from this hook and decide what to do with it.

  const setOverride = useCallback((next: ThemeOverride) => {
    if (typeof window === "undefined") return;
    if (next === "auto") window.localStorage.removeItem(THEME_OVERRIDE_KEY);
    else window.localStorage.setItem(THEME_OVERRIDE_KEY, next);
    setState(compute());
  }, [compute]);

  return { ...state, setOverride };
}
