# AI Project Context: SIBAJAWA (Bejir WebGIS)

Dokumen ini adalah ringkasan konteks teknis bagi model AI penerus yang mengerjakan pengembangan antarmuka dan motion engineering SIBAJAWA. Baca dokumen ini terlebih dahulu sebelum membuka `AI_IMPLEMENTATION_WORKFLOW.md` dan `AI_PROGRESS.md`.

## 1. Identitas Proyek & Lokasi Repositori

- Nama Produk Publik: **SIBAJAWA** (Sistem Informasi Banjir Jawa Barat), dikenal secara internal pada kode dan skema basis data sebagai **Bejir**.
- URL Produksi Referensi: https://sibajawa.vercel.app/
- Root Git Repository: `frontend/bejir/` (remote `origin`: `https://github.com/bejir-orgz/bejir.git`)
- Root Aplikasi Frontend: `frontend/bejir/apps/web/`
- Branch Kerja Wajib: `dev-animasi-FE` (dibuat dari `main`, yang telah memuat merge terbaru dari `origin/frontend`). Jangan pernah melakukan commit atau push langsung ke `main` atau `frontend`.

## 2. Tech Stack Aktual (Jangan Mengganti Stack)

- **Framework**: Next.js `16.3.8` (App Router, React `19.2.8`, TypeScript `5`)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`, `tw-animate-css`) + CSS Modules khusus halaman landing (`landing.module.css`) dan shell navigasi (`site-header.module.css`, `webgis-header.css`)
- **UI Primitives**: shadcn/ui (`radix-ui` `^1.8.1`, `class-variance-authority`, `tailwind-merge`) di `apps/web/components/ui/`
- **Icons**: `@tabler/icons-react` `^3.49.0` (wajib digunakan secara konsisten; jangan memasang Lucide atau menyimpan ikon UI sebagai SVG statis baru)
- **Motion Library**: `framer-motion` `^14.6.0` (sudah terpasang; mendukung `LazyMotion`, `domAnimation`, `m`, `AnimatePresence`, `useReducedMotion`, `animate`)
- **Peta Interaktif**: `leaflet` `^1.9.4` dengan basemap OpenStreetMap dan Canvas/SVG layer di `apps/web/features/map/`, `features/geography/`, `features/rivers/`, `features/evacuation/`, `features/regions/`
- **Visualisasi Grafik & Tabel**: `recharts` `^3.8.0` (melalui `components/ui/chart.tsx`) dan `@tanstack/react-table` `^8.21.3` (melalui `components/shared/data-table.tsx`)
- **Tipografi**: `Google Sans Flex` via `next/font/google` (`--font-google-sans-flex`)

## 3. Peta Halaman & Arsitektur Routing

Seluruh route berada di `frontend/bejir/apps/web/app/`:

1. `/` dan `/landing` (`app/page.tsx`, `app/landing/page.tsx`, `app/landing/_components/*`):
   - Landing page publik SIBAJAWA dengan ilustrasi lanskap sungai Jawa Barat, statistik historis BNPB 2024, peringkat 5 kabupaten dengan kejadian banjir terbanyak, penjelasan cakupan layer, fitur, alur eksplorasi, dan CTA menuju `/map`.
2. `/map` (`app/map/page.tsx`, `features/webgis/components/webgis-workspace.tsx`):
   - Workspace utama WebGIS layar penuh (`h-dvh`).
   - Memiliki header navigasi (`WebgisHeader`), peta Leaflet (`InteractiveMap`), 4 panel kiri (`RegionSidebar`, `OptionsSidebar`, `LegendSidebar`, `TimelineSidebar`), serta panel kanan (`OverviewPanel` dan asisten AI `BejirAssistant` / "Aji").
   - Layer peta terhubung ke route internal/proxy: `RiverLayer` (`rivers`), `ThematicLayers` (`rainfall`, `dem`, `susceptibility`, `land-cover`), `EvacuationLayer` + `EvacuationRouting` (`evacuation`), dan `BoundaryLayer`.
3. `/histori-banjir` (`app/histori-banjir/page.tsx`, `features/floods/components/*`):
   - Dashboard histori kejadian banjir tahunan: filter wilayah dan tahun di header, donut chart korban (`CasualtyChart`), 2 kartu metrik ringkasan, area chart bulanan (`TimelineChart`), serta tabel histori yang dapat dicari, difilter (tanggal, daerah, jenis banjir), dan diurutkan.
4. `/curah-hujan` (`app/curah-hujan/page.tsx`, `features/rainfall/components/*`):
   - Dashboard curah hujan Jawa Barat: 3 kartu metrik tahunan (rata-rata, minimum, maksimum), bar chart bulanan (`RainfallChart`), kartu legenda reklasifikasi tahunan 5 kelas, serta tabel curah hujan per wilayah/periode.
5. `/analisis` (`app/analisis/page.tsx`, `features/webgis/components/analysis-*`):
   - Dashboard analisis kerawanan lintas domain: 4 kartu metrik utama, 3 grafik (`FrequencyChart`, `SusceptibilityChart`, `AnnualEventsChart`), daftar fasilitas terdampak (`FacilityRows`), dan tabel kerawanan wilayah (`AnalysisTable`).

## 4. Arsitektur Data, API Proxy, & Kontrak Pengujian

- **Backend Proxy (`next.config.ts`)**:
  - Request browser ke `/backend/web/*` diarahkan ke Next.js Route Handlers di `app/api/*`.
  - Request ke `/backend/api/v1/*` diarahkan ke `app/api/backend/[[...path]]/route.ts` yang meneruskan ke `BEJIR_API_URL` (default `http://80.43.0.180:8000`).
- **State Wilayah Global (`RegionSelectionProvider` di `app/layout.tsx`)**:
  - `RootLayout` mengambil katalog administrasi (`27 kabupaten/kota` dan `627 kecamatan`) melalui `getCatalog()`.
  - Konteks `useRegionSelection()` menyediakan `regionIds`, `mapRegionIds`, `dataRegionIds`, dan `tree` untuk sinkronisasi filter wilayah antarhalaman.
  - Penting: Filter header (`summaryYear`, `summaryRegionIds`) dan filter tabel (`tableYear`, `filters`) pada halaman `/histori-banjir`, `/curah-hujan`, dan `/analisis` sengaja dibuat independen sesuai spesifikasi `DESIGN.md`. Jangan menggabungkan state keduanya.
- **Unit Tests Bawaan (`node --test`)**:
  - Terdapat 23 berkas `*.test.mjs` di `apps/web/features/` dan `apps/web/lib/`.
  - Beberapa unit test memeriksa string data secara eksak! Contoh penting di `features/webgis/overview-api.test.mjs`:
    - `assert.equal(result.metrics[1].label, "Rumah Terpendam")`
    - `assert.equal(result.metrics[1].label, "Total Rumah Terpendam")`
  - Jangan mengubah string kontrak di fungsi data (`overview-api.ts`, `analysis-api.ts`, `history-summary.ts`) yang diuji oleh `*.test.mjs`. Perbaikan visual dilakukan pada layer komponen presentasi.

## 5. Aturan Desain & Kebenaran Data yang Mengikat

1. **Kejujuran Ilmiah Kebencanaan**:
   - Bedakan secara eksplisit antara **Data Historis** (catatan BNPB / basis data kejadian), **Hasil Analisis Spasial** (parameter kecamatan PostGIS/QGIS), dan **Simulasi Edukatif** (visualisasi interaktif untuk pemahaman konsep).
   - Jangan pernah menampilkan animasi banjir atau longsor seolah-olah bencana sedang berlangsung secara real-time jika data tidak menyatakannya. Setiap fitur simulasi wajib diberi label tegas `"Simulasi Edukatif · Bukan Kondisi Aktual"`.
2. **Warna Semantik Resmi (`DESIGN.md` & `globals.css`)**:
   - Kerawanan & Klasifikasi 5 Kelas: Sangat Rendah `#3CFF00`, Rendah `#E1FF00`, Sedang `#FFD000`, Tinggi `#FF6A00`, Sangat Tinggi `#FF0000` (teks di atas badge status wajib gelap `#111111` agar kontras terbaca, dan selalu disertai teks label, bukan warna saja).
   - Korban: Meninggal `#FF0000`, Hilang `#EFB100`.
   - Warna Aksi Utama: Blue 500 `#2B7FFF` / Blue 600 `#155DFC` / `#2563EB`, permukaan terang bersih (`#FFFFFF`, `#F8FAFC`, `#EFF6FF`), tanpa tumpukan efek neon, dark-mode paksa, atau glassmorphism berlebihan.
3. **Standar Motion & Aksesibilitas**:
   - Gunakan properti ramah GPU (`transform`, `opacity`, `clip-path`, atau Canvas/SVG stroke offset). Jangan pernah menulis `transition: all`.
   - Durasi interaksi UI harian maksimal `150ms` hingga `280ms` dengan kurva tegas `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)`.
   - Hormati `prefers-reduced-motion: reduce` di CSS maupun React (`useReducedMotion()`), serta batasi efek hover gerak dengan `@media (hover: hover) and (pointer: fine)`.
   - Hindari penggunaan karakter em dash dalam teks antarmuka maupun dokumentasi baru.
