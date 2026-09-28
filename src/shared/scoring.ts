import type { Confidence, DealResult, DealScore, IncentiveOffer, SortMetric, VehicleModel } from './types';

const confidenceWeight: Record<Confidence, number> = {
  high: 100,
  medium: 72,
  low: 44,
  'not-verified': 12,
};

export function estimateFinanceMonthly(vehicle: VehicleModel, offer: IncentiveOffer): number {
  const term = offer.financeTermMonths ?? 60;
  const principal = Math.max(vehicle.msrp - offer.cashAmount, 0);

  if (offer.aprPercent === null || offer.aprPercent <= 0) {
    return Math.round(principal / term);
  }

  const monthlyRate = offer.aprPercent / 100 / 12;
  const payment = (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -term);

  return Math.round(payment);
}

export function effectiveLeaseMonthly(offer: IncentiveOffer): number | null {
  if (offer.leaseMonthly === null || offer.leaseTermMonths === null) {
    return null;
  }

  return Math.round(offer.leaseMonthly + (offer.leaseDueAtSigning ?? 0) / offer.leaseTermMonths);
}

export function scoreDeal(vehicle: VehicleModel, offer: IncentiveOffer, now = new Date()): DealScore {
  const financeMonthly = estimateFinanceMonthly(vehicle, offer);
  const leaseEffective = effectiveLeaseMonthly(offer);
  const daysToExpiration = Math.max(
    0,
    Math.ceil((new Date(`${offer.expiresAt}T23:59:59`).getTime() - now.getTime()) / 86_400_000),
  );
  const fetchedAgeHours = Math.max(0, (now.getTime() - new Date(offer.fetchedAt).getTime()) / 3_600_000);

  const monthlyCost = clampScore(100 - ((leaseEffective ?? financeMonthly) - 225) / 5);
  const totalRebates = clampScore((offer.cashAmount / 7_500) * 100);
  const aprValue = offer.aprPercent === null ? 20 : clampScore(100 - offer.aprPercent * 15);
  const leaseValue = leaseEffective === null ? 18 : clampScore(100 - (leaseEffective - 260) / 3);
  const freshness = clampScore(100 - fetchedAgeHours / 2 - Math.max(0, 10 - daysToExpiration) * 3);
  const confidence = confidenceWeight[offer.parserConfidence];

  return {
    overall: Math.round(monthlyCost * 0.3 + totalRebates * 0.18 + aprValue * 0.18 + leaseValue * 0.16 + freshness * 0.1 + confidence * 0.08),
    monthlyCost: Math.round(monthlyCost),
    totalRebates: Math.round(totalRebates),
    aprValue: Math.round(aprValue),
    leaseValue: Math.round(leaseValue),
    freshness: Math.round(freshness),
    confidence,
  };
}

export function buildDealResult(vehicle: VehicleModel, offer: IncentiveOffer, now?: Date): DealResult {
  return {
    vehicle,
    offer,
    score: scoreDeal(vehicle, offer, now),
    estimatedMonthly: estimateFinanceMonthly(vehicle, offer),
    effectiveLeaseMonthly: effectiveLeaseMonthly(offer),
  };
}

export function sortDeals(deals: DealResult[], metric: SortMetric): DealResult[] {
  const scoreField = metric === 'overall' ? 'overall' : metric;
  return [...deals].sort((a, b) => {
    const primary = b.score[scoreField] - a.score[scoreField];
    if (primary !== 0) {
      return primary;
    }
    return a.estimatedMonthly - b.estimatedMonthly;
  });
}

export function metricLabel(metric: SortMetric): string {
  const labels: Record<SortMetric, string> = {
    overall: 'Best overall',
    monthlyCost: 'Monthly cost',
    totalRebates: 'Total rebates',
    aprValue: 'APR value',
    leaseValue: 'Lease value',
    freshness: 'Freshness',
  };
  return labels[metric];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
