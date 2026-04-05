# LIHTC Basis Boost Impact Tool

A production-ready web application that determines whether a property qualifies for the **30% basis boost** under the Low-Income Housing Tax Credit (LIHTC) program per [IRC Section 42(d)(5)(C)](https://www.law.cornell.edu/uscode/text/26/42#d_5_C), and displays the financial impact through a side-by-side comparison.

**Live demo:** https://lihtc-basis-boost.vercel.app

## Background

### What is the LIHTC Basis Boost?

The Low-Income Housing Tax Credit (LIHTC) program, created under Section 42 of the Internal Revenue Code, is the primary federal tool for incentivizing the development of affordable rental housing. The program provides two main credit pathways — the 4% credit and the 9% credit — both calculated as a percentage of a project's **Qualified Basis** (the eligible portion of a development's basis multiplied by the applicable fraction).

Properties located in areas with higher concentrations of poverty or higher development costs receive a **30% boost to their Qualified Basis**, which directly increases both the annual tax credits and the total equity that can be raised from investors. This boost applies when a property is located in either:

1. **Qualified Census Tract (QCT):** Any census tract (or equivalent area) where at least 50% of households have income below 60% of Area Median Gross Income (AMGI).
2. **Difficult Development Area (DDA):** Areas with high construction, land, and utility costs relative to AMGI. DDAs are designated at the metropolitan (ZCTA-level) and non-metropolitan (county-level) scale.

This tool helps developers, syndicators, and investors quickly identify whether a specific property address qualifies for this basis boost and quantify the resulting financial impact.

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Deployment | Vercel (stateless, serverless API routes) |
| Build | Turbopack |

### Data Flow

```
User enters address
  └─► POST /api/geocode (server route)
        └─► US Census Geocoder API (free, no API key)
              └─► Returns: state FIPS, county FIPS, census tract, full 11-digit GEOID
                    └─► POST /api/eligibility (server route)
                          ├─► QCT check: O(1) Set lookup against data/qct-tracts.json
                          └─► DDA check: O(1) Set lookup against data/dda-counties.json
                                └─► Returns: { isQCT, isDDA, eligible, reason }
  └─► User enters financial inputs
        └─► Client-side calculation (no server round-trip)
              └─► Side-by-side: Without Boost vs With 30% Boost
```

### Decision Design: Why Server Routes for Lookup?

The eligibility check uses **server routes** (`/app/api/eligibility/route.ts`) rather than client-side code for two reasons:

1. **Data size:** The complete QCT tract FIPS list is ~100KB+ when uncompressed. Loading this client-side on every page visit would degrade initial page load significantly.
2. **Future flexibility:** The server route pattern allows swapping from the static JSON lookup to a dynamic ArcGIS API query or database without changing the frontend.

The financial calculations, by contrast, run **entirely client-side** since they are simple deterministic math that benefit from instant feedback as the user adjusts inputs.

## Financial Calculations

The calculation engine (`lib/calculations.ts`) implements the LIHTC formula per the IRS regulations:

### Without Boost

```
Eligible Basis   = Total Development Cost × Eligible Basis %
Qualified Basis  = Eligible Basis × Applicable Fraction %
Annual Credits   = Qualified Basis × Credit Rate (4% or 9%)
Total Credits    = Annual Credits × 10 years
Equity           = Total Credits × Equity Pricing ($ per credit)
```

### With 30% Boost

```
Eligible Basis   = Total Development Cost × Eligible Basis %
Qualified Basis  = (Eligible Basis × Applicable Fraction %) × 1.30  ← 30% boost
Annual Credits   = Qualified Basis × Credit Rate (4% or 9%)
Total Credits    = Annual Credits × 10 years
Equity           = Total Credits × Equity Pricing ($ per credit)
```

### Example Impact

For a $5M development with 80% eligible basis, 100% applicable fraction, 9% credit, and $0.95 equity pricing:

| | Without Boost | With Boost |
|---|---|---|
| Eligible Basis | $4,000,000 | $4,000,000 |
| Qualified Basis | $4,000,000 | $5,200,000 |
| Annual Credits | $360,000 | $468,000 |
| Total Credits | $3,600,000 | $4,680,000 |
| Equity | $3,420,000 | $4,446,000 |

**Additional equity from boost: +$1,026,000 (30.0% increase)**

## Project Structure

```
lihtc-basis-boost/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, metadata
│   ├── page.tsx                    # Main client component: orchestrates the multi-step flow
│   ├── globals.css                 # Tailwind CSS v4 + minimal overrides
│   └── api/
│       ├── geocode/
│       │   └── route.ts            # POST: Address → Census Geocoder → tract/county/state
│       └── eligibility/
│           └── route.ts            # POST: { tract, countyFips, stateFips } → QCT/DDA check
├── components/
│   ├── address-form.tsx            # 4-field address form (street, city, state dropdown, ZIP)
│   ├── financial-inputs.tsx        # Financial parameters: TDC, basis %, fraction, credit type, pricing
│   ├── results.tsx                 # Side-by-side comparison cards with equity delta display
│   ├── eligibility-badge.tsx       # QCT ✓/✗ and DDA ✓/✗ status badges
│   └── loading-spinner.tsx         # Minimal spinner component
├── lib/
│   ├── types.ts                    # All TypeScript interfaces across the application
│   ├── calculations.ts             # Financial calculation engine (pure functions)
│   ├── census-api.ts               # Server-side Census Geocoder API client with fallback logic
│   ├── qct.ts                      # QCT tract FIPS lookup (lazy-loaded Set from JSON)
│   └── dda.ts                      # DDA county FIPS lookup (lazy-loaded Set from JSON)
├── data/
│   ├── qct-tracts.json             # Sorted string array of QCT tract FIPS codes (sample: ~60 tracts)
│   └── dda-counties.json           # 5-digit FIPS codes of non-metro DDA counties (sample: ~45 counties)
├── scripts/
│   └── generate-data.ts            # Build script: fetches full QCT list from HUD ArcGIS → generates JSON
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── postcss.config.mjs
```

## Data Sources

### Geocoding: US Census Bureau Geocoder

- **Endpoint:** `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress`
- **Authentication:** None required (public API)
- **Parameters:** `benchmark=Public_AR_Current`, `vintage=Current_Current`, `layers=10`
- **Returns:** Full 11-digit GEOID (STATE + COUNTY + TRACT), county name, state abbreviation
- **Rate limiting:** No official documented limit, but the API may throttle on excessive use. Production deployments should consider caching or implementing request queuing.
- **Boundary year:** Uses current Census Bureau boundaries (2020-based as of 2026).

### Qualified Census Tracts: HUD User

- **Source:** [HUD QCT Dataset](https://www.huduser.gov/portal/datasets/qct.html)
- **Format:** Originally distributed as ESRI shapefiles; we convert to a compact sorted string array of 11-digit FIPS codes via the ArcGIS REST API.
- **2025 designation:** Uses 2020 Census tract boundaries, effective from July 1, 2025.
- **ArcGIS REST endpoint:** `https://services3.arcgis.com/QnAlpI4OtHhbgGN9/arcgis/rest/services/FCPR_Webmap_V_1_WFL1/FeatureServer/0`
- **The `generate-data.ts` script** queries this endpoint with `where=QCT_DESIGNATION='QCT'` and writes the complete list to `/data/qct-tracts.json`.

### Difficult Development Areas: HUD User

- **Source:** [HUD DDA Dataset](https://www.huduser.gov/portal/sadda/sadda_qct.html)
- **Non-metro DDAs:** Designated by county boundaries. We maintain a compact list of 5-digit FIPS codes in `/data/dda-counties.json`.
- **Metro DDAs:** Designated by ZIP Code Tabulation Area (ZCTA) boundaries — see Known Limitations below.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Running Locally

```bash
# Clone the repository
git clone https://github.com/lakejoganm8-code/lihtc-basis-boost.git
cd lihtc-basis-boost

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack (localhost:3000) |
| `npm run build` | Production build (compiles TypeScript, optimizes output) |
| `npm run start` | Start the production server |
| `npm run build:data` | Regenerate QCT tract data from the HUD ArcGIS API |

### Regenerating the Full Dataset

The shipped `data/` files contain sample data (~60 QCT tracts, ~45 DDA counties) sufficient for demonstration. To fetch the complete dataset:

```bash
npm run build:data
```

This runs `scripts/generate-data.ts`, which:
1. Queries the HUD ArcGIS REST API for all features where `QCT_DESIGNATION = 'QCT'`
2. Extracts the `TRACT` field from each feature
3. Sorts and writes the deduplicated list to `data/qct-tracts.json`
4. Includes retry logic with exponential backoff for API reliability

**Note:** The ArcGIS API has pagination limits (`resultRecordCount: 2000`). If the full QCT list exceeds 2,000 tracts, the script will need to be updated to paginate through results using `resultOffset`.

## Deploying to Vercel

### Option 1: CLI

```bash
npm install -g vercel
vercel --prod
```

### Option 2: GitHub Integration

1. Push this repository to GitHub (already done)
2. Visit [vercel.com/new](https://vercel.com/new)
3. Import the `lihtc-basis-boost` repository
4. Vercel auto-detects Next.js and builds automatically
5. Every push to `main` triggers a new production deployment

## API Reference

### `POST /api/geocode`

Geocodes a US address and extracts census geography.

**Request body:**
```json
{
  "street": "1600 Pennsylvania Ave NW",
  "city": "Washington",
  "state": "DC",
  "zip": "20500"
}
```

**Response (matched):**
```json
{
  "matched": true,
  "tract": "980000",
  "countyFips": "001",
  "stateFips": "11",
  "fullGeoId": "11001980000",
  "county": "District of Columbia",
  "state": "DC"
}
```

**Response (not matched):**
```json
{
  "matched": false,
  "tract": "",
  "countyFips": "",
  "stateFips": "",
  "fullGeoId": "",
  "county": "",
  "state": ""
}
```

### `POST /api/eligibility`

Checks QCT and DDA eligibility for a given geography.

**Request body:**
```json
{
  "tract": "001100",
  "countyFips": "073",
  "stateFips": "06",
  "fullGeoId": "06073001100"
}
```

**Response:**
```json
{
  "isQCT": true,
  "isDDA": false,
  "eligible": true,
  "reason": "Located in a Qualified Census Tract"
}
```

## Known Limitations

### Metro DDA Check Not Implemented

Metro DDAs are designated at the **ZIP Code Tabulation Area (ZCTA)** level, not census tract level. The Census Geocoder API returns the census tract for a given address but does not reliably return the ZCTA. Implementing metro DDA eligibility would require one of:

1. Adding a ZCTA lookup service (e.g., the Census `https://geo.fcc.gov/api/census/block-find` API or a geocoding provider like Geocode.io that returns ZCTA)
2. Maintaining a local ZCTA-to-county crosswalk and using the ZIP code from the address input
3. Using a point-in-polygon test against the ZCTA GeoJSON with the geocoded coordinates

Currently, the tool **only checks county-level DDA eligibility** (non-metro DDAs). However, the QCT check covers the vast majority of basis boost cases, as most boost-eligible properties are in QCTs rather than DDAs.

### QCT Boundary Year Mismatch Risk

The QCT data loaded into the tool reflects a specific year's designation (currently 2025, based on 2020 Census boundaries). The Census Geocoder API uses `Current_Current` vintage, which also uses 2020 boundaries. However, HUD updates QCT designations annually based on American Community Survey income data — a tract's boundaries may remain the same year-over-year while its QCT eligibility status changes. Users should periodically regenerate the QCT data using `npm run build:data`.

### Rate Limiting

The Census Geocoder is a free public API with no documented rate limits or SLA. In practice, it handles moderate traffic well but may throttle or return errors under sustained high volume. For production use-cases with significant user traffic, consider:

- Implementing server-side request caching (already partially handled via Next.js `revalidate: 86400` ISR caching)
- Adding request queuing or backoff logic
- Using a commercial geocoding provider (Mapbox, Google, Geocode.io) as a fallback

### Sample Data Scope

The shipped `data/` files contain ~60 QCT tracts and ~45 DDA counties for demonstration purposes. Many real addresses will show "Not eligible" simply because their tract isn't in the sample data. Run `npm run build:data` and update `data/dda-counties.json` with the complete DDA county list from HUD for production accuracy.

## License

MIT
