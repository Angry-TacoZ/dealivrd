import { describe, expect, it } from 'vitest';
import { buildDealResult, effectiveLeaseMonthly, estimateFinanceMonthly, sortDeals } from './scoring';
import { incentiveOffers, vehicleModels } from './sampleData';

describe('deal scoring', () => {
  it('normalizes due at signing into effective lease monthly cost', () => {
    const offer = incentiveOffers.find((candidate) => candidate.id === 'offer-ioniq5-lease-philly-202609');

    expect(offer).toBeDefined();
    expect(effectiveLeaseMonthly(offer!)).toBe(597);
  });

  it('uses rebate-adjusted principal for finance monthly estimates', () => {
    const currentOffer = incentiveOffers.find((candidate) => candidate.id === 'offer-camry-apr-philly-202609');
    const offer = currentOffer ? { ...currentOffer, cashAmount: 1250 } : undefined;
    const vehicle = vehicleModels.find((candidate) => candidate.id === offer?.vehicleId);

    expect(estimateFinanceMonthly(vehicle!, offer!)).toBeLessThan(700);
  });

  it('sorts by selected ranking metric', () => {
    const now = new Date('2026-09-28T12:06:00-04:00');
    const deals = incentiveOffers.slice(0, 3).map((currentOffer, index) => {
      const offer = { ...currentOffer, cashAmount: [0, 500, 4000][index] };
      const vehicle = vehicleModels.find((candidate) => candidate.id === offer.vehicleId);
      return buildDealResult(vehicle!, offer, now);
    });

    const sorted = sortDeals(deals, 'totalRebates');

    expect(sorted[0].offer.id).toBe('offer-ioniq5-apr-philly-202609');
  });
});
