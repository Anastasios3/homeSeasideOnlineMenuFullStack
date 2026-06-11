import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library unmounts components between tests so state in one
// case doesn't leak into the next.
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// jsdom doesn't implement matchMedia — stub it so anything that calls it
// during render gets a sane "no match" default.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
