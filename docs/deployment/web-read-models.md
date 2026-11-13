# Fast WebGIS data loading

The web request path must not download full administrative geometry, simplify it,
or enumerate flood event details to calculate facilities. These tasks run during
data preparation, separately from users opening pages.

## Prepare data

Use Node.js 24 and the configured public API origin. From `apps/web` run

```powershell
npm run prepare:data
```

This writes three ignored, derived artifacts to `data/processed/web`.

| File | Contents | Refresh |
| --- | --- | --- |
| catalog.json | IDs, names and administrative parentage | When administrative data changes |
| boundaries.json | Validated display boundaries | When administrative geometry changes |
| facilities.json | Historical facility damage grouped by region and day | After flood-data imports, until the aggregate endpoint is deployed |

The outputs contain the API origin and UTC `prepared_at`. This timestamp describes
preparation, not the period of the spatial dataset. The web rejects artifacts
from a different API origin. Preparation validates unique administrative IDs,
parentage, geometry validity and complete flood event coverage before publishing.
Files are replaced atomically. Raw polygons and event details are not published.
Facility preparation has bounded retries and an unpublished checkpoint. Resume an interrupted run with `facilities --resume` only when source imports have not changed. A normal refresh starts fresh. When the live aggregate endpoint is available, facility preparation skips detail enumeration.

The old API sorts flood events by date without an ID tie-breaker. Preparation
partitions date ranges until each result fits one page, checks all unique
event IDs against API totals (2,245 at verification), and refuses incomplete or changing coverage. The
updated backend sorts by date and ID. The web also rejects overlapping pages.

For individual refreshes use

```powershell
node --env-file-if-exists=.env.local scripts/prepare-web-data.mjs geography
node --env-file-if-exists=.env.local scripts/prepare-web-data.mjs facilities
```

## Deploy

1. Prepare the artifacts before packaging the web app. Next.js file tracing
   includes the three artifacts from the monorepo. They remain out of Git.
2. Preserve `data/processed/web` in the deployed filesystem, or mount it and set
   server-only `BEJIR_PREPARED_DATA_DIR` to its absolute location. Both preparation
   and the web app must use the same configured API origin and directory.
3. Deploy/restart the FastAPI backend to activate the additive endpoints below.
   No database migration is required.
4. Verify the new endpoints on the deployed origin and reload the web pages.

| Contract | Purpose |
| --- | --- |
| GET /api/v1/geography/catalog | Two small metadata queries, without geometry |
| GET /api/v1/geography/{regencies,districts,villages}?include_geometry=false | Skip geometry selection and serialization, retaining existing defaults for other clients |
| GET /api/v1/flood/facilities | One filtered SQL aggregate. Repeated regency_id values form a union and are deduplicated |

The web uses the prepared catalog when present, otherwise the lightweight catalog
endpoint. All pages share the same all-district hazard list and metadata join.
There are no 27 per-regency hazard requests. Selected administrative outlines use
the same prepared boundaries. Village outlines remain targeted detail requests.

If the old backend returns 404/501 for facility totals, the web reads the dated
facility projection and labels its preparation date. Other backend failures are
reported as failures, not silently replaced by old counts. An absent projection
does not trigger event fan-out. Successful aggregate responses use a five-minute
cache. The fallback projection changes only when preparation is rerun.

Historical damage is cumulative and can include the same facility repeatedly.
Unknown counts remain null, zero remains zero, and public facilities remain
unavailable until the source identifies public use/ownership. Coverage area,
population estimates and district hazard classes retain their separate meanings.

## Failure isolation

Flood statistics, prior-year comparison, historical charts, spatial distribution,
population and facility counts have independent failure states. A facility failure
cannot blank successful charts. Overview requests start only while its panel is
open. Analysis and rainfall render at request time so a failed build-time fetch
cannot become the published page. Safe source-specific errors are logged on the
server, without exposing backend exception details in the UI.

## Checks

```powershell
$env:PYTHONPATH = 'apps/api'
$env:DATABASE_URL = 'sqlite://'
python -m pytest apps/api/tests -q
```

The backend tests require pytest and the project's Python dependencies. They use
temporary SQLite tables to execute aggregate and metadata queries. They do not
connect to the production database or validate PostGIS query plans.

Run web tests, lint, TypeScript checks and `npm run build` from `apps/web`.
Do not treat a fast cache hit as a cold-load measurement. Record metadata latency,
unprimed analysis loads, boundary reads and facility endpoint request counts.
