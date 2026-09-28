import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('Dealivrd API', () => {
  const app = createApp();

  it('returns ranked deals for a valid ZIP code', async () => {
    const response = await request(app).get('/api/search').query({ zip: '19104', sort: 'monthlyCost' }).expect(200);

    expect(response.body.deals.length).toBeGreaterThan(0);
    expect(response.body.coverageNotice).toContain('not verified');
  });

  it('rejects malformed ZIP codes at the server boundary', async () => {
    const response = await request(app).get('/api/search').query({ zip: 'abcde' }).expect(400);

    expect(response.body.error).toContain('5-digit');
  });

  it('exposes source status without requiring browser-side source fetching', async () => {
    const response = await request(app).get('/api/sources/status').expect(200);

    expect(response.body.securityNotes[0]).toContain('server-side only');
    expect(response.body.sources.some((source: { id: string }) => source.id === 'nhtsa-vpic')).toBe(true);
  });
});
