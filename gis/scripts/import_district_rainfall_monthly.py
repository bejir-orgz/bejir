#!/usr/bin/env python3
"""Impor curah hujan bulanan kecamatan ke core.district_rainfall_monthly.

Mendukung dua format CSV:

1. Lebar (hujan_klimatologi_kecamatan.csv): satu baris per kecamatan dengan
   12 kolom hujan_{jan..des}_mm dan n_piksel_hujan. Tidak ada kolom tahun,
   sehingga diimpor sebagai klimatologi dengan year = NULL.

2. Panjang (hujan_bulanan_kecamatan.csv): kolom code_kec, tahun, bulan,
   n_piksel_hujan, hujan_mm. Setiap baris menyimpan tahun aslinya.

Nilai kosong, "nan", "none", atau "null" menjadi SQL NULL, BUKAN 0. Itu wajib
untuk 7 kecamatan Bekasi yang tidak punya cakupan CHIRPS.

Kolom n_piksel_hujan pada CSV adalah jumlah piksel di bawah mask hujan, BUKAN
total piksel kecamatan. Importer menyimpannya ke n_piksel_hujan dan mengisi
n_piksel dari core.district_hazard_statistics (statistik_kecamatan.csv).

Contoh pemakaian:

  python gis/scripts/import_district_rainfall_monthly.py \
      --csv hujan/hujan_klimatologi_kecamatan.csv \
      --dsn postgresql://bejir:bejir123@localhost:5432/bejir

  python gis/scripts/import_district_rainfall_monthly.py \
      --csv hujan/hujan_bulanan_kecamatan.csv \
      --dsn postgresql://bejir:bejir123@localhost:5432/bejir --year 2015

Jalankan DDL database/migrations/001_district_rainfall_monthly.sql lebih dulu.
"""

from __future__ import annotations

import argparse
import csv
import os
import sys

MONTHS = (
    ("jan", 1),
    ("feb", 2),
    ("mar", 3),
    ("apr", 4),
    ("mei", 5),
    ("jun", 6),
    ("jul", 7),
    ("agu", 8),
    ("sep", 9),
    ("okt", 10),
    ("nov", 11),
    ("des", 12),
)

NULL_TOKENS = {"", "nan", "none", "null", "na"}


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
        raise ValueError(f"Nilai bukan bilangan bulat: {value!r}")
    return int(number)


def normalize_dsn(dsn: str) -> str:
    return dsn.replace("postgresql+psycopg://", "postgresql://").replace(
        "postgresql+psycopg2://", "postgresql://"
    )


def load_district_ids(cursor) -> dict[str, int]:
    cursor.execute(
        "SELECT btrim(code), id FROM core.districts WHERE code IS NOT NULL"
    )
    mapping: dict[str, int] = {}
    for code, district_id in cursor.fetchall():
        if code in mapping:
            raise SystemExit(
                f"Kode kecamatan ganda di core.districts: {code} "
                f"({mapping[code]} dan {district_id})"
            )
        mapping[code] = district_id
    return mapping


def load_district_pixels(cursor) -> dict[str, int | None]:
    """Total district pixels, never the CHIRPS rain-mask count."""
    cursor.execute(
        """
        SELECT btrim(district.code), statistics.n_piksel
        FROM core.districts AS district
        LEFT JOIN core.district_hazard_statistics AS statistics
            ON statistics.district_id = district.id
        WHERE district.code IS NOT NULL
        """
    )
    return {
        code: n_piksel
        for code, n_piksel in cursor.fetchall()
    }


def read_rows(path: str, year: int | None) -> tuple[list[tuple], int, int]:
    """Kembalikan (rows, jumlah baris sumber, jumlah hujan NULL)."""
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise SystemExit(f"CSV tidak memiliki header: {path}")

        fields = set(reader.fieldnames)
        is_long = {"tahun", "bulan", "hujan_mm"} <= fields
        if not is_long and not {"code_kec"} <= fields:
            raise SystemExit(
                "Format CSV tidak dikenali. Perlu code_kec + kolom bulan "
                "(format lebar) atau code_kec/tahun/bulan/hujan_mm (format panjang)."
            )

        rows: list[tuple] = []
        null_rainfall = 0
        source_count = 0
        for raw in reader:
            source_count += 1
            code = (raw.get("code_kec") or "").strip()
            if not code:
                raise SystemExit(f"Baris tanpa code_kec: {raw!r}")

            n_piksel = parse_int(raw.get("n_piksel_hujan"))

            if is_long:
                row_year = parse_int(raw.get("tahun"))
                if row_year is None:
                    row_year = year
                month = parse_int(raw.get("bulan"))
                if month is None or not 1 <= month <= 12:
                    raise SystemExit(f"Bulan tidak valid: {raw.get('bulan')!r}")
                hujan = parse_float(raw.get("hujan_mm"))
                if hujan is None:
                    null_rainfall += 1
                rows.append((code, row_year, month, n_piksel, hujan))
                continue

            for name, month in MONTHS:
                hujan = parse_float(raw.get(f"hujan_{name}_mm"))
                if hujan is None:
                    null_rainfall += 1
                rows.append((code, year, month, n_piksel, hujan))

    return rows, source_count, null_rainfall


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, help="Path CSV sumber")
    parser.add_argument(
        "--dsn",
        default=os.environ.get("DATABASE_URL", ""),
        help="DSN PostgreSQL (default: env DATABASE_URL)",
    )
    parser.add_argument(
        "--year",
        type=int,
        default=None,
        help="Tahun untuk format lebar; kosongkan untuk klimatologi (NULL)",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Kosongkan tabel sebelum impor",
    )
    parser.add_argument(
        "--skip-unmatched",
        action="store_true",
        help="Lewati kode kecamatan yang tidak ada di core.districts",
    )
    args = parser.parse_args()

    if not args.dsn:
        raise SystemExit("DSN kosong. Set DATABASE_URL atau pakai --dsn.")
    if args.year is not None and not 1900 <= args.year <= 2100:
        raise SystemExit("--year harus antara 1900 dan 2100.")

    try:
        import psycopg
    except ImportError:
        raise SystemExit(
            "psycopg belum terpasang. Jalankan dari venv apps/api atau "
            "pip install psycopg[binary]."
        )

    rows, source_count, null_rainfall = read_rows(args.csv, args.year)

    with psycopg.connect(normalize_dsn(args.dsn)) as connection:
        with connection.cursor() as cursor:
            district_ids = load_district_ids(cursor)
            district_pixels = load_district_pixels(cursor)

        unmatched = sorted({row[0] for row in rows} - district_ids.keys())
        if unmatched and not args.skip_unmatched:
            preview = ", ".join(unmatched[:10])
            raise SystemExit(
                f"{len(unmatched)} kode kecamatan tidak ditemukan di "
                f"core.districts: {preview}. Periksa format kode "
                "(contoh 32.01.01) atau pakai --skip-unmatched."
            )

        prepared = [
            (
                district_ids[code],
                row_year,
                month,
                district_pixels[code],
                n_piksel_hujan,
                hujan,
            )
            for code, row_year, month, n_piksel_hujan, hujan in rows
            if code in district_ids
        ]

        with connection.cursor() as cursor:
            if args.truncate:
                cursor.execute(
                    "TRUNCATE core.district_rainfall_monthly RESTART IDENTITY"
                )
            cursor.executemany(
                """
                INSERT INTO core.district_rainfall_monthly
                    (district_id, year, month, n_piksel, n_piksel_hujan,
                     hujan_mm)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                prepared,
            )
            written = cursor.rowcount if cursor.rowcount >= 0 else None
        connection.commit()

    skipped = len(rows) - len(prepared)
    written = len(prepared) if written is None else written
    print(
        f"sumber={source_count} baris; ditulis={written} baris; "
        f"hujan NULL={null_rainfall}; dilewati={skipped}"
    )
    if args.year is None and not any(row[1] is not None for row in rows):
        print("year=NULL (klimatologi)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
