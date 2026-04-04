# CLAUDE.md

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run build:data` - Regenerate QCT tract data from HUD ArcGIS API
- `npx tsc --noEmit` - Type check only

## Key Architecture

- **Stateless**: No database, all data in `/data/` JSON files
- **Geocoding**: US Census Geocoder API (free, no key)
- **QCT**: Tract FIPS lookup in `data/qct-tracts.json`
- **DDA**: County FIPS lookup in `data/dda-counties.json`
- **Financial calc**: Client-side, side-by-side comparison (with/without 30% boost)
- **Tailwind**: v4 with `@import "tailwindcss"` in globals.css
