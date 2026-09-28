import { z } from 'zod';

export const zipSchema = z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit US ZIP code.');

export const searchQuerySchema = z.object({
  zip: zipSchema.default('19104'),
  sort: z
    .enum(['overall', 'monthlyCost', 'totalRebates', 'aprValue', 'leaseValue', 'freshness'])
    .default('overall'),
  tab: z.enum(['best', 'finance', 'lease', 'rebates']).default('best'),
  make: z.string().min(1).max(40).optional(),
  bodyStyle: z.enum(['any', 'sedan', 'suv', 'truck', 'hatchback', 'minivan']).default('any'),
  fuelType: z.enum(['any', 'gas', 'hybrid', 'plug-in hybrid', 'electric']).default('any'),
  paymentCap: z.coerce.number().int().min(150).max(2500).optional(),
  termMonths: z.coerce.number().int().min(24).max(84).optional(),
  minConfidence: z.enum(['high', 'medium', 'low', 'not-verified']).optional(),
});
