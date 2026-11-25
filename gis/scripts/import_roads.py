#!/usr/bin/env python3
"""Impor jaringan jalan Jawa Barat penuh ke core.road_segments dan routing.

Sumber data: core.roads (859.716 ruas OpenStreetMap Geofabrik) yang tersimpan
di dump CaiCare `data/backup/db_bejir.dump`. Tabel itu berisi geometri
MultiLineString EPSG:4326 dan belum ada di database Bejir, sehingga script ini
bisa memulihkannya lebih dulu (butuh image Docker PostgreSQL 17 karena dump
memakai format pg_dump 17).

Tahapan:

1. Pulihkan core.roads dari dump bila belum ada (--skip-restore melewati).
2. Kosongkan riwayat rute dan tabel jalan/rute evakuasi yang dibangun ulang.
3. core.road_segments <- semua ruas, MultiLineString dipecah menjadi
   LineString agar dapat dirutekan; kecepatan per kelas mengikuti keputusan
   WBS 5.6 (bukan max_speed OSM yang 99,3% bernilai 0).
4. routing.road_segments_staging <- hanya kelas yang dapat dirutekan,
   diproyeksikan ke EPSG:32748, cost dalam MENIT, reverse_cost -1 untuk
   satu arah. Geometri dipecah (noding) pada vertex yang dipakai bersama
   beberapa ruas agar persimpangan benar-benar tersambung; kolom old_id
   menyimpan id asli di core.road_segments.
5. pgr_createTopology membangun source/target + tabel simpul.
6. routing.evacuation_site_edges dibangun ulang dengan snap 100 m.

Data core.roads berasal dari geometri OSM yang belum dipecah di
persimpangan, jadi pgr_createTopology saja hanya menyambung ujung garis dan
jaringan pecah menjadi ratusan ribu komponen. Noding dilakukan dengan
memecah setiap ruas pada titik yang menjadi vertex bersama ruas lain (bukan
pada persilangan tanpa vertex bersama, mis. jembatan/overpass).

Contoh:

  apps/api/.venv/bin/python gis/scripts/import_roads.py \
      --dsn postgresql://bejir:bejir123@localhost:5433/bejir

Peringatan: langkah 2 mengosongkan riwayat rute (route_requests,
route_destinations, route_segments) karena id ruas berubah.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time

DEFAULT_DUMP = os.environ.get(
    "BEJIR_ROADS_DUMP",
    os.path.expanduser(
        "~/Documents/Kuliah/Semester_5/sig/CaiCare/data/backup/db_bejir.dump"
    ),
)
DEFAULT_IMAGE = "pgrouting/pgrouting:17-3.5-3.8"

NON_ROUTABLE_CLASSES = (
    "footway", "path", "cycleway", "steps", "pedestrian", "bridleway",
    "unknown", "busway", "track", "track_grade1", "track_grade2",
    "track_grade3", "track_grade4", "track_grade5",
)

SPEED_CASE = """
    CASE road_class
        WHEN 'motorway'       THEN 60 WHEN 'motorway_link'  THEN 40
        WHEN 'trunk'          THEN 60 WHEN 'trunk_link'     THEN 40
        WHEN 'primary'        THEN 50 WHEN 'primary_link'   THEN 35
        WHEN 'secondary'      THEN 45 WHEN 'secondary_link' THEN 30
        WHEN 'tertiary'       THEN 40 WHEN 'tertiary_link'  THEN 30
        WHEN 'unclassified'   THEN 30
        WHEN 'residential'    THEN 30
        WHEN 'living_street'  THEN 20
        WHEN 'service'        THEN 15
    END
"""

ROAD_SEGMENTS_SQL = f"""
INSERT INTO core.road_segments
    (id, geom, road_class, name, oneway, speed_kmh, length_m)
SELECT row_number() OVER (ORDER BY r.id, d.path)::integer,
       d.geom::geometry(LineString,4326),
       r.road_class, r.name, r.oneway,
       {SPEED_CASE},
       ST_Length(d.geom::geometry(LineString,4326)::geography)
FROM core.roads r
CROSS JOIN LATERAL ST_Dump(r.geom) d
"""

STAGING_SQL = f"""
INSERT INTO routing.road_segments_staging
    (id, geom, road_class, name, oneway, speed_kmh, length_m, cost, reverse_cost)
SELECT s.id, ST_Transform(s.geom, 32748), s.road_class, s.name, s.oneway,
       s.speed_kmh, s.length_m,
       CASE WHEN s.oneway = 'T' THEN -1
            ELSE s.length_m * 0.06 / s.speed_kmh END,
       CASE WHEN s.oneway = 'F' THEN -1
            ELSE s.length_m * 0.06 / s.speed_kmh END
FROM core.road_segments s
WHERE s.road_class NOT IN ({", ".join(f"'{c}'" for c in NON_ROUTABLE_CLASSES)})
  AND s.length_m > 0
"""

NODING_SQL = """
DROP TABLE IF EXISTS routing.road_vertices, routing.road_junctions,
                     routing.road_line_junctions, routing.road_segments_noded;

-- Every vertex of every routable edge, keyed by exact coordinate.
CREATE TABLE routing.road_vertices AS
SELECT s.id AS line_id, d.geom AS pt, ST_AsText(d.geom) AS ptkey
FROM routing.road_segments_staging s, ST_DumpPoints(s.geom) d;
CREATE INDEX road_vertices_ptkey_idx ON routing.road_vertices (ptkey);

-- Coordinates shared by more than one distinct edge are intersections.
CREATE TABLE routing.road_junctions AS
SELECT ptkey
FROM (
    SELECT ptkey, count(DISTINCT line_id) AS n
    FROM routing.road_vertices
    GROUP BY ptkey
) grouped
WHERE n > 1;

CREATE TABLE routing.road_line_junctions AS
SELECT v.line_id, ST_Collect(v.pt) AS pts
FROM routing.road_vertices v
JOIN routing.road_junctions j ON j.ptkey = v.ptkey
GROUP BY v.line_id;

-- Split at those vertices; edges without shared vertices are kept whole.
CREATE TABLE routing.road_segments_noded AS
WITH parts AS (
    SELECT s.id AS old_id, s.road_class, s.name, s.oneway, s.speed_kmh,
           (ST_Dump(ST_Split(s.geom, lj.pts))).geom AS geom
    FROM routing.road_segments_staging s
    JOIN routing.road_line_junctions lj ON lj.line_id = s.id
    UNION ALL
    SELECT s.id, s.road_class, s.name, s.oneway, s.speed_kmh, s.geom
    FROM routing.road_segments_staging s
    WHERE NOT EXISTS (
        SELECT 1 FROM routing.road_line_junctions lj
        WHERE lj.line_id = s.id
    )
)
SELECT row_number() OVER (
           ORDER BY old_id,
                    ST_X(ST_StartPoint(geom)),
                    ST_Y(ST_StartPoint(geom))
       )::integer AS id,
       old_id,
       geom,
       road_class, name, oneway, speed_kmh,
       ST_Length(geom) AS length_m,
       CASE WHEN oneway = 'T' THEN -1.0
            ELSE ST_Length(geom) * 0.06 / speed_kmh END AS cost,
       CASE WHEN oneway = 'F' THEN -1.0
            ELSE ST_Length(geom) * 0.06 / speed_kmh END AS reverse_cost
FROM parts
WHERE GeometryType(geom) = 'LINESTRING';

ALTER TABLE routing.road_segments_noded ADD PRIMARY KEY (id);
ALTER TABLE routing.road_segments_noded ADD COLUMN source integer;
ALTER TABLE routing.road_segments_noded ADD COLUMN target integer;

DROP TABLE routing.road_segments_staging;
ALTER TABLE routing.road_segments_noded RENAME TO road_segments_staging;
DROP TABLE routing.road_vertices, routing.road_junctions,
           routing.road_line_junctions;

ANALYZE routing.road_segments_staging;
"""

SITE_EDGES_SQL = """
INSERT INTO routing.evacuation_site_edges
    (evacuation_site_id, edge_id, fraction, snap_distance_m,
     original_geom, snapped_geom, verified_distance_m, is_connected)
SELECT s.id, e.id,
       ST_LineLocatePoint(e.geom, ST_ClosestPoint(e.geom, s.geom)),
       e.distance, s.geom,
       ST_ClosestPoint(e.geom, s.geom),
       e.distance, TRUE
FROM (
    SELECT id, ST_Transform(geom, 32748) AS geom
    FROM core.evacuation_sites
    WHERE geom IS NOT NULL
) s
CROSS JOIN LATERAL (
    SELECT c.id, c.geom, ST_Distance(c.geom, s.geom) AS distance
    FROM (
        SELECT id, geom FROM routing.road_segments_staging
        ORDER BY geom <-> s.geom LIMIT 8
    ) c
    ORDER BY ST_Distance(c.geom, s.geom)
    LIMIT 1
) e
WHERE e.distance <= %(tolerance)s
"""

SITE_EDGES_UNCONNECTED_SQL = """
INSERT INTO routing.evacuation_site_edges
    (evacuation_site_id, original_geom, is_connected)
SELECT s.id, ST_Transform(s.geom, 32748), FALSE
FROM core.evacuation_sites s
WHERE s.geom IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM routing.evacuation_site_edges x
      WHERE x.evacuation_site_id = s.id
  )
"""


def normalize_dsn(dsn: str) -> str:
    return dsn.replace("postgresql+psycopg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )


def step(label: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {label}", flush=True)


def restore_source(dsn: str, dump: str, image: str) -> None:
    if not os.path.exists(dump):
        raise SystemExit(f"Dump sumber tidak ditemukan: {dump}")
    if shutil.which("docker") is None:
        raise SystemExit(
            "Docker tidak tersedia; pulihkan core.roads manual dengan pg_restore 17."
        )

    from psycopg.conninfo import conninfo_to_dict

    info = conninfo_to_dict(dsn)
    env = dict(os.environ)
    if info.get("password"):
        env["PGPASSWORD"] = info["password"]

    command = [
        "docker", "run", "--rm", "--network", "host",
        "-v", f"{os.path.abspath(dump)}:/dump.dump",
        image, "pg_restore",
        "-h", info.get("host", "localhost"),
        "-p", str(info.get("port", 5432)),
        "-U", info.get("user", "bejir"),
        "-d", info.get("dbname", "bejir"),
        "--no-owner", "--no-privileges", "-t", "roads", "/dump.dump",
    ]
    print("Memulihkan core.roads:", " ".join(command), flush=True)
    subprocess.run(command, check=True, env=env)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dsn",
        default=os.environ.get("DATABASE_URL", ""),
        help="DSN PostgreSQL (default: env DATABASE_URL)",
    )
    parser.add_argument(
        "--dump",
        default=DEFAULT_DUMP,
        help="Dump CaiCare yang berisi core.roads (default: %(default)s)",
    )
    parser.add_argument(
        "--image",
        default=DEFAULT_IMAGE,
        help="Image Docker PostgreSQL 17 berisi pg_restore (default: %(default)s)",
    )
    parser.add_argument(
        "--skip-restore",
        action="store_true",
        help="Jangan pulihkan core.roads; anggap tabel sudah ada",
    )
    parser.add_argument(
        "--skip-roads",
        action="store_true",
        help="Lewati pembangunan ulang core.road_segments dan staging",
    )
    parser.add_argument(
        "--connection-tolerance-m",
        type=float,
        default=100.0,
        help="Jarak snap maksimum titik evakuasi ke jalan, meter (default: 100)",
    )
    parser.add_argument(
        "--topology-tolerance-m",
        type=float,
        default=0.01,
        help="Toleransi penggabungan simpul pgr_createTopology, meter (default: 0.01)",
    )
    args = parser.parse_args()

    if not args.dsn:
        raise SystemExit("DSN kosong. Set DATABASE_URL atau pakai --dsn.")

    try:
        import psycopg
    except ImportError:
        raise SystemExit(
            "psycopg belum terpasang. Jalankan dari venv apps/api atau "
            "pip install psycopg[binary]."
        )

    dsn = normalize_dsn(args.dsn)

    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass('core.roads')")
            has_source = cursor.fetchone()[0] is not None

    if not has_source:
        if args.skip_restore:
            raise SystemExit("core.roads belum ada; jalankan tanpa --skip-restore.")
        step("memulihkan core.roads dari dump")
        restore_source(dsn, args.dump, args.image)

    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT count(*), ST_Extent(geom)::text FROM core.roads"
            )
            count, extent = cursor.fetchone()
        if count != 859716:
            raise SystemExit(
                f"core.roads berisi {count:,} baris, bukan 859.716; periksa sumber."
            )
        print(f"core.roads: {count:,} ruas, extent {extent}")

        step("mengosongkan tabel tujuan dan riwayat rute")
        with connection.cursor() as cursor:
            cursor.execute("""
                TRUNCATE core.route_segments, core.route_destinations,
                         core.route_requests, core.road_segments,
                         routing.road_segments_staging,
                         routing.evacuation_site_edges,
                         routing.evacuation_sites_staging
            """)

        if not args.skip_roads:
            step("membangun core.road_segments")
            with connection.cursor() as cursor:
                cursor.execute(ROAD_SEGMENTS_SQL)
                cursor.execute("SELECT count(*) FROM core.road_segments")
                segments = cursor.fetchone()[0]
            print(f"core.road_segments: {segments:,} ruas (LineString)")

            step("membangun routing.road_segments_staging")
            with connection.cursor() as cursor:
                cursor.execute(STAGING_SQL)
                cursor.execute("SELECT count(*) FROM routing.road_segments_staging")
                edges = cursor.fetchone()[0]
            print(f"routing.road_segments_staging: {edges:,} ruas dapat dirutekan")

            step("noding jaringan (memecah ruas di persimpangan)")
            with connection.cursor() as cursor:
                cursor.execute(NODING_SQL)
                cursor.execute("""
                    SELECT count(*), count(DISTINCT old_id)
                    FROM routing.road_segments_staging
                """)
                noded, originals = cursor.fetchone()
            print(
                f"routing.road_segments_staging (noded): {noded:,} ruas "
                f"dari {originals:,} ruas asli"
            )

            step("membangun topologi pgRouting")
            with connection.cursor() as cursor:
                cursor.execute(
                    "DROP TABLE IF EXISTS "
                    "routing.road_segments_staging_vertices_pgr"
                )
                cursor.execute(
                    "SELECT pgr_createTopology("
                    "'routing.road_segments_staging', %s, 'geom', 'id', "
                    "'source', 'target', rows_where := 'true', clean := true)",
                    (args.topology_tolerance_m,),
                )
                cursor.execute("""
                    SELECT count(*) FILTER (WHERE source IS NULL),
                           count(*) FILTER (WHERE target IS NULL),
                           count(*)
                    FROM routing.road_segments_staging
                """)
                source_null, target_null, total = cursor.fetchone()
            if source_null or target_null:
                raise SystemExit(
                    f"Topologi tidak lengkap: source NULL={source_null}, "
                    f"target NULL={target_null} dari {total:,}."
                )
            print(f"topologi: {total:,} ruas, source/target lengkap")

            step("membuat indeks staging")
            with connection.cursor() as cursor:
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS road_segments_staging_geom_idx
                        ON routing.road_segments_staging USING GIST (geom);
                    CREATE INDEX IF NOT EXISTS road_segments_staging_source_idx
                        ON routing.road_segments_staging (source);
                    CREATE INDEX IF NOT EXISTS road_segments_staging_target_idx
                        ON routing.road_segments_staging (target);
                """)

        step("membangun routing.evacuation_sites_staging")
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO routing.evacuation_sites_staging
                    (id, name, display_name, category, district_id, geom)
                SELECT id, name, display_name, category, district_id,
                       ST_Transform(geom, 32748)
                FROM core.evacuation_sites
                WHERE geom IS NOT NULL
            """)

        step("membangun routing.evacuation_site_edges")
        with connection.cursor() as cursor:
            cursor.execute(
                SITE_EDGES_SQL, {"tolerance": args.connection_tolerance_m}
            )
            cursor.execute(SITE_EDGES_UNCONNECTED_SQL)
            cursor.execute("""
                SELECT count(*), count(*) FILTER (WHERE is_connected)
                FROM routing.evacuation_site_edges
            """)
            sites, connected = cursor.fetchone()
        print(f"evacuation_site_edges: {connected:,} / {sites:,} titik terhubung")

        step("ANALYZE")
        with connection.cursor() as cursor:
            cursor.execute(
                "ANALYZE core.road_segments; "
                "ANALYZE routing.road_segments_staging; "
                "ANALYZE routing.evacuation_site_edges"
            )

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT count(*), count(*) FILTER (WHERE road_class IS NULL)
                FROM core.road_segments
            """)
            total_segments, null_class = cursor.fetchone()
            cursor.execute(
                "SELECT count(*) FROM "
                "routing.road_segments_staging_vertices_pgr"
            )
            vertices = cursor.fetchone()[0]

    print(
        f"Selesai: {total_segments:,} ruas jalan, {vertices:,} simpul jaringan, "
        f"{sites:,} titik evakuasi ({connected:,} terhubung)."
    )
    if null_class:
        print(f"Catatan: {null_class:,} ruas tanpa road_class.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
