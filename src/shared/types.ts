export type OfferType = 'finance' | 'lease' | 'rebate';

export type BodyStyle = 'sedan' | 'suv' | 'truck' | 'hatchback' | 'minivan';

export type FuelType = 'gas' | 'hybrid' | 'plug-in hybrid' | 'electric';

export type Confidence = 'high' | 'medium' | 'low' | 'not-verified';

export type SortMetric =
  | 'overall'
  | 'monthlyCost'
  | 'totalRebates'
  | 'aprValue'
  | 'leaseValue'
  | 'freshness';

export interface VehicleModel {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: BodyStyle;
  fuelType: FuelType;
  msrp: number;
  sourceIds: {
    vpic?: string;
    fueleconomy?: string;
  };
}

export interface IncentiveOffer {
  id: string;
  vehicleId: string;
  zip: string;
  region: string;
  offerTypes: OfferType[];
  cashAmount: number;
  aprPercent: number | null;
  financeTermMonths: number | null;
  leaseMonthly: number | null;
  leaseDueAtSigning: number | null;
  leaseTermMonths: number | null;
  expiresAt: string;
  eligibility: string[];
  sourceUrl: string;
  sourceName: string;
  fetchedAt: string;
  parserConfidence: Confidence;
  coverageNote: string;
}

export interface DealScore {
  overall: number;
  monthlyCost: number;
  totalRebates: number;
  aprValue: number;
  leaseValue: number;
  freshness: number;
  confidence: number;
}

export interface DealResult {
  vehicle: VehicleModel;
  offer: IncentiveOffer;
  score: DealScore;
  estimatedMonthly: number;
  effectiveLeaseMonthly: number | null;
}

export interface SourceStatus {
  id: string;
  name: string;
  category: 'model-catalog' | 'oem-offer' | 'tax-credit';
  status: 'fixture-backed' | 'adapter-planned' | 'historical';
  coverage: string;
  lastChecked: string;
  url: string;
}

export interface SearchFilters {
  zip: string;
  sort: SortMetric;
  tab: 'best' | 'finance' | 'lease' | 'rebates';
  make?: string;
  bodyStyle?: BodyStyle | 'any';
  fuelType?: FuelType | 'any';
  paymentCap?: number;
  termMonths?: number;
  minConfidence?: Confidence;
}
