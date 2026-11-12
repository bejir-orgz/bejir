# Web API integration

The web app uses the live OpenAPI contract retrieved on 12 November 2026 from http://80.43.0.180:8000/openapi.json. The snapshot is stored in `apps/web/lib/api/openapi.json`, and its ten component schemas have matching TypeScript definitions in `schemas.ts`.

Copy `apps/web/.env.example` to `apps/web/.env.local` and set the server-side `BEJIR_API_URL` to change the backend origin. The default is the documented server. Deployments require that origin to run the API version described by the snapshot.

## Endpoint coverage

All 26 documented operations are available through the same-origin web gateway. Append the backend path to `/api/backend`. For example, `/api/backend/api/v1/flood/statistics` forwards to `/api/v1/flood/statistics`. The API root is available at `/api/backend`.

| Group | Operations | Coverage |
| --- | --- | --- |
| Default | 1 GET | API root |
| Geography | 7 GET | Provinces, regencies, districts, villages and their documented detail endpoints |
| Flood | 6 GET | Event types, event list and detail, impacts and statistics |
| Spatial Analysis | 6 GET | Hazard and exposure lists, record detail and district detail |
| Evacuation | 4 GET, 1 POST | Sites, nearby sites, site detail, roads and routes |
| Assistant | 1 POST | Chat |

Only paths and methods from the snapshot are forwarded. Requests preserve query filters and backend response statuses. JSON request bodies and typed responses are checked against their documented schemas. Backend 5xx details are replaced with a generic message. Most GET success responses currently have an empty OpenAPI schema, so their response structure is checked by the consuming feature where needed.

## Existing UI entry points

- The Daerah panel loads administrative children on expansion. Selecting a region also outlines its boundary. Outlines provide administrative context and have no filled selection area.
- Titik Evakuasi loads the complete paginated site dataset, validates coordinates and IDs, and renders a Leaflet canvas layer. Its tooltips use plain text. Site `district_id` may be null according to the current contract.
- Clicking the map while Titik Evakuasi is enabled submits `RouteRequest` with that origin and `limit=1`. The returned driving route is drawn and fitted into the map. A new click cancels the earlier request. Turning the layer off removes the route. The backend stores route requests.
- The map overview filters Flood statistics by complete regency selections and selected dates. District or village selections have no equivalent Flood filter, and their historical metrics display as unavailable. Selecting one district displays its source elevation and land cover. Spatial rain parameters keep their unspecified period.
- Histori Banjir uses annual events and impact records. Its summary and table filters remain independent.
- Analisis retains regency rows. Population estimates and raster coverage areas are summed from districts. Its summary, frequency chart and annual chart use Flood statistics for the selected year and regencies. Monthly averages divide the annual total by twelve. The spatial table has no assigned year.
- The existing Aji composer sends live messages and selected sources. The source choices retain their layout. Curah Hujan, DEM and Tutupan Lahan retrieve spatial susceptibility context. Kerawanan Banjir also retrieves population exposure. Area Banjir retrieves flood history, and Titik Evakuasi retrieves evacuation sites. River and building sources are disabled because the API has no matching data source.

Chat requests include verified dataset totals retrieved from the selected data endpoints. This prevents a retrieval sample count from being the only available total. This application context uses alternating user/model messages and preserves the latest user question. Up to nine recent conversation messages are retained alongside that context to meet the twelve-message backend limit. Provider failures are shown in the conversation.

## Data gaps

The contract has no monthly rainfall series, river geometries, building dataset, flood extent geometries, operational shelter verification, or facility exposure endpoint. The Curah Hujan dashboard remains a labeled demonstration. Flood events have no district/village references, severity or affected area. Regency hazard classification and elevation aggregation await research decisions. The class-code labels and spatial dataset period remain unconfirmed.

The overview and analysis impact totals represent accumulated event records and can include the same person in multiple events. Spatial population exposure and inundation scenarios describe calculated outputs. Annual historical totals may contain incomplete current-year coverage.

Evacuation sites currently remain independent of region and timeline filters. Road and nearby-site endpoints are available through the gateway. The existing map route flow uses the route endpoint's reachable-destination search. The live routing contract supplies driving routes and provides no conclusion about flood safety.

## Verification

The automated gateway test covers every documented operation and all ten schemas, including invalid requests and sanitized failures. Feature tests cover pagination, null values, regional aggregation, date scope and chat context. Live verification uses read-only requests for GET operations. Route and chat POST tests create real requests on the configured backend.
