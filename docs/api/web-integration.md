# Web API integration

The web uses the live OpenAPI contract checked on 18 November 2026 from http://80.43.0.180:8000/openapi.json: 31 operations and 18 schemas. Administrative metadata and impact totals use the live API without saved-catalog or facility fallback. The snapshot is stored in `apps/web/lib/api/openapi.json`.

Copy `apps/web/.env.example` to `apps/web/.env.local` and set the server-side `BEJIR_API_URL` to change the backend origin. The default is the documented server. Deployments require that origin to run the API version described by the snapshot.

## Endpoint coverage

All 31 documented live operations are available through the same-origin web gateway. Browser requests append the backend path to `/backend`. For example, `/backend/api/v1/flood/statistics` forwards through the existing validated gateway to `/api/v1/flood/statistics`. The API root is available at `/backend`. Next aggregation endpoints use `/backend/web/...` (for example `/backend/web/workspace/overview`) and are internally rewritten to their existing `/api/...` route handlers. This preserves aggregation, AI grounding, validation, timeouts, and bounded geometry responses. Legacy `/api/...` handlers remain available for compatibility; application browser requests use the `/backend` prefix. Server data loaders and preparation scripts use the absolute server-only `BEJIR_API_URL`; they do not fetch the Next application itself during rendering or builds.

| Group | Operations | Coverage |
| --- | --- | --- |
| Default | 1 GET | API root |
| Geography | 8 GET | Provinces, regencies, districts, villages and their documented detail endpoints |
| Flood | 8 GET | Event types, event list and detail, impacts and statistics |
| Spatial Analysis | 7 GET | Monthly rainfall, hazard and exposure lists, record detail and district detail |
| Evacuation | 4 GET, 1 POST | Sites, nearby sites, site detail, roads and routes |
| Assistant | 1 POST | Chat |
| Rivers | 1 GET | Filtered paginated source records; prepared viewport layer and regional segment summaries |

Only paths and methods from the snapshot are forwarded. Requests preserve query filters and backend response statuses. JSON request bodies and typed responses are checked against their documented schemas. Backend 5xx details are replaced with a generic message. Most GET success responses currently have an empty OpenAPI schema, so their response structure is checked by the consuming feature where needed.

## Existing UI entry points

- The Daerah panel loads administrative children on expansion from one shared lightweight catalog. Village metadata requests use include_geometry=false. Regency and district outlines use prepared boundaries. Outlines provide administrative context and have no filled selection area.
- Sidebar searches use `/api/geography?search=...` across regency, district and village names, retaining their parent hierarchy even before expansion. The server caches the full name/ID tree for one hour, using paged village metadata without geometry; only matching branches are sent to the browser. Input is debounced by 250 ms and obsolete requests are cancelled. The first uncached search waits for metadata; failures display a search error rather than an empty result.
- Titik Evakuasi loads the complete paginated site dataset, validates coordinates and IDs, and renders a Leaflet canvas layer. Its tooltips use plain text. Site `district_id` may be null according to the current contract.
- Clicking the map while Titik Evakuasi is enabled submits `RouteRequest` with that origin and `limit=1`. The returned driving route is drawn and fitted into the map. A new click cancels the earlier request. Turning the layer off removes the route. The backend stores route requests.
- The map overview filters Flood statistics and historical facility damage by complete regency selections and selected dates. District or village selections have no equivalent Flood filter, and their historical metrics display as unavailable. Spatial summaries follow selected districts or complete regencies. Village-level spatial summaries remain unavailable.
- Existing rainfall, DEM, susceptibility and land-cover checkboxes render district choropleths using source mean rainfall, mean elevation, dominant class and dominant cover. Rain and elevation use continuous color ramps over the dataset range. These are district parameters with an unspecified period. The annual rainfall card remains unavailable.
- Histori Banjir uses annual events and impact records. Its summary and table filters remain independent. `GET /api/v1/flood/events` returns `houses_flooded`, `fatalities`, and `missing` on each list item, so a history view can build its rows from the paginated list instead of requesting `/flood/events/{id}` once per event. Events have at most one impact record; missing impact values remain unavailable.
- Analisis retains regency rows. Population estimates and raster coverage areas are summed from districts. Elevation uses the pixel-weighted mean. Regional susceptibility uses the pixel-weighted mode of district dominant classes, with ties unavailable. The project approved class labels 1–5 as Sangat Rendah, Rendah, Sedang, Tinggi, Sangat Tinggi. This summarizes district dominant classes and is not a pixel-level reclassification. Distribution counts districts by dominant class. Its summary, frequency chart and annual chart use Flood statistics for the selected year and regencies. Monthly averages divide the annual total by twelve. The spatial table has no assigned year.
- Facility cards in Map Interaktif and Analisis use `overall` from one `/api/v1/flood/impacts` request, mapping schools_damaged, health_facilities_damaged, religious_facilities_damaged and bridges_damaged for the chosen date/regency scope. Repeated `regency_id` parameters select multiple regencies; omitting them selects all West Java. `start_date` and `end_date` delimit the selected days inclusively. The map uses its date filter; Analisis uses the selected year, so their totals can differ. The `by_regency` breakdown is not added again to `overall`. No saved facility fallback remains; failed requests remain errors, and live responses have no snapshot timestamp. They never enumerate event details during web requests. These are cumulative historical damage records, which may include the same facility repeatedly. Missing inputs propagate as unavailable. Public facilities require government offices, parks or other publicly usable facilities. The API does not identify that subset, so this category remains unavailable.
- Curah Hujan retains 27 regency/city rows. The new district-rainfall-monthly endpoint supplies the chart and month filter, using n_piksel weights. District selections retain only matching monthly observations. Missing values stay unavailable; zero remains valid. As of 19 November 2026, monthly observations include years 2015-2024 and undated rows. The year selector defaults to the latest dated year (2024); null-year observations never enter dated summaries. Without a month/year selection the table retains the unperioded spatial rainfall parameter. A month selection uses that month's observations; a known selected year summarizes its monthly observations rather than an annual total. Minimum/maximum are extrema of selected district observations. Annual threshold labels follow the backend-engineer specification documented below. Regional monthly responses refresh every five minutes; the combined page object is not cached.
- The existing Aji composer sends live messages and selected sources. The source choices retain their layout. Curah Hujan, DEM and Tutupan Lahan retrieve spatial susceptibility context. Kerawanan Banjir also retrieves population exposure. Area Banjir retrieves flood history, and Titik Evakuasi retrieves evacuation sites. River retrieval is not an accepted source in the chat contract, so that AI source remains disabled even though the river map layer is connected.

Chat requests include verified dataset totals retrieved from the selected data endpoints. This prevents a retrieval sample count from being the only available total. This application context uses alternating user/model messages and preserves the latest user question. Up to nine recent conversation messages are retained alongside that context to meet the twelve-message backend limit. Provider failures are shown in the conversation.

## Data gaps

The contract has no dated annual rainfall series, building dataset, flood extent geometries, operational shelter verification, or spatial facility exposure endpoint. Flood events have no district/village references, severity or affected area. Historical affected-area cards have been replaced with flooded-house counts. Spatial dataset period and public-facility taxonomy remain missing.

## Display geometry and caching

Administrative geometry is validated and simplified outside web requests with `npm run prepare:data`. Source EPSG:4326 is projected to EPSG:3857 for topology-preserving display generalization at 100 projected metres, then returned to EPSG:4326. Rounding is retained only when valid. The resulting boundaries are shared by region controls, map outlines, thematic layers, analysis and rainfall. Live parameter values are joined by district ID. Simplified polygons never determine area measurements or statistics. Runtime code does not import JSTS.

All pages share one cached all-district hazard endpoint. There are no 27 per-regency hazard requests. Flood statistics use one shared data-access function. Facility, spatial and historical failures are independent. Overview only starts loading while open. See [preparation and deployment](../deployment/web-read-models.md) for generated artifacts, freshness, compatibility and backend activation.

The overview and analysis impact totals represent accumulated event records and can include the same person in multiple events. Spatial population exposure and inundation scenarios describe calculated outputs. Annual historical totals may contain incomplete current-year coverage.

Evacuation sites currently remain independent of region and timeline filters. Road and nearby-site endpoints are available through the gateway. The existing map route flow uses the route endpoint's reachable-destination search. The live routing contract supplies driving routes and provides no conclusion about flood safety.

## Verification

Rainfall pages render at request time so upstream failures are not saved as prerendered empty output. Monthly API responses are cached separately by regency for five minutes, with at most six concurrent requests; the combined page object exceeds the 2 MB entry limit and is deliberately not persisted in Next Data Cache. Verification covered the 27-row table, regional summary filtering, missing values, zero rainfall and weighted aggregation.

The automated gateway test covers every documented operation and all documented schemas, including invalid requests and sanitized failures. Feature tests cover pagination, null values, regional aggregation, date scope and chat context. Live verification uses read-only requests for GET operations. This verification did not send paid chat requests or create route requests.

### Shared region selection

The root region provider uses the lightweight administrative catalog to translate
map ID paths into named filter paths. The active region is shared across the map,
flood history, rainfall and analysis during client navigation in the same tab.
Header and table region filters use the same selection. Parent choices include
all descendants, with explicit child exclusions taking priority. Expanding a
branch does not change its selection.

District selections recompute rainfall and spatial table values from the selected
district parameters, retaining the existing regency/city table layout. Historical
Flood counts and facility damage do not have district locations and remain
unavailable for district/village selections. Village spatial aggregates are also
unavailable. The UI states these limits instead of borrowing parent totals.

### River layer and counts

`GET /api/v1/rivers` exposes 114,304 source records at verification. It also
serves viewport queries for the river layer: `bbox=minx,miny,maxx,maxy` in
EPSG:4326, `simplify_m` (default 100 m when `bbox` is given, `0` disables
generalization, maximum 2000) and `limit` up to 5000. The response keeps
`items`, `total`, `limit` and `offset` and adds `bbox`, `simplify_m` and
`truncated` (`true` when more segments match beyond the requested page). Rows are
filtered with `ST_Intersects` against an index-backed EPSG:3857 envelope,
simplified in EPSG:3857, and returned as EPSG:4326 GeoJSON rounded to six
decimals. Requests without `bbox` behave exactly as before, including
full-precision geometry. `regency_id` and `district_id` filter by intersection
with the real administrative boundary, not the boundary's bounding box, so
rivers outside the selected region are excluded. `district_id` is repeatable
(up to 100 values) and returns the union for the selected districts. Results are
ordered by `shape_length` descending (then `id`), so a truncated province-wide
page shows the largest rivers first instead of a contiguous id range.
`GET /api/v1/rivers/summary` returns one `{regency_id, regency_name, total}`
row per regency/city without geometry; totals use the same exact boundary
intersection and are static for a dataset, so they can be cached. Register the
new operation in the web gateway/OpenAPI snapshot before browser use. Geometry type is not stable within a simplified page:
the source `core.rivers` column is `MULTILINESTRINGZ`, but
`ST_SimplifyPreserveTopology` turns a single-part MultiLineString into a
LineString. A page with `simplify_m > 0` therefore mixes `LineString` and
`MultiLineString`; requests without generalization (no `bbox`, or
`simplify_m=0`) always return `MultiLineString`. GeoJSON positions also carry Z.
Consumers must accept both geometry types and must not drop one silently. The web
registers this operation in its gateway. Run `npm run prepare:rivers` after
preparing the administrative catalog, and ship `rivers.json` with the other
prepared artifacts. See [river preparation](../deployment/river-layer.md).
The existing river checkbox loads a bounded canvas overlay for the current
viewport. Overview and Analysis use full regional segment counts, independently
of map rendering limits. These counts do not measure river length, flood impact,
or unique named watercourses.

- The former affected-area cards in Map Interaktif, Histori Banjir and Analisis now show flooded houses from `houses_flooded`, in units. Labels use the requested “Rumah Terpendam”; this means flooded houses, not buried houses. Map and Analisis use the existing filtered statistics response, while history sums the existing event-detail rows and replaces its Area table column. No additional API requests are introduced. Missing values remain unavailable and zero remains valid; repeated flood events can count the same house again. Administrative `areaKm2` in the spatial analysis table remains the total region area, not flood extent or susceptible-class area.

- With no explicit Timeline date, Map Overview defaults historical metrics and facility impacts to 1 January–31 December of the current year in Asia/Jakarta. User date selections override this range; clearing dates restores the current-year default. Spatial parameters retain their dataset scope because the API does not support year filtering for them.

- AI answers remain Markdown strings in the API contract. The web requests Markdown formatting and renders replies with react-markdown and remark-gfm (headings, emphasis, lists, links, tables, and code). Raw HTML is skipped, default safe URL handling is retained, and Markdown images render their alt text without fetching remote images. Errors and user messages remain plain text; tables and code blocks can scroll horizontally in the sidebar.


### Monthly rainfall classification

The deployed endpoint is `GET /api/v1/spatial-analysis/district-rainfall-monthly`, with optional regency_id, district_id, year and month filters. `/regency-rainfall-monthly` returns 404. The monthly response now provides year, kelas_hujan and label_hujan. The rainfall page derives years from this response and uses the official API labels. It no longer requests `/regency-rainfall-classification`, which still returns HTTP 500; that documented operation remains accessible through the gateway. The same code returns all 27 rows locally, and the deployed endpoint fails even for a non-existent `regency_id`, which points at the table or its columns being missing on the deployed database rather than at the response payload. Confirm with `SELECT count(*) FROM core.regency_rainfall_classification;` and, if needed, apply the second table of `database/migrations/002_rainfall_classification.sql` plus the regency classification import.

Approved on 19 November 2026: regional classification is the mode of selected district/month API classes weighted by n_piksel. Ties, missing class/label/weight, or conflicting labels for the same class remain unavailable. The same calculation follows selected year, month and districts. Numeric rainfall still uses weighted means, not an annual precipitation total. Threshold metadata is absent, so legend ranges are not invented.

The current all-year source contains 82,764 rows (~10 MB). Existing cached page loading retains all years for local filters. A backend year catalog and server-side region/year summaries would reduce first-load payload as the series grows.

### Card year comparisons

Overview, Analysis, Flood History and Rainfall card captions use `(current - previous) / previous * 100`, formatted as e.g. `-61% dari tahun sebelumnya`. Unavailable values or a zero previous baseline display an em dash. Comparisons retain the same region selection. Overview shifts each selected date back one year (29 February clamps to 28 February); initial historical values still cover only the current Jakarta calendar year. Prior-year requests run in parallel and do not enter current totals. Analysis reuses its existing prior-year statistics. Flood History reads prior-year `/flood/impacts` once and joins its regency house totals to existing previous event counts; failure only removes the house comparison. Rainfall compares dated observations from the same scope; undated rainfall cannot have a year comparison. No percentage is fabricated for missing dataset years.


### Browser payload and on-demand modules

Rainfall observations now stay on the Next server. `buildRainfallView` reuses the existing regional filters, pixel weighting, class mode and year comparisons, and sends only the card snapshot, twelve chart points and the displayed regional table values. The initial page defaults to the latest year. Changing either summary scope or table scope requests a new small view from `POST /api/rainfall` (form-encoded filters, 200 KB request limit); POST avoids URL-length limits for hierarchical selections and performs no data writes. Summary and table filters remain independent. Queries are debounced 200 ms and superseded browser requests are aborted. The response key prevents stale results appearing under a newer filter. Upstream rainfall responses retain the existing per-regency five-minute cache.

Measured locally on 19 November 2026, the uncompressed rainfall HTML/RSC response fell from 12,885,901 to 113,445 bytes (99.1% reduction). The default filter response is 7,763 bytes and includes no district-month observations. These measure data/HTML payloads, not total JS, fonts or map tiles, and development timings do not establish production latency. AI and Markdown modules load on the map only after the AI tab is first opened; the mounted chat remains preserved during subsequent tab switches.


### Annual rainfall legend thresholds (19 November 2026)

Source: threshold table supplied by the backend engineer through the user.
These apply to annual mean_hujan_mm (mm/year), not to individual hujan_mm monthly observations.
The source-dataset observed minimum/maximum are not the class thresholds.

| Class | Label | Annual threshold (mm/year) |
| --- | --- | --- |
| 1 | Sangat Rendah | < 2500 |
| 2 | Rendah | >= 2500 and < 3000 |
| 3 | Sedang | >= 3000 and < 3400 |
| 4 | Tinggi | >= 3400 and < 3900 |
| 5 | Sangat Tinggi | >= 3900 |

The rainfall legend now displays these ranges with mm/tahun units. Read-only validation against all 620 district records with known mean/class in the repository classification CSV found zero mismatches. Monthly-response labels are joined from the district classification table by the backend; the frontend retains those labels and the approved regional weighted mode. It does not classify the displayed monthly mean against annual thresholds. The live regency-classification endpoint still returned HTTP 500 at this check; filling the legend does not depend on that endpoint. Since threshold metadata is not exposed by the live API, future method changes require updating this documented specification and its legend values.
