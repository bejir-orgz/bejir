-- Backfill the routing staging id mapping.
--
-- The routing SQL now reports the original core.road_segments.id through
-- routing.road_segments_staging.old_id. Staging built before the noding
-- change has no old_id column; there the staging id was copied directly from
-- core.road_segments.id, so old_id = id is the correct mapping.
--
-- The full import (gis/scripts/import_roads.py) recreates staging with old_id
-- already populated, so this migration is a no-op after a fresh ingest.

DO $$
BEGIN
    IF to_regclass('routing.road_segments_staging') IS NOT NULL THEN
        ALTER TABLE routing.road_segments_staging
            ADD COLUMN IF NOT EXISTS old_id integer;

        UPDATE routing.road_segments_staging
        SET old_id = id
        WHERE old_id IS NULL;
    END IF;
END $$;
