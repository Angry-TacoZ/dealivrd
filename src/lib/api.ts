import { buildDealResult, sortDeals } from '../shared/scoring';
import { incentiveOffers, sourceStatuses, vehicleModels } from '../shared/sampleData';
import type { Confidence, DealResult, OfferType, SearchFilters, SourceStatus } from '../shared/types';

const confidenceRank: Record<Confidence, number> = { 'not-verified': 0, low: 1, medium: 2, high: 3 };
const tabOfferType: Record<SearchFilters['tab'], OfferType | null> = {
  best: null, finance: 'finance', lease: 'lease', rebates: 'rebate',
};

export interface SearchResponse {
  deals: DealResult[];
  coverageNotice: string;
}

export interface SourceResponse {
  sources: SourceStatus[];
  securityNotes: string[];
  coverageNotice: string;
}

export async function searchDeals(filters: SearchFilters): Promise<SearchResponse> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'any') {
      query.set(key, String(value));
    }
  });

  try {
    if (import.meta.env.MODE === 'pages') throw new Error('Static demo');
    const response = await fetch(`/api/search?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Search failed with ${response.status}`);
    }
    return (await response.json()) as SearchResponse;
  } catch {
    const deals = incentiveOffers
      .filter((offer) => offer.zip === filters.zip)
      .map((offer) => {
        const vehicle = vehicleModels.find((candidate) => candidate.id === offer.vehicleId);
        return vehicle ? buildDealResult(vehicle, offer) : null;
      })
      .filter((deal): deal is DealResult => deal !== null)
      .filter((deal) => !tabOfferType[filters.tab] || deal.offer.offerTypes.includes(tabOfferType[filters.tab]!))
      .filter((deal) => !filters.make || deal.vehicle.make === filters.make)
      .filter((deal) => !filters.bodyStyle || filters.bodyStyle === 'any' || deal.vehicle.bodyStyle === filters.bodyStyle)
      .filter((deal) => !filters.fuelType || filters.fuelType === 'any' || deal.vehicle.fuelType === filters.fuelType)
      .filter((deal) => !filters.paymentCap || Math.min(deal.estimatedMonthly, deal.effectiveLeaseMonthly ?? deal.estimatedMonthly) <= filters.paymentCap)
      .filter((deal) => !filters.termMonths || deal.offer.financeTermMonths === filters.termMonths || deal.offer.leaseTermMonths === filters.termMonths)
      .filter((deal) => !filters.minConfidence || confidenceRank[deal.offer.parserConfidence] >= confidenceRank[filters.minConfidence]);

    return {
      deals: sortDeals(deals, filters.sort),
      coverageNotice: import.meta.env.MODE === 'pages'
        ? 'Static snapshot of public offers checked Sep 28, 2026 for ZIP 19104. Confirm current eligibility and availability with the dealer. Missing data is not verified.'
        : 'Showing local fixture data because the API server is unavailable. Missing data is still not verified.',
    };
  }
}

export async function getSourceStatus(): Promise<SourceResponse> {
  try {
    if (import.meta.env.MODE === 'pages') throw new Error('Static demo');
    const response = await fetch('/api/sources/status');
    if (!response.ok) {
      throw new Error(`Source status failed with ${response.status}`);
    }
    return (await response.json()) as SourceResponse;
  } catch {
    return {
      sources: sourceStatuses,
      securityNotes: ['API unavailable; showing static public-source status fixtures.'],
      coverageNotice: 'Public-source V1 means missing data is not verified, never proof that no deal exists.',
    };
  }
}
