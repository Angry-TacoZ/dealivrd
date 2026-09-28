import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { buildDealResult, sortDeals } from '../shared/scoring';
import { incentiveOffers, sourceStatuses, vehicleModels } from '../shared/sampleData';
import type { Confidence, DealResult, OfferType } from '../shared/types';
import { searchQuerySchema } from '../shared/validation';
import { getAdapterSecurityNotes, publicSourceAdapters } from './sources';

const confidenceRank: Record<Confidence, number> = {
  'not-verified': 0,
  low: 1,
  medium: 2,
  high: 3,
};

const tabOfferType: Record<string, OfferType | null> = {
  best: null,
  finance: 'finance',
  lease: 'lease',
  rebates: 'rebate',
};

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'dealivrd-api' });
  });

  app.get('/api/models', (_req, res) => {
    res.json({ models: vehicleModels });
  });

  app.get('/api/sources/status', (_req, res) => {
    res.json({
      sources: sourceStatuses,
      adapters: publicSourceAdapters,
      securityNotes: getAdapterSecurityNotes(),
      coverageNotice: 'Public-source V1 means missing data is not verified, never proof that no deal exists.',
    });
  });

  app.get('/api/offers/:id', (req, res) => {
    const offer = incentiveOffers.find((candidate) => candidate.id === req.params.id);
    if (!offer) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }

    const vehicle = vehicleModels.find((candidate) => candidate.id === offer.vehicleId);
    if (!vehicle) {
      res.status(500).json({ error: 'Offer is missing its vehicle model.' });
      return;
    }

    res.json({ deal: buildDealResult(vehicle, offer) });
  });

  app.get('/api/search', (req, res) => {
    try {
      const filters = searchQuerySchema.parse(req.query);
      const requestedOfferType = tabOfferType[filters.tab];
      const deals: DealResult[] = incentiveOffers
        .filter((offer) => offer.zip === filters.zip)
        .map((offer) => {
          const vehicle = vehicleModels.find((candidate) => candidate.id === offer.vehicleId);
          return vehicle ? buildDealResult(vehicle, offer) : null;
        })
        .filter((deal): deal is DealResult => deal !== null)
        .filter((deal) => !requestedOfferType || deal.offer.offerTypes.includes(requestedOfferType))
        .filter((deal) => !filters.make || deal.vehicle.make === filters.make)
        .filter((deal) => filters.bodyStyle === 'any' || deal.vehicle.bodyStyle === filters.bodyStyle)
        .filter((deal) => filters.fuelType === 'any' || deal.vehicle.fuelType === filters.fuelType)
        .filter((deal) => !filters.paymentCap || Math.min(deal.estimatedMonthly, deal.effectiveLeaseMonthly ?? deal.estimatedMonthly) <= filters.paymentCap)
        .filter((deal) => !filters.termMonths || deal.offer.financeTermMonths === filters.termMonths || deal.offer.leaseTermMonths === filters.termMonths)
        .filter((deal) => !filters.minConfidence || confidenceRank[deal.offer.parserConfidence] >= confidenceRank[filters.minConfidence]);

      res.json({
        filters,
        deals: sortDeals(deals, filters.sort),
        coverageNotice: 'Best-effort public-source data. Missing public data means not verified, not no deal.',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid search filters.' });
        return;
      }

      res.status(500).json({ error: 'Unable to search deals.' });
    }
  });

  return app;
}
