#!/usr/bin/env python3
"""Impor klasifikasi curah hujan tahunan (klimatologi) ke database.

Dua level, terdeteksi dari header CSV:

1. Kecamatan (code_kec, ..., mean_hujan_mm, kelas_hujan, label_hujan)
   -> core.district_rainfall_classification
2. Kabupaten/kota (code_pum, n_kec, n_kec_berdata, mean_hujan_mm,
   min_kec_mm, maks_kec_mm, kelas_hujan, label_hujan)
   -> core.regency_rainfall_classification

Nilai kelas/label kosong (7 kecamatan Bekasi) menjadi SQL NULL, BUKAN 0.
Kelas yang tidak berada di 1..5 dianggap kesalahan data dan menghentikan impor.

Contoh:

  python gis/scripts/import_rainfall_classification.py \
      --csv klasifikasi_hujan_kecamatan.csv \
      --dsn postgresql://bejir:bejir123@localhost:5432/bejir

  python gis/scripts/import_rainfall_classification.py \
      --csv klasifikasi_hujan_kabupaten.csv \
      --dsn postgresql://bejir:bejir123@localhost:5432/bejir

Jalankan database/migrations/002_rainfall_classification.sql lebih dulu.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys

NULL_TOKENS = {"", "nan", "none", "null", "na"}

DISTRICT_SQL = """
INSERT INTO core.district_rainfall_classification
    (district_id, n_piksel, mean_hujan_mm, kelas_hujan, label_hujan)
VALUES (%s, %s, %s, %s, %s)
ON CONFLICT (district_id) DO UPDATE SET
    n_piksel = EXCLUDED.n_piksel,
    mean_hujan_mm = EXCLUDED.mean_hujan_mm,
    kelas_hujan = EXCLUDED.kelas_hujan,
    label_hujan = EXCLUDED.label_hujan
"""

REGENCY_SQL = """
INSERT INTO core.regency_rainfall_classification
    (regency_id, n_kec, n_kec_berdata, mean_hujan_mm, min_kec_mm,
     maks_kec_mm, kelas_hujan, label_hujan)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (regency_id) DO UPDATE SET
    n_kec = EXCLUDED.n_kec,
    n_kec_berdata = EXCLUDED.n_kec_berdata,
    mean_hujan_mm = EXCLUDED.mean_hujan_mm,
    min_kec_mm = EXCLUDED.min_kec_mm,
    maks_kec_mm = EXCLUDED.maks_kec_mm,
    kelas_hujan = EXCLUDED.kelas_hujan,
    label_hujan = EXCLUDED.label_hujan
"""


def parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip()
    if text.lower() in NULL_TOKENS:
        return None
    return float(text)


def parse_int(value: str | None) -> int | None:
    number = parse_float(value)
    if number is None:
        return None
    if number != int(number):
        raise SystemExit(f"Nilai bukan bilangan bulat: {value!r}")
    return int(number)


def parse_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text or None


def parse_class(value: str | None, *, context: str) -> int | None:
    kelas = parse_int(value)
    if kelas is None:
        return None
    if not 1 <= kelas <= 5:
        raise SystemExit(f"Kelas hujan di luar 1..5 pada {context}: {kelas}")
    return kelas


def normalize_dsn(dsn: str) -> str:
    return dsn.replace("postgresql+psycopg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )


def detect_level(fieldnames: list[str], requested: str | None) -> str:
    if requested is not None:
        return requested
    fields = set(fieldnames)
    if "code_kec" in fields:
        return "district"
    if {"code_pum", "n_kec"} <= fields:
        return "regency"
    raise SystemExit(
        "Tidak bisa mendeteksi level CSV. Pakai --level district|regency."
    )


def read_rows(
    path: str, level: str
) -> tuple[list[tuple], int, int]:
    """Kembalikan (rows, jumlah baris, jumlah kelas NULL)."""
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise SystemExit(f"CSV tidak memiliki header: {path}")

        rows: list[tuple] = []
        null_classes = 0
        for raw in reader:
            code_field = "code_kec" if level == "district" else "code_pum"
            code = (raw.get(code_field) or "").strip()
            if not code:
                raise SystemExit(f"Baris tanpa {code_field}: {raw!r}")

            kelas = parse_class(
                raw.get("kelas_hujan"),
                context=f"{code_field}={code}",
            )
            if kelas is None:
                null_classes += 1

            if level == "district":
                rows.append(
                    (
                        code,
                        parse_int(raw.get("n_piksel")),
                        parse_float(raw.get("mean_hujan_mm")),
                        kelas,
                        parse_text(raw.get("label_hujan")),
                    )
                )
            else:
                rows.append(
                    (
                        code,
                        parse_int(raw.get("n_kec")),
                        parse_int(raw.get("n_kec_berdata")),
                        parse_float(raw.get("mean_hujan_mm")),
                        parse_float(raw.get("min_kec_mm")),
                        parse_float(raw.get("maks_kec_mm")),
                        kelas,
                        parse_text(raw.get("label_hujan")),
                    )
                )

    return rows, len(rows), null_classes


def load_id_map(cursor, *, table: str, code_column: str, id_column: str) -> dict[str, int]:
    cursor.execute(
        f"SELECT btrim({code_column}), {id_column} FROM {table} "
        f"WHERE {code_column} IS NOT NULL"
    )
    mapping: dict[str, int] = {}
    for code, row_id in cursor.fetchall():
        if code in mapping:
            raise SystemExit(
                f"Kode ganda di {table}.{code_column}: {code} "
                f"({mapping[code]} dan {row_id})"
            )
        mapping[code] = row_id
    return mapping


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, help="Path CSV klasifikasi")
    parser.add_argument(
        "--dsn",
        default=os.environ.get("DATABASE_URL", ""),
        help="DSN PostgreSQL (default: env DATABASE_URL)",
    )
    parser.add_argument(
        "--level",
        choices=("district", "regency"),
        default=None,
        help="Level data; default terdeteksi dari header CSV",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Kosongkan tabel level terkait sebelum impor",
    )
    parser.add_argument(
        "--skip-unmatched",
        action="store_true",
        help="Lewati kode wilayah yang tidak ada di core.districts/regency",
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

    with open(args.csv, newline="", encoding="utf-8-sig") as handle:
        header = next(csv.reader(handle))
    level = detect_level(header, args.level)

    rows, source_count, null_classes = read_rows(args.csv, level)
    if level == "district":
        table = "core.district_rainfall_classification"
        id_map_sql = {
            "table": "core.districts",
            "code_column": "code",
            "id_column": "id",
        }
        sql = DISTRICT_SQL
    else:
        table = "core.regency_rainfall_classification"
        id_map_sql = {
            "table": "core.regency",
            "code_column": "code",
            "id_column": "id",
        }
        sql = REGENCY_SQL

    with psycopg.connect(normalize_dsn(args.dsn)) as connection:
        with connection.cursor() as cursor:
            id_map = load_id_map(cursor, **id_map_sql)

        unmatched = sorted({row[0] for row in rows} - id_map.keys())
        if unmatched and not args.skip_unmatched:
            preview = ", ".join(unmatched[:10])
            raise SystemExit(
                f"{len(unmatched)} kode tidak ditemukan di {id_map_sql['table']}: "
                f"{preview}. Periksa format kode atau pakai --skip-unmatched."
            )

        prepared = [
            (id_map[row[0]], *row[1:])
            for row in rows
            if row[0] in id_map
        ]

        with connection.cursor() as cursor:
            if args.truncate:
                cursor.execute(f"TRUNCATE {table} RESTART IDENTITY")
            cursor.executemany(sql, prepared)
        connection.commit()

    skipped = len(rows) - len(prepared)
    print(
        f"level={level} sumber={source_count} baris; ditulis={len(prepared)}; "
        f"kelas NULL={null_classes}; dilewati={skipped}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
