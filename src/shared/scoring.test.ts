import { describe, expect, it } from 'vitest';
import { buildDealResult, effectiveLeaseMonthly, estimateFinanceMonthly, sortDeals } from './scoring';
import { incentiveOffers, vehicleModels } from './sampleData';

describe('deal scoring', () => {
  it('normalizes due at signing into effective lease monthly cost', () => {
    const offer = incentiveOffers.find((candidate) => candidate.id === 'offer-ioniq5-philly');

    expect(offer).toBeDefined();
    expect(effectiveLeaseMonthly(offer!)).toBe(440);
  });

  it('uses rebate-adjusted principal for finance monthly estimates', () => {
    const offer = incentiveOffers.find((candidate) => candidate.id === 'offer-camry-philly');
    const vehicle = vehicleModels.find((candidate) => candidate.id === offer?.vehicleId);

    expect(estimateFinanceMonthly(vehicle!, offer!)).toBeLessThan(700);
  });

  it('sorts by selected ranking metric with monthly payment as tie breaker', () => {
    const now = new Date('2026-06-27T16:00:00-04:00');
    const deals = incentiveOffers.slice(0, 3).map((offer) => {
      const vehicle = vehicleModels.find((candidate) => candidate.id === offer.vehicleId);
      return buildDealResult(vehicle!, offer, now);
    });

    const sorted = sortDeals(deals, 'totalRebates');

    expect(sorted[0].offer.id).toBe('offer-ioniq5-philly');
  });
});
