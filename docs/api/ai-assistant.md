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
The last message must be from the user. Available `sources` are:

- `flood_history`: record count and a few latest flood event records.
- `flood_susceptibility`: highest hazard records and records whose district name
  matches terms in the user's question. Includes rainfall and terrain attributes
  where available.
- `population_exposure`: highest exposure records and matching districts.
- `evacuation_sites`: matching site names and categories. These records do not
  prove that a site is connected to the road network; use the evacuation route
  API for route validation.

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
