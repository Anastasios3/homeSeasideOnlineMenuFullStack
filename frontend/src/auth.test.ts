import { describe, expect, it } from 'vitest';
import { clearAdminToken, getAdminToken, setAdminToken } from './auth';

describe('auth token helpers', () => {
  it('returns null when no token has been set', () => {
    expect(getAdminToken()).toBeNull();
  });

  it('round-trips a token through sessionStorage', () => {
    setAdminToken('abc.def.ghi');
    expect(getAdminToken()).toBe('abc.def.ghi');
  });

  it('overwrites a prior token', () => {
    setAdminToken('first');
    setAdminToken('second');
    expect(getAdminToken()).toBe('second');
  });

  it('clearAdminToken removes the token', () => {
    setAdminToken('to-be-cleared');
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });

  it('uses sessionStorage so a new tab does not inherit the token', () => {
    setAdminToken('tab-scoped');
    expect(sessionStorage.getItem('homeseaside_admin_token')).toBe('tab-scoped');
    expect(localStorage.getItem('homeseaside_admin_token')).toBeNull();
  });
});
