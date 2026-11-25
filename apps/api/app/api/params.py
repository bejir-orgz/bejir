import math

from fastapi import HTTPException


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    """
    Parse a comma-separated minx,miny,maxx,maxy bounding box in EPSG:4326.
    """
    try:
        parts = [part.strip() for part in value.split(",")]
        if len(parts) != 4:
            raise ValueError
        minx, miny, maxx, maxy = (float(part) for part in parts)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="bbox harus berupa minx,miny,maxx,maxy dalam EPSG:4326.",
        )

    if not all(math.isfinite(number) for number in (minx, miny, maxx, maxy)):
        raise HTTPException(
            status_code=422,
            detail="bbox harus berisi angka berhingga.",
        )
    if not (-180 <= minx < maxx <= 180 and -90 <= miny < maxy <= 90):
        raise HTTPException(
            status_code=422,
            detail="bbox di luar EPSG:4326 atau nilai min tidak lebih kecil dari maks.",
        )

    return minx, miny, maxx, maxy
