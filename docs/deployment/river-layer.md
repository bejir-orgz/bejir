# River layer preparation

Run from `apps/web` after `npm run prepare:data`:

```powershell
npm run prepare:rivers
```

The source is the configured `BEJIR_API_URL` (default public Bejir API).
Preparation retrieves original district boundaries and `/api/v1/rivers` pages
of 1,000 records, with four network requests at a time. It validates district
coverage against the catalog, river IDs, source coordinates and valid geometry,
then checks total coverage again before atomically publishing `rivers.json`.
The artifact records source origin and UTC preparation time, not dataset period.
No source files are modified and generated data stays outside Git.

The database source model uses EPSG:3857. The river API transforms geometries to
EPSG:4326. Offline intersection uses the original, unsimplified 2D source lines
and original district polygons, including holes and boundary touches. Spatial
indices accelerate point-in-polygon and segment intersection. Z values are not
used in the 2D counts. Each API ID is a segment record. Regional unions count an
ID once even when it intersects multiple selected districts. Individual county
counts can therefore sum to more than the province count. Records outside all
district polygons remain in the unfiltered source total, and are logged.

Only display lines are transformed to EPSG:3857, generalized with a 50 projected
metre tolerance, and transformed back to EPSG:4326. Six decimal coordinates are
used when valid; very short segments retain full precision to prevent collapse.
Generalized lines never determine statistics or length. Source `shape_length`
is not interpreted because its measurement units have not been documented.

The browser fetches `/api/rivers/layers` only while its checkbox is enabled.
Requests follow map bounds and region choices. At most 4,000 segments are drawn
with Leaflet canvas; when there are more candidates, larger extents are drawn
first and the UI explicitly asks users to zoom in. This cap affects display only.
`/api/rivers/summary` and Overview count all matching records. Village-level
intersection is not prepared and is reported unavailable. A failed river source
cannot blank successful Flood or district parameter data. The server keeps a
source-keyed 60-second in-memory cache of the published artifact.

The live API supports bbox and regency/district filters for viewport queries,
but it does not serve vector tiles. The prepared artifact remains the map display
path. No page-open request enumerates all 114 pages or downloads raw lines; for
future data growth, add vector tiles rather than moving source enumeration into
the browser.

Publish `data/processed/web/rivers.json` with the web app or use the configured
`BEJIR_PREPARED_DATA_DIR` mount. Next.js tracing includes the artifact and excludes
`rivers-preparation/` checkpoints. Refresh it after source imports. The full task
starts fresh; an interrupted task can use `npm run prepare:rivers -- --resume`
only when river imports have not changed. Resume additionally checks the API
origin, record count and original district geometry fingerprint. The API does
not supply a transactional snapshot/version, so avoid preparing during imports.

The chat API does not accept river retrieval as a source. Rendering a river layer
does not enable unsupported AI grounding.
