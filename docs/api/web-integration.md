# Web API integration

The web app uses the live OpenAPI contract retrieved on 12 November 2026, extended with the live rivers operation on 15 November and flood impacts operation on 17 November 2026 from http://80.43.0.180:8000/openapi.json, plus additive repository contracts for lightweight administrative metadata and legacy facility aggregates. The extended snapshot is stored in `apps/web/lib/api/openapi.json`, with matching TypeScript definitions. Facility cards now use the deployed `/api/v1/flood/impacts` endpoint. Older deployments are supported through explicitly dated prepared data, not request-time detail enumeration.

Copy `apps/web/.env.example` to `apps/web/.env.local` and set the server-side `BEJIR_API_URL` to change the backend origin. The default is the documented server. Deployments require that origin to run the API version described by the snapshot.

## Endpoint coverage

The 27 live operations and two additive repository operations are available through the same-origin web gateway. The older live deployment can return 404 for the two extensions until deployed. Append the backend path to `/api/backend`. For example, `/api/backend/api/v1/flood/statistics` forwards to `/api/v1/flood/statistics`. The API root is available at `/api/backend`.

| Group | Operations | Coverage |
| --- | --- | --- |
| Default | 1 GET | API root |
| Geography | 8 GET | Provinces, regencies, districts, villages and their documented detail endpoints |
| Flood | 7 GET | Event types, event list and detail, impacts and statistics |
| Spatial Analysis | 6 GET | Hazard and exposure lists, record detail and district detail |
| Evacuation | 4 GET, 1 POST | Sites, nearby sites, site detail, roads and routes |
| Assistant | 1 POST | Chat |
| Rivers | 1 GET | Filtered paginated source records; prepared viewport layer and regional segment summaries |

Only paths and methods from the snapshot are forwarded. Requests preserve query filters and backend response statuses. JSON request bodies and typed responses are checked against their documented schemas. Backend 5xx details are replaced with a generic message. Most GET success responses currently have an empty OpenAPI schema, so their response structure is checked by the consuming feature where needed.

## Existing UI entry points

- The Daerah panel loads administrative children on expansion from one shared lightweight catalog. Village metadata requests use include_geometry=false. Regency and district outlines use prepared boundaries. Outlines provide administrative context and have no filled selection area.
- Titik Evakuasi loads the complete paginated site dataset, validates coordinates and IDs, and renders a Leaflet canvas layer. Its tooltips use plain text. Site `district_id` may be null according to the current contract.
- Clicking the map while Titik Evakuasi is enabled submits `RouteRequest` with that origin and `limit=1`. The returned driving route is drawn and fitted into the map. A new click cancels the earlier request. Turning the layer off removes the route. The backend stores route requests.
- The map overview filters Flood statistics and historical facility damage by complete regency selections and selected dates. District or village selections have no equivalent Flood filter, and their historical metrics display as unavailable. Spatial summaries follow selected districts or complete regencies. Village-level spatial summaries remain unavailable.
- Existing rainfall, DEM, susceptibility and land-cover checkboxes render district choropleths using source mean rainfall, mean elevation, dominant class and dominant cover. Rain and elevation use continuous color ramps over the dataset range. These are district parameters with an unspecified period. The annual rainfall card remains unavailable.
- Histori Banjir uses annual events and impact records. Its summary and table filters remain independent.
- Analisis retains regency rows. Population estimates and raster coverage areas are summed from districts. Elevation uses the pixel-weighted mean. Regional susceptibility uses the pixel-weighted mode of district dominant classes, with ties unavailable. The project approved class labels 1–5 as Sangat Rendah, Rendah, Sedang, Tinggi, Sangat Tinggi. This summarizes district dominant classes and is not a pixel-level reclassification. Distribution counts districts by dominant class. Its summary, frequency chart and annual chart use Flood statistics for the selected year and regencies. Monthly averages divide the annual total by twelve. The spatial table has no assigned year.
- Facility cards in Map Interaktif and Analisis use `overall` from one `/api/v1/flood/impacts` request, mapping schools_damaged, health_facilities_damaged, religious_facilities_damaged and bridges_damaged for the chosen date/regency scope. Repeated `regency_id` parameters select multiple regencies; omitting them selects all West Java. `start_date` and `end_date` delimit the selected days inclusively. The map uses its date filter; Analisis uses the selected year, so their totals can differ. The `by_regency` breakdown is not added again to `overall`. Only HTTP 404/501 falls back to a dated prepared projection; bridges remain unavailable in that legacy projection. Other failures remain errors, and successful live responses have no snapshot timestamp. They never enumerate event details during web requests. These are cumulative historical damage records, which may include the same facility repeatedly. Missing inputs propagate as unavailable. Public facilities require government offices, parks or other publicly usable facilities. The API does not identify that subset, so this category remains unavailable.
- Curah Hujan loads 27 regency/city rows by joining Geography to district hazard parameters. The approved regional mean is weighted by n_piksel, and minimum/maximum are extrema of district means. Aggregation uses available rainfall values and displays the known/total district count (620/627 at verification). Missing rainfall values remain absent and zero remains valid. Header region choices recompute summary cards independently of table filters. The rainfall and average columns refer to the same spatial mean parameter. Temporal filters and rainfall classification remain unavailable. The monthly chart explicitly explains the missing series. Normalized page data is cached for five minutes. The demonstration fixture has been removed.
- The existing Aji composer sends live messages and selected sources. The source choices retain their layout. Curah Hujan, DEM and Tutupan Lahan retrieve spatial susceptibility context. Kerawanan Banjir also retrieves population exposure. Area Banjir retrieves flood history, and Titik Evakuasi retrieves evacuation sites. River retrieval is not an accepted source in the chat contract, so that AI source remains disabled even though the river map layer is connected.

Chat requests include verified dataset totals retrieved from the selected data endpoints. This prevents a retrieval sample count from being the only available total. This application context uses alternating user/model messages and preserves the latest user question. Up to nine recent conversation messages are retained alongside that context to meet the twelve-message backend limit. Provider failures are shown in the conversation.

## Data gaps

The contract has no monthly rainfall series, building dataset, flood extent geometries, operational shelter verification, or spatial facility exposure endpoint. Flood events have no district/village references, severity or affected area. Historical affected-area cards remain unavailable. Spatial dataset period and public-facility taxonomy remain missing.

## Display geometry and caching

Administrative geometry is validated and simplified outside web requests with `npm run prepare:data`. Source EPSG:4326 is projected to EPSG:3857 for topology-preserving display generalization at 100 projected metres, then returned to EPSG:4326. Rounding is retained only when valid. The resulting boundaries and administrative catalog are shared by region controls, map outlines, thematic layers, analysis and rainfall. Live parameter values are joined by district ID. Simplified polygons never determine area measurements or statistics. Runtime code does not import JSTS.

All pages share one cached all-district hazard endpoint. There are no 27 per-regency hazard requests. Flood statistics use one shared data-access function. Facility, spatial and historical failures are independent. Overview only starts loading while open. See [preparation and deployment](../deployment/web-read-models.md) for generated artifacts, freshness, compatibility and backend activation.

The overview and analysis impact totals represent accumulated event records and can include the same person in multiple events. Spatial population exposure and inundation scenarios describe calculated outputs. Annual historical totals may contain incomplete current-year coverage.

Evacuation sites currently remain independent of region and timeline filters. Road and nearby-site endpoints are available through the gateway. The existing map route flow uses the route endpoint's reachable-destination search. The live routing contract supplies driving routes and provides no conclusion about flood safety.

## Verification

Rainfall pages render at request time so upstream failures are not saved as prerendered empty output. Successful normalized rainfall data remains cached for five minutes. Verification covered the 27-row table, regional summary filtering, missing values, zero rainfall and weighted aggregation.

The automated gateway test covers every documented operation and all fourteen schemas, including invalid requests and sanitized failures. Feature tests cover pagination, null values, regional aggregation, date scope and chat context. Live verification uses read-only requests for GET operations. This verification did not send paid chat requests or create route requests.

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

`GET /api/v1/rivers` exposes 114,304 source records at verification. The web
registers this operation in its gateway. Run `npm run prepare:rivers` after
preparing the administrative catalog, and ship `rivers.json` with the other
prepared artifacts. See [river preparation](../deployment/river-layer.md).
The existing river checkbox loads a bounded canvas overlay for the current
viewport. Overview and Analysis use full regional segment counts, independently
of map rendering limits. These counts do not measure river length, flood impact,
or unique named watercourses.
