# Evacuation routing

## Endpoint

`POST /api/v1/evacuation/routes`

The endpoint snaps the origin to the projected road network in EPSG:32748 and routes on a request-local augmented graph. Connected evacuation sites are read from `routing.evacuation_site_edges`; entries not marked `is_connected = TRUE` are excluded. The response contains up to `limit` reachable destinations ranked by network travel time.

`origin_longitude` and `origin_latitude` are required. `evacuation_site_id` is optional: omit it to receive up to `limit` reachable destinations; provide it to route only to that connected site. `travel_mode` defaults to `driving`, and `limit` defaults to 3 (maximum 10).

### Request

```json
{
  "origin_longitude": 107.6098,
  "origin_latitude": -6.9147,
  "travel_mode": "driving",
  "limit": 3
}
```

To route only to one connected site, provide `evacuation_site_id`:

```json
{
  "origin_longitude": 107.6098,
  "origin_latitude": -6.9147,
  "evacuation_site_id": 123,
  "travel_mode": "driving"
}
```

`limit` is bounded from 1 to 10 (default 3). `travel_mode` currently supports `driving` only and uses each staging edge's `speed_kmh` through its precomputed minute `cost`. Estimated times do not account for live traffic, closures, flood depth, or real-time road conditions.

The origin snapping tolerance is configured with `ROUTING_ORIGIN_SNAP_TOLERANCE_M` (default 500 m). Candidate destinations are prefiltered to at most `ROUTING_MAX_CANDIDATE_SITES` (default 500) using straight-line distance from origin to snapped site point; final ranking is always by network travel time. Increase the candidate limit where broader network searches are required.

### Database prerequisite

The database server must have pgRouting 3.8 available. The development Compose service uses `pgrouting/pgrouting:17-3.5-3.8`, matching PostgreSQL 17 and PostGIS 3.5. In an existing database, install the extension once (as a database owner) after the server image includes pgRouting:

```sql
CREATE EXTENSION IF NOT EXISTS pgrouting;
SELECT pgr_version();
```

This enables the extension in the existing database; it does not recreate tables, data, or road topology. Production deployments must provide a pgRouting-enabled database and enable the extension in the target database.

### Response

```json
{
  "route_request_id": "4df8220c-4aa3-48fd-9d67-3f6c4c31e20e",
  "origin_longitude": 107.6098,
  "origin_latitude": -6.9147,
  "travel_mode": "driving",
  "reachable_destinations": 1,
  "routes": [
    {
      "evacuation_site": {
        "id": 123,
        "name": "Example evacuation site",
        "category": "shelter",
        "district_id": 12,
        "longitude": 107.62,
        "latitude": -6.91
      },
      "distance_m": 1840.5,
      "duration_minutes": 6.2,
      "rank": 1,
      "geometry": {"type": "LineString", "coordinates": [[107.61, -6.91], [107.62, -6.91]]},
      "segment_count": 4,
      "segments": [
        {
          "sequence": 1,
          "road_segment_id": 456,
          "name": "Example Road",
          "distance_m": 420.0,
          "geometry": {"type": "LineString", "coordinates": [[107.61, -6.91], [107.62, -6.91]]}
        }
      ]
    }
  ]
}
```

Route geometry coordinates are GeoJSON EPSG:4326. Route requests, destination ranks, and traversed original road segment IDs are stored using the existing `core.route_requests`, `core.route_destinations`, and `core.route_segments` models/tables.

### Errors

- `404`: requested site does not exist/is not connected, or no reachable destination exists.
- `400`: origin coordinates are outside the EPSG:4326 longitude/latitude ranges, or the origin is farther than the configured snap tolerance.
- `503`: pgRouting/database routing is unavailable.
- `422`: request fields fail Pydantic validation.
- `500`: unexpected routing failure (response does not expose database details).

The current staging graph uses stored road speeds for driving. It does not calculate walking routes or apply flood avoidance.
