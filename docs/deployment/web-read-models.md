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

The web loads `/api/v1/spatial-analysis/district-rainfall-monthly?regency_id=...`
per regency, with at most six requests running concurrently. Each source response
is cached for five minutes. The combined page result is not wrapped in
unstable_cache: its roughly 12.8 MB serialized payload exceeds Next's 2 MB entry
limit. Live verification found a largest regional response of 659,702 bytes and
preserved all 82,764 records. Regional request failures are reported separately;
other regions and spatial parameter data remain usable.
As verified on 19 November 2026, it supplies 2015-2024 plus undated observations,
and official class numbers/labels. The latest available year is the default.
Undated rows are kept separate and never assigned a fabricated year.
Rainfall summaries use n_piksel-weighted observations; an all-month value is a
mean of observations, not an annual total. Selected regions and months also
scope classification: use the approved pixel-weighted mode of source classes.
Ties and incomplete class/weight metadata stay unavailable. No threshold
ranges are inferred. The former regency-classification request is no longer
required by the page. The gateway retains the full documented API contract.
