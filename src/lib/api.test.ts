import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchDeals } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('static demo search', () => {
  it('applies filters when no server is available', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const result = await searchDeals({ zip: '19104', tab: 'lease', sort: 'overall', make: 'Hyundai' });
    expect(result.deals.length).toBeGreaterThan(0);
    expect(result.deals.every((deal) => deal.vehicle.make === 'Hyundai' && deal.offer.offerTypes.includes('lease'))).toBe(true);
    const empty = await searchDeals({ zip: '00000', tab: 'best', sort: 'overall' });
    expect(empty.deals).toEqual([]);
    expect(empty.coverageNotice).toContain('not verified');
  });
});
