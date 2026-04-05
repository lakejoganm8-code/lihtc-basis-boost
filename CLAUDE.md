# CLAUDE.md

## Project: LIHTC Basis Boost Impact Tool
**Live:** https://lihtc-basis-boost.vercel.app
**Repo:** https://github.com/lakejoganm8-code/lihtc-basis-boost

## Commands

- `npm run dev` - Start dev server (Turbopack)
- `npm run build` - Production build
- `npm run build:data` - Regenerate QCT tract data from HUD ArcGIS API
- `npx tsc --noEmit` - Type check only

## Scope

- **Geographic focus**: NYC tri-state area (NY=36, NJ=34, CT=09 only)
- **QCT**: 5781 tracts in `data/qct-tracts.json` (96KB, Census TIGER/Line via bbox)
- **DDA**: 18 tri-state counties in `data/dda-counties.json`

## Architecture

- **Next.js 16.2.2** App Router, TypeScript, Tailwind CSS 4
- **Stateless**: No database, all data in `/data/` JSON files
- **Geocoding**: US Census Geocoder API (forward + reverse, free, no key)
- **Map**: react-leaflet + CartoDB Positron basemap, Census TIGERweb WMS for tract boundaries
- **Financial calc**: Client-side, side-by-side comparison (with/without 30% boost)
- **Server routes**: `/api/geocode` (Census proxy, forward+reverse), `/api/eligibility` (QCT+DDA check)
- **Client components**: All UI in `/components/`, orchestrated by `app/page.tsx` (multi-step flow with map)
- **Data generation**: `scripts/generate-data.ts` queries Census TIGERweb FeatureServer

## Key Files

- `lib/census-api.ts` - Census Geocoder client (forward + reverse with shared parser)
- `lib/calculations.ts` - Pure functions: calculate(), calculateComparison()
- `lib/qct.ts` / `lib/dda.ts` - Lazy-loaded Set lookups from JSON
- `components/location-map.tsx` - react-leaflet map, click-to-pin → reverse geocode → eligibility
- `components/results.tsx` - Side-by-side comparison cards
- `components/eligibility-badge.tsx` - QCT ✓/✗, DDA ✓/✗ badges
- `app/page.tsx` - Multi-step flow: address+map (side-by-side) → eligibility → financials → results

## Known Issues
- Census Geocoder returns block groups, not direct tract/county/state keys — fallback extraction is used
- County name may be empty for DC addresses (uses state abbreviation fallback)
- GeoJSON tract polygons (~43MB) are too heavy for client-side — use WMS tile layer instead

---

# Roadmap: 5-Phase Expansion
**Approved.** All 5 phases to be implemented sequentially.

## Phase 1 — Sources & Uses Breakdown (Capital Stack)
Replace single "Total Development Cost" input with structured Sources & Uses form.

**Uses (Development Costs):**
- Land acquisition, hard construction ($/sqft or $/unit), soft costs (arch, legal, permits)
- Developer fee (% of basis), financing costs, operating reserve, replacement reserve, contingency

**Sources (Capital Stack):**
- Construction loan, permanent debt, LIHTC equity, land contribution, deferred developer fee
- State/subsidy grants (HOME, CDBG), tax-exempt bonds
- Auto gap analysis: sources minus uses, flag shortfall/overage

**UI:** Stacked bar chart for capital stack visualization.
**New files:** `lib/sources-uses.ts` (types, gap calc), `components/sources-uses-form.tsx`, `components/capital-stack-chart.tsx`

## Phase 2 — Multi-Year Pro Forma
15-30 year projection table with income, expenses, debt service, and DSCR.

**Operating Income:** Gross potential rent by AMI tier, other income, vacancy allowance → Effective Gross Income
**Operating Expenses:** Property mgmt (%), taxes, insurance, utilities, maintenance, personnel, admin, reserves
**Metrics:** Annual DSCR (NOI / debt service), year-1 and year-15 highlighted, color-coded pass/fail
**Operating deficit flag:** Years where cash flow goes negative, cumulative shortfall sum
**Escalation:** Editable annual growth rates per category (rents 2-3%, expenses 2-4%)

**New files:** `lib/pro-forma.ts` (multi-year calc engine), `components/pro-forma-table.tsx`, `components/dscr-indicator.tsx`

## Phase 3 — Scenario Engine
Named scenarios with side-by-side comparison and sensitivity analysis.

**Scenarios:** Save named configurations, compare 9% vs 4%+bonds, boost on/off, different pricing
**Sensitivity sliders:** Credit price, cost/unit, vacancy, interest rate, expense growth — real-time pro forma update
**Breakeven analysis:** Minimum credit pricing for deal feasibility
**Tornado chart:** Which variable has biggest impact on net cash flow

**New files:** `lib/scenarios.ts` (scenario manager), `components/scenario-comparison.tsx`, `components/sensitivity-sliders.tsx`

## Phase 4 — Market & Rent Context
HUD data integration for income limits, rent comparables, and unit mix planning.

**HUD AMI limits:** Auto-fetch by county, household size → max allowable rents at 30/40/50/60% AMI
**Fair Market Rents:** Compare proposed LIHTC rents to area FMRs
**Unit mix builder:** Define bedroom × AMI tier per unit, auto-check against set-aside test (20/50 vs 40/60)
**Rent feasibility warning:** Flag if rents unrealistic vs. area FMRs

**New files:** `lib/hud-api.ts` (AMIs, FMRs proxy), `app/api/hud-ami/route.ts`, `app/api/hud-fmr/route.ts`, `components/unit-mix-builder.tsx`, `components/rent-comparison.tsx`

## Phase 5 — Compliance Dashboard
15-year compliance tracking, set-aside validation, and annual qualified basis recalculation.

**Compliance timeline:** Visual Gantt-style 15-year period with placed-in-service marker
**Applicable fraction tracker:** Unit fraction vs. floor space fraction, auto-select lesser
**Set-aside test checker:** 20/50 vs. 40/60 election + validation
**Qualified basis recalculator:** Adjusted for actual occupancy changes each year
**Form 8609 tracker:** Placed-in-service date, credit start year, annual milestones

**New files:** `lib/compliance.ts` (set-aside, fraction, basis tracking), `components/compliance-timeline.tsx`, `components/set-aside-checker.tsx`

## Implementation Order
1 → 2 → 3 → 4 → 5 (each phase builds on the previous). Phase 1 is the foundation for all others.
