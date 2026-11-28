# Tile jaringan sungai

`GET /api/v1/rivers/tiles/{z}/{x}/{y}.mvt` menyediakan Mapbox Vector Tile dengan source layer `rivers`. Rentang zoom sumber adalah 4–14. Peta memakai ulang tile zoom 14 saat diperbesar lebih jauh.

Filter `regency_id` dan `district_id` dapat diulang. Geometri dipotong ke gabungan batas wilayah yang dipilih. Ketiadaan filter memakai seluruh dataset sungai Jawa Barat. Setiap tile memuat semua garis yang dapat digambar pada resolusi tile tersebut. Atribut garis meliputi ID segmen, nama, dan jenis sungai.

PostGIS memakai indeks geometri EPSG:3857 untuk menyaring kandidat sebelum mengodekan tile. Endpoint daftar sungai yang lama tetap tersedia untuk statistik dan konsumen GeoJSON. WebGIS mengakses tile melalui `/backend/web/rivers/tiles/{z}/{x}/{y}`. Deploy FastAPI dan frontend bersama agar layer baru dapat dimuat.

Jika endpoint tile belum tersedia, WebGIS otomatis memakai endpoint GeoJSON yang sudah aktif. Mode ini memuat jaringan per area tampilan dan memberi keterangan ketika jumlah segmennya melebihi batas respons.
