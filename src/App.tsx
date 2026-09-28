import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Filter,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { getSourceStatus, searchDeals } from './lib/api';
import { metricLabel } from './shared/scoring';
import { vehicleModels } from './shared/sampleData';
import type { BodyStyle, DealResult, FuelType, SearchFilters, SortMetric, SourceStatus } from './shared/types';

const tabs: Array<{ label: string; value: SearchFilters['tab'] }> = [
  { label: 'Best', value: 'best' },
  { label: 'Finance', value: 'finance' },
  { label: 'Lease', value: 'lease' },
  { label: 'Rebates', value: 'rebates' },
];

const sortMetrics: Array<{ label: string; value: SortMetric }> = [
  { label: 'Best overall', value: 'overall' },
  { label: 'Monthly cost', value: 'monthlyCost' },
  { label: 'Total rebates', value: 'totalRebates' },
  { label: 'APR value', value: 'aprValue' },
  { label: 'Lease value', value: 'leaseValue' },
  { label: 'Freshness', value: 'freshness' },
];

const bodyStyles: Array<BodyStyle | 'any'> = ['any', 'sedan', 'suv', 'truck', 'hatchback', 'minivan'];
const fuelTypes: Array<FuelType | 'any'> = ['any', 'gas', 'hybrid', 'plug-in hybrid', 'electric'];

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    zip: '19104',
    sort: 'overall',
    tab: 'best',
    bodyStyle: 'any',
    fuelType: 'any',
    paymentCap: 700,
  });
  const [zipDraft, setZipDraft] = useState('19104');
  const [deals, setDeals] = useState<DealResult[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [notice, setNotice] = useState('Loading public-source coverage...');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    void getSourceStatus().then((result) => {
      setSources(result.sources);
      setNotice(result.coverageNotice);
    });
  }, []);

  useEffect(() => {
    let ignore = false;
    void searchDeals(filters).then((result) => {
      if (ignore) {
        return;
      }
      setDeals(result.deals);
      setNotice(result.coverageNotice);
      setSelectedOfferId((current) => current ?? result.deals[0]?.offer.id ?? null);
    });
    return () => {
      ignore = true;
    };
  }, [filters]);

  const selectedDeal = useMemo(
    () => deals.find((deal) => deal.offer.id === selectedOfferId) ?? deals[0],
    [deals, selectedOfferId],
  );

  const makes = useMemo(() => Array.from(new Set(vehicleModels.map((vehicle) => vehicle.make))).sort(), []);

  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function runZipSearch() {
    if (!/^\d{5}$/.test(zipDraft)) {
      setZipError('Enter a 5-digit ZIP code.');
      return;
    }
    setZipError('');
    updateFilter('zip', zipDraft);
    setSelectedOfferId(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Dealivrd home">
          <span className="brand-mark">D</span>
          <span>Dealivrd</span>
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#rankings">Rankings</a>
          <a href="#sources">Sources</a>
          <a href="#method">Method</a>
        </nav>
        <div className="trust-strip">
          <ShieldCheck size={17} />
          {import.meta.env.MODE === 'pages' ? 'Demo: sample offers, not current verified deals' : 'Server-side public-source adapters'}
        </div>
      </header>

      <section className="search-band" aria-label="Deal search controls">
        <div>
          <h1>Rank local new-car deals by payment impact.</h1>
          <p>Compare finance, lease, rebate, freshness, and confidence signals. Missing public data is shown as not verified.</p>
        </div>
        <form
          className="zip-search"
          onSubmit={(event) => {
            event.preventDefault();
            runZipSearch();
          }}
        >
          <label htmlFor="zip">ZIP code</label>
          <div className="zip-input">
            <MapPin size={18} />
            <input
              id="zip"
              inputMode="numeric"
              maxLength={5}
              value={zipDraft}
              onChange={(event) => setZipDraft(event.target.value.replace(/\D/g, '').slice(0, 5))}
            />
            <button type="submit">
              <Search size={17} />
              Search
            </button>
          </div>
          {zipError ? <span className="field-error">{zipError}</span> : null}
        </form>
      </section>

      <section className="workspace" id="rankings">
        <aside className="filter-rail" aria-label="Filters">
          <div className="rail-heading">
            <Filter size={18} />
            Filters
          </div>

          <label>
            Make
            <select value={filters.make ?? ''} onChange={(event) => updateFilter('make', event.target.value || undefined)}>
              <option value="">All makes</option>
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </label>

          <label>
            Body style
            <select value={filters.bodyStyle} onChange={(event) => updateFilter('bodyStyle', event.target.value as BodyStyle | 'any')}>
              {bodyStyles.map((style) => (
                <option key={style} value={style}>
                  {titleCase(style)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fuel type
            <select value={filters.fuelType} onChange={(event) => updateFilter('fuelType', event.target.value as FuelType | 'any')}>
              {fuelTypes.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {titleCase(fuel)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Payment cap
            <input
              type="range"
              min="300"
              max="1000"
              step="25"
              value={filters.paymentCap}
              onChange={(event) => updateFilter('paymentCap', Number(event.target.value))}
            />
            <span className="range-value">${filters.paymentCap}/mo</span>
          </label>

          <label>
            Term
            <select
              value={filters.termMonths ?? ''}
              onChange={(event) => updateFilter('termMonths', event.target.value ? Number(event.target.value) : undefined)}
            >
              <option value="">Any term</option>
              <option value="36">36 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
              <option value="72">72 months</option>
            </select>
          </label>

          <label>
            Confidence
            <select
              value={filters.minConfidence ?? ''}
              onChange={(event) => updateFilter('minConfidence', (event.target.value || undefined) as SearchFilters['minConfidence'])}
            >
              <option value="">Any confidence</option>
              <option value="medium">Medium or higher</option>
              <option value="high">High only</option>
            </select>
          </label>
        </aside>

        <section className="rank-board">
          <div className="board-toolbar">
            <div className="segments" role="tablist" aria-label="Offer type">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={filters.tab === tab.value ? 'active' : ''}
                  onClick={() => {
                    updateFilter('tab', tab.value);
                    setSelectedOfferId(null);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <label className="sort-select">
              <ArrowDownUp size={16} />
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as SortMetric)}>
                {sortMetrics.map((metric) => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="notice-row" role="note">
            <AlertTriangle size={17} />
            {notice}
          </div>

          <div className="metric-header">
            <span>Ranked deal</span>
            <span>{metricLabel(filters.sort)}</span>
            <span>Bars</span>
            <span>Confidence</span>
          </div>

          <div className="deal-list">
            {deals.length ? (
              deals.map((deal, index) => (
                <button
                  key={deal.offer.id}
                  type="button"
                  className={`deal-row ${selectedDeal?.offer.id === deal.offer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOfferId(deal.offer.id)}
                >
                  <span className="rank">{index + 1}</span>
                  <span className="vehicle-title">
                    <strong>
                      {deal.vehicle.year} {deal.vehicle.make} {deal.vehicle.model}
                    </strong>
                    <small>
                      {deal.vehicle.trim} / {titleCase(deal.vehicle.bodyStyle)} / {titleCase(deal.vehicle.fuelType)}
                    </small>
                  </span>
                  <span className="primary-metric">{deal.score[filters.sort]}%</span>
                  <span className="bar-stack" aria-label={`Score bars for ${deal.vehicle.make} ${deal.vehicle.model}`}>
                    <MetricBar label="Monthly" value={deal.score.monthlyCost} color="emerald" />
                    <MetricBar label="Rebate" value={deal.score.totalRebates} color="blue" />
                    <MetricBar label="APR" value={deal.score.aprValue} color="amber" />
                  </span>
                  <span className={`confidence ${deal.offer.parserConfidence}`}>{titleCase(deal.offer.parserConfidence)}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <SlidersHorizontal size={24} />
                <strong>No verified public-source fixture deals match these filters.</strong>
                <span>Loosen filters or treat this as a coverage gap, not proof that no local deal exists.</span>
              </div>
            )}
          </div>
        </section>

        <DealDetail deal={selectedDeal} sources={sources} />
      </section>
    </main>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: 'emerald' | 'blue' | 'amber' }) {
  return (
    <span className="metric-bar">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className={`bar-fill ${color}`} style={{ width: `${value}%` }} />
      </span>
      <span className="bar-value">{value}</span>
    </span>
  );
}

function DealDetail({ deal, sources }: { deal?: DealResult; sources: SourceStatus[] }) {
  if (!deal) {
    return (
      <aside className="detail-panel">
        <div className="empty-state">
          <Gauge size={24} />
          <strong>Select a deal to inspect terms.</strong>
        </div>
      </aside>
    );
  }

  const source = sources.find((candidate) => candidate.name === deal.offer.sourceName);

  return (
    <aside className="detail-panel" aria-label="Selected deal details">
      <div className="detail-top">
        <span className="detail-kicker">Selected deal</span>
        <h2>
          {deal.vehicle.make} {deal.vehicle.model} {deal.vehicle.trim}
        </h2>
        <p>{deal.offer.coverageNote}</p>
      </div>

      <div className="detail-grid">
        <MetricTile icon={<BadgeDollarSign size={18} />} label="Rebate stack" value={formatCurrency(deal.offer.cashAmount)} />
        <MetricTile icon={<Gauge size={18} />} label="Finance APR" value={deal.offer.aprPercent === null ? 'Not verified' : `${deal.offer.aprPercent}%`} />
        <MetricTile icon={<CalendarClock size={18} />} label="Lease effective" value={deal.effectiveLeaseMonthly === null ? 'Not verified' : `${formatCurrency(deal.effectiveLeaseMonthly)}/mo`} />
        <MetricTile icon={<CheckCircle2 size={18} />} label="Confidence" value={titleCase(deal.offer.parserConfidence)} />
      </div>

      <section className="detail-section">
        <h3>Eligibility notes</h3>
        <ul>
          {deal.offer.eligibility.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h3>Terms</h3>
        <dl>
          <div>
            <dt>Finance term</dt>
            <dd>{deal.offer.financeTermMonths ? `${deal.offer.financeTermMonths} months` : 'Not verified'}</dd>
          </div>
          <div>
            <dt>Lease term</dt>
            <dd>{deal.offer.leaseTermMonths ? `${deal.offer.leaseTermMonths} months` : 'Not verified'}</dd>
          </div>
          <div>
            <dt>Due at signing</dt>
            <dd>{deal.offer.leaseDueAtSigning ? formatCurrency(deal.offer.leaseDueAtSigning) : 'Not verified'}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{new Date(`${deal.offer.expiresAt}T12:00:00`).toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>

      <section className="source-box" id="sources">
        <h3>Public source</h3>
        <p>{source?.coverage ?? 'Fixture source coverage is not verified.'}</p>
        <a href={deal.offer.sourceUrl} target="_blank" rel="noreferrer">
          Open source <ExternalLink size={14} />
        </a>
        <span>Fetched {new Date(deal.offer.fetchedAt).toLocaleString()}</span>
      </section>
    </aside>
  );
}

function MetricTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric-tile">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function titleCase(value: string): string {
  return value
    .split(/[\s-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
