# Bejir AI Assistant API

## Endpoint

`POST /api/v1/assistant/chat`

The endpoint sends chat messages to Gemini Flash-Lite and adds a bounded context
retrieved from Bejir's database. The Gemini key is read by the API server and is
never sent to the browser.

### Request

```json
{
  "messages": [
    { "role": "user", "content": "Kecamatan mana yang memiliki kerawanan banjir tinggi?" }
  ],
  "sources": ["flood_susceptibility", "population_exposure"]
}
```

For follow-up questions, send previous messages in order; use `role: "model"`
for assistant replies.
The API accepts at most 12 messages; each message is limited to 2,000 characters.
The last message must be from the user. Up to five sources are accepted. Available `sources` are:

- `flood_history`: record count and a few latest flood event records.
- `flood_susceptibility`: highest hazard records and records whose district name
  matches terms in the user's question. Includes rainfall and terrain attributes
  where available.
- `population_exposure`: highest exposure records and matching districts.
- `evacuation_sites`: matching site names and categories. These records do not
  prove that a site is connected to the road network; use the evacuation route
  API for route validation.

- `rivers`: segment count and up to eight largest name/type groups from `core.rivers`.
  Names of districts/regencies in the latest question scope segments using PostGIS
  `ST_Intersects`; boundaries are transformed from EPSG:4326 to the river source
  CRS EPSG:3857. `EXISTS` counts a cross-boundary segment only once. No geometries
  or length estimates are sent to the model. Counts represent records/segments,
  not unique named rivers; null names remain unknown. The groups are a sample,
  not a complete list. Without a recognized location, coverage is explicitly
  `entire_dataset`; it must not be presented as a result for an unknown location.
  This source has no discharge, water-level, or live overflow information.

### Response

```json
{
  "answer": "Data kerawanan Bejir menunjukkan ...",
  "sources": ["flood_susceptibility", "population_exposure"],
  "model": "gemini-3.1-flash-lite"
}
```

## Configuration

Create a Gemini API key in Google AI Studio and set it as `GEMINI_API_KEY` in the
environment used to start the API. Set `GEMINI_MODEL` to override the default
model. For browser requests, set `CORS_ORIGINS` to a comma-separated list of the
web app's exact origins. For local development, the default is
`http://localhost:3000`. The web app uses `NEXT_PUBLIC_API_URL` (default
`http://localhost:8000`) to locate the API.

Example root `.env` entries:

```dotenv
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
CORS_ORIGINS=http://localhost:3000
```

Do not commit the real key. Restart/recreate the API container after changing
environment variables.

## Assumptions and limitations

- The assistant answers only with facts provided from selected Bejir sources. It
  should say when a selected source does not contain the requested information.
- Existing hazard and exposure records are analysis outputs, not live forecasts.
- The API does not currently retrieve live rainfall, flood depth, road closures,
  official warnings, or live traffic.
- Evacuation site records are not all guaranteed to be routable.
- Chat history is held in the browser state and sent with each request; it is not
  persisted by this endpoint.
- The endpoint has input size limits but no per-user rate limiter or authentication
  yet. Set provider quotas and restrict access at the deployment layer before
  opening it broadly to the internet.
- Gemini API quotas and terms apply. Free-tier availability and limits are
  controlled by Google and can change. Free-tier prompts may be used to improve
  Google's products; do not send sensitive personal information.
- Google AI Plus benefits apply to Google products and do not provide Gemini API
  credits or replace a Gemini API key/project.

## Errors

- `422`: invalid message, role, or source selection.
- `503`: Gemini is not configured, selected database data is unavailable, or
  Gemini is unreachable / quota-limited.

## Map layer selection

The map workspace passes its active layer IDs as defaults to `BejirAssistant`.
Until the user edits AI sources, they follow the map layers, including an empty
selection. After the first edit, AI sources are independent and remain selected
when switching Overview/AI tabs; they never change the map layers. With zero sources,
sending a question is disabled. The river layer maps to the `rivers` source. Layers sharing a backend dataset
are deduplicated by `assistantSources` before the request is sent.

## Deploying the river source

Deploy/restart the updated API before the updated web app: the previous API
rejects `rivers` with HTTP 422. The existing `core.rivers` table and a GiST index
on its `geom` column are required for regional spatial filtering at dataset scale.
No schema migration is introduced; this reads the same table as `GET /api/v1/rivers`.
Validate the spatial query plan on the deployment database before production use.
The web OpenAPI snapshot/types include this local extension; they do not imply
that the public API has already been upgraded.
