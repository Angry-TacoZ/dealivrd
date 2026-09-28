# Dealivrd

Dealivrd is a consumer-first new-car deal comparison app. It ranks best-effort public-source finance, lease, and rebate offers by ZIP code and makes source coverage visible instead of pretending missing data means no deal exists.

## What Is Built

- React + Vite + TypeScript app with a modern ranked-deal board.
- Express API with server-side validation for ZIP, sort, tab, and filters.
- Shared domain model for `VehicleModel`, `IncentiveOffer`, and `DealScore`.
- Bar-graph ranking metrics for monthly cost, rebates, APR value, lease value, freshness, and confidence.
- Source transparency panel with public-source status and fetched timestamps.
- Fixture-backed proof data for Toyota, Ford, Hyundai, NHTSA vPIC, FuelEconomy.gov, and IRS clean-vehicle status.

## Commands

```bash
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

The dev command starts both the API and Vite:

- Frontend: `http://127.0.0.1:5193`
- API: `http://127.0.0.1:5194`

## GitHub Pages Demo

The Pages build is a static sample-data demo, not a live incentive service.
GitHub Pages cannot run the Express API. The demo labels offers as illustrative
and skips API requests. Sample offers may be expired and are not shopping quotes.

Build it with `npm run build -- --mode pages --base /dealivrd/`.
The workflow in `.github/workflows/pages.yml` verifies pull requests and deploys
successful builds on `main`. Configure repository Pages to use GitHub Actions.
Node.js 24 and `npm ci` reproduce the CI environment.

To roll back, revert the release commit on `main` and let the workflow redeploy.
Live data ingestion, hosting for the API, and complete US model coverage remain planned.

## API Endpoints

- `GET /api/health`
- `GET /api/models`
- `GET /api/search?zip=19104&sort=overall&tab=best`
- `GET /api/offers/:id`
- `GET /api/sources/status`

## Public-Source Contract

V1 is best-effort public aggregation. OEM public pages can vary by ZIP, inventory, JavaScript behavior, term language, and dealer participation. Dealivrd must show missing coverage as **not verified**, never as proof that no deal exists.

Future source adapters should run server-side only, respect public-source terms and robots guidance, throttle requests, cache snapshots, and avoid authenticated dealer portals or anti-bot bypassing.

## Design Reference

The implementation concept image is saved at:

`docs/design/dealivrd-concept.png`
