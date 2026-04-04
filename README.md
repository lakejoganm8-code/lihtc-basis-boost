# LIHTC Basis Boost Impact Tool

Determine if a property qualifies for the **30% basis boost** under [IRC Section 42(d)(5)(C)](https://www.law.cornell.edu/uscode/text/26/42#d_5_C) and see the financial impact side-by-side.

## Data Sources

- **Geocoding**: [US Census Geocoder API](https://geocoding.geo.census.gov) (free, no API key)
- **QCT**: [HUD Qualified Census Tracts](https://www.huduser.gov/portal/datasets/qct.html) (converted to compact FIPS lookup)
- **DDA**: [HUD Difficult Development Areas](https://www.huduser.gov/portal/sadda/sadda_qct.html) (county-level list)

## How It Works

1. Enter a US address -> geocoded to census tract + county
2. Eligibility checked against QCT tract list and DDA county list
3. Enter financial details -> see Without Boost vs With Boost comparison

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and connect via [vercel.com/new](https://vercel.com/new).

## Regenerate Data

The shipped `data/` files contain sample data. To fetch the full QCT list:

```bash
npm run build:data
```

This queries the [HUD ArcGIS feature layer](https://services3.arcgis.com/QnAlpI4OtHhbgGN9/arcgis/rest/services/FCPR_Webmap_V_1_WFL1/FeatureServer/0) and writes all QCT tract FIPS codes to `data/qct-tracts.json`.

## Known Limitations

- **Metro DDA check** is county-level only. Metro DDAs use ZCTA boundaries, which requires ZIP-level matching not available from tract-level geocoding. QCT check covers most use cases.
- **QCT boundary year**: This tool includes sample tract FIPS from the 2025 QCT designation (2020 Census boundaries). Regenerate data for current designations.
- **Sample data only**: The shipped `data/` files contain ~60 sample tracts and ~45 sample DDA counties for demo purposes. Run `npm run build:data` for the full dataset.

## License

MIT
