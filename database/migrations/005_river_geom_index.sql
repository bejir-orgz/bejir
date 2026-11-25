-- Spatial index for viewport queries on /api/v1/rivers.
--
-- core.rivers holds 114,304 segments in EPSG:3857. Without a GIST index
-- every bbox request scans the whole layer, which is what made the river
-- layer unusable for live map movement.

CREATE INDEX IF NOT EXISTS ix_rivers_geom
    ON core.rivers USING GIST (geom);
