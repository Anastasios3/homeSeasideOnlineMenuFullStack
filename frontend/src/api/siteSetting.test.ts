import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { fetchSiteSetting, updateSiteSetting } from './siteSetting';
import { setAdminToken } from '../auth';

vi.mock('axios');
const mockedGet = vi.mocked(axios.get);
const mockedPatch = vi.mocked(axios.patch);

beforeEach(() => {
  mockedGet.mockReset();
  mockedPatch.mockReset();
});

describe('fetchSiteSetting', () => {
  it('GETs /site_setting and returns the body', async () => {
    const payload = {
      schedule: { cutoffs: {}, categoryOrder: {} },
      subcategories: {},
      homepage_photos: { hero: null, hero_picks: {}, journey: [], gallery: [], curation: [] },
      updated_at: null,
    };
    mockedGet.mockResolvedValueOnce({ data: payload });
    const result = await fetchSiteSetting();
    expect(mockedGet).toHaveBeenCalledWith('http://localhost:3000/site_setting');
    expect(result).toEqual(payload);
  });

  it('does not require auth (public endpoint)', async () => {
    mockedGet.mockResolvedValueOnce({ data: {} });
    await fetchSiteSetting();
    const [, config] = mockedGet.mock.calls[0];
    expect(config).toBeUndefined();
  });
});

describe('updateSiteSetting', () => {
  it('throws when no admin token is set', async () => {
    sessionStorage.clear();
    await expect(updateSiteSetting({ schedule: { cutoffs: {}, categoryOrder: {} } as never })).rejects.toThrow(/Not authenticated/);
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it('PATCHes /site_setting with the Bearer token and partial payload', async () => {
    setAdminToken('admin-jwt');
    const partial = { subcategories: { coffee: [] } } as never;
    mockedPatch.mockResolvedValueOnce({ data: { applied: true } });
    await updateSiteSetting(partial);
    expect(mockedPatch).toHaveBeenCalledWith(
      'http://localhost:3000/site_setting',
      partial,
      { headers: { Authorization: 'Bearer admin-jwt' } },
    );
  });

  it('returns the response payload to the caller', async () => {
    setAdminToken('admin-jwt');
    const response = { schedule: { cutoffs: {}, categoryOrder: {} }, subcategories: {}, homepage_photos: {}, updated_at: '2026-06-11' };
    mockedPatch.mockResolvedValueOnce({ data: response });
    const result = await updateSiteSetting({});
    expect(result).toEqual(response);
  });
});
