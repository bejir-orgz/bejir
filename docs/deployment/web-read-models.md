# WebGIS live data and display artifacts

Administrative metadata is loaded from `/api/v1/geography/catalog` and facility
counts from `/api/v1/flood/impacts`. Both are deployed on the configured public API.
The web does not fall back to saved catalog or facility snapshots. Failed API
requests produce unavailable/error states instead of dummy or historical backup data.

## Required display artifacts

Two generated files remain active inputs for map performance, not backups:

| File | Purpose | Refresh |
| --- | --- | --- |
| boundaries.json | Validated, simplified administrative outlines for map selection and thematic layers | After administrative geometry changes |
| rivers.json | River display geometry, bounding boxes and exact district intersections | After river/geography imports |

Do not delete these active inputs without replacing their map-serving path.
The web never downloads all raw polygons or 100K+ river geometries into the browser.
River requests filter the prepared data by viewport and region and bound feature counts.

From `apps/web`, using Node.js 24 and the configured API origin:

```powershell
npm run prepare:data
npm run prepare:rivers
```

`prepare:data` now prepares boundaries only. `prepare:rivers` gets its catalog
from the live metadata endpoint; it no longer needs a saved catalog file.
Both scripts validate source data and publish output atomically. Each artifact
records API origin and `prepared_at`; preparation time is not the observation period.
`rivers-preparation/` contains resumable build intermediates, not runtime data.
It may be removed after `rivers.json` has been validated and published.

For deployment, place the two files in `data/processed/web` or configure the
server-only `BEJIR_PREPARED_DATA_DIR`. Next.js tracing includes only these active
artifacts and excludes river build checkpoints. The directory remains ignored by Git.
Never commit large raw datasets or `.env` files.

Missing artifacts cause an explicit map-layer error. They are never replaced
with empty or dummy geometry. The API host must be reachable from the web server.

## Monthly rainfall

The web loads `/api/v1/spatial-analysis/district-rainfall-monthly` once per cached
page data refresh and aggregates available observations using each record's
`n_piksel`. District selections preserve the matching observations. Unknown
rainfall values remain unavailable; zero is a valid observation.
Current live rows have `year: null`. They support month selection and a 12-month
chart, while the year selector remains unavailable. No current year is invented.
Without a month/year selection the table retains the spatial rainfall parameter;
a selected month uses the monthly observations. A known selected year summarizes
its monthly observations, not an annual total. Classification thresholds remain
unavailable because the API does not provide an approved classification.
