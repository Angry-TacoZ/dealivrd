export interface PublicSourceAdapter {
  id: string;
  sourceName: string;
  baseUrl: string;
  supportsZip: boolean;
  plannedSignals: string[];
}

export const publicSourceAdapters: PublicSourceAdapter[] = [
  {
    id: 'toyota-public-offers',
    sourceName: 'Toyota public offers',
    baseUrl: 'https://www.toyota.com/deals-incentives/',
    supportsZip: true,
    plannedSignals: ['cash rebates', 'APR terms', 'expiration date', 'regional availability'],
  },
  {
    id: 'ford-public-offers',
    sourceName: 'Ford public offers',
    baseUrl: 'https://www.ford.com/incentives/',
    supportsZip: true,
    plannedSignals: ['APR terms', 'lease terms', 'bonus cash', 'inventory caveats'],
  },
  {
    id: 'hyundai-public-offers',
    sourceName: 'Hyundai public offers',
    baseUrl: 'https://www.hyundaiusa.com/us/en/offers',
    supportsZip: true,
    plannedSignals: ['lease terms', 'finance APR', 'retail bonus cash', 'eligibility copy'],
  },
];

export function getAdapterSecurityNotes(): string[] {
  return [
    'Adapters run server-side only; browser code never fetches OEM offer pages directly.',
    'Adapters must respect public pages, robots/terms, request throttling, and source caching.',
    'Anti-bot, authenticated, or private dealer portals are out of scope for public-source V1.',
  ];
}
