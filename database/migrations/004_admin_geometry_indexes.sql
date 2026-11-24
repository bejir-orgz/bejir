-- Spatial indexes for viewport (bbox) boundary requests.
--
-- Without these, /api/v1/geography/boundaries scans the full district
-- (~29 MB) or village (~90 MB) geometry set for every map movement.

CREATE INDEX IF NOT EXISTS ix_districts_geom
    ON core.districts USING GIST (geom);

CREATE INDEX IF NOT EXISTS ix_villages_geom
    ON core.villages USING GIST (geom);

CREATE INDEX IF NOT EXISTS ix_regency_geom
    ON core.regency USING GIST (geom);
