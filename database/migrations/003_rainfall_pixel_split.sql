-- Separate total district pixels from CHIRPS rain-mask pixels.
--
-- 001 already creates n_piksel_hujan for fresh databases. This migration
-- upgrades databases created before the split:
--
--   n_piksel        total district pixels (statistik_kecamatan.csv)
--   n_piksel_hujan  pixels with a valid CHIRPS value (rain mask)
--
-- Before the split, n_piksel stored the rain-mask count, which is 0 for the
-- 7 Bekasi districts without coverage and lower than the total for partially
-- masked districts. Rainfall aggregation is weighted by n_piksel_hujan.

ALTER TABLE core.district_rainfall_monthly
    ADD COLUMN IF NOT EXISTS n_piksel_hujan integer
    CHECK (n_piksel_hujan >= 0);

-- Preserve the existing rain-mask counts before replacing n_piksel.
UPDATE core.district_rainfall_monthly
SET n_piksel_hujan = n_piksel
WHERE n_piksel_hujan IS NULL;

-- Restore n_piksel to the published district pixel total.
UPDATE core.district_rainfall_monthly AS monthly
SET n_piksel = statistics.n_piksel
FROM core.district_hazard_statistics AS statistics
WHERE statistics.district_id = monthly.district_id
  AND statistics.n_piksel IS NOT NULL;
