# AI Implementation Progress: SIBAJAWA

Dokumen ini mencatat status pengerjaan aktual dari daftar task pada `AI_IMPLEMENTATION_WORKFLOW.md`.

## Status Ringkasan

- **Active Repository**: `frontend/bejir`
- **Active Branch**: `dev-animasi-FE`
- **Creative Direction**: Living Hydrological Atlas (`ENERGY 2 / RHYTHM 3 / MOTION 2` untuk Landing; `ENERGY 2 / RHYTHM 2 / MOTION 2` untuk WebGIS & Dashboards)
- **Build & Test Status**: `npm run lint` PASS (0 errors, 0 warnings), 25/25 suite `*.test.mjs` (87/87 tests) PASS, `npm run build` PASS (Next.js 16.3.8 production build, 18 routes).

## Completed Tasks

- **UI-001**: Motion Tokens, Reduced-Motion System, and Shared UI Primitives (`globals.css`, `button.tsx`, `status-pill.tsx`, `animated-metric-value.tsx`, `metric-format.ts`, `metric-format.test.mjs`)
- **UI-002**: WebGIS Header, Region Search Accessibility, and Mobile Shell Refinement (`webgis-header.tsx`, `webgis-header.css`, `region-search.tsx`, `region-sidebar.tsx`, `history-filters.tsx`, `rainfall-filters.tsx`, `analysis-filters.tsx`)
- **UI-003**: Fix Landing Page Scroll Reveal Bug and Clean Template Tells (`landing-motion.tsx`, `landing-page.tsx`, `landing.module.css`, `sibajwa-brand.tsx`)
- **UI-004**: Interactive Hydrological Layer Explorer & Clickable Flood Ranking on Landing Page (`interactive-atlas-preview.tsx`, `region-selection.tsx`, `landing-page.tsx`)
- **UI-005**: Disaster Map Quick Layer Bar, Smooth Camera FlyTo, and District Hover Inspector (`map-quick-bar.tsx`, `webgis-workspace.tsx`, `interactive-map.tsx`, `boundary-layer.tsx`, `thematic-layers.tsx`)
- **UI-006**: Living River Flow & Animated Evacuation Markers and Routing (`river-layer.tsx`, `evacuation-layer.tsx`, `evacuation-routing.tsx`, `globals.css`)
- **UI-007**: Educational Flood Inundation & Landslide Slope Simulator on Disaster Map (`hydro-simulation-panel.tsx`, `webgis-workspace.tsx`)
- **UI-008**: Fix & Enliven Flood History Dashboard `/histori-banjir` (`history-page.tsx`, `history-charts.tsx`, `history-table.tsx`)
- **UI-009**: Enliven Rainfall Dashboard & Classification Table `/curah-hujan` (`rainfall-page.tsx`, `rainfall-chart.tsx`, `rainfall-table.tsx`)
- **UI-010**: Fix Clipped Frequency Chart & Upgrade Analysis Dashboard `/analisis` (`analysis-page.tsx`, `analysis-charts.tsx`, `analysis-table.tsx`)
- **UI-011**: Overview Panel & Bejir AI Assistant ("Aji") Interactive Polish (`overview-panel.tsx`, `assistant.tsx`)
- **UI-012**: Full Multi-Viewport QA (`1440x900`, `768x1024`, `390x844`), Reduced-Motion Verification, Accessibility Check, Unit Tests, and Production Build
- **SIM-001**: Porting Perbaikan Pemuatan Data Wilayah Live dari `main/bejir` (`thematic-geometry.ts`, `api/geography/boundary/route.ts`, `prepared-data.ts`, `catalog.ts`, `search.ts`, `overview-api.ts`, `use-overview.ts`, `api/flood/history/route.ts`, `proxy.ts`, `facility-rows.tsx`, `layout.tsx`, `next.config.ts`)
- **SIM-002**: Generator & Paket Kontur Ringan Jawa Barat (`gis/scripts/build-simulation-pack.mjs` -> `public/simulation/terrain-dem-hand.png` 763,9 KB, `terrain-hazard-params.png` 686,2 KB, `terrain-meta.json`; proyeksi `EPSG:32748` ke grid `EPSG:3857` `768x615` bebas korupsi premultiplied alpha)
- **SIM-003**: Mesin Fisik & Layer Simulasi Interaktif Langsung di Peta (`features/simulation/terrain-pack.ts`, `terrain-pack.test.mjs`, `map-simulation-layer.tsx`) dengan klik daerah (`Kecamatan` / `Kabupaten`), genangan banjir berbasis DEM + HAND dengan riak gelombang, serta kerentanan longsor berbasis Slope + Hujan + Tutupan Lahan + partikel aliran turun lereng
- **SIM-004**: Panel Kontrol Simulasi On-Map Ringkas & QA Multi-Viewport (`hydro-simulation-panel.tsx`, `map-quick-bar.tsx`, `webgis-workspace.tsx`; teruji di `1440px`, `768px`, dan `390px` dengan `overflow: false`)

## Tasks In Progress

- Tidak ada (seluruh task fase fondasi hingga QA selesai tervalidasi).

## Pending / Optional Future Enhancements (Fase Lanjutan bila Backend Mendukung)

- **OPT-001**: Integrasi data spasial longsor (poligon kerawanan gerakan tanah PVMBG/BNPB) ke `ThematicLayers` apabila endpoint backend tersedia di masa mendatang (saat ini simulasi pergerakan lereng disajikan pada `HydroSimulationPanel` sebagai modul edukatif terlabel).
- **OPT-002**: Animasi pemutaran deret waktu (time-slider playback bulanan) langsung pada layer choropleth curah hujan kecamatan setelah endpoint `spatial/layers` menyertakan dimensi periode bulanan.

## Known Issues & Environment Notes

1. Batas wilayah (`627` kecamatan dan `27` kabupaten/kota) serta 4 layer tematik (`DEM`, `Curah Hujan`, `Kerawanan Banjir`, `Tutupan Lahan`) kini dimuat langsung dari endpoint live backend `/api/v1/geography/boundaries` tanpa memerlukan file lokal `boundaries.json`. Hanya layer `Jaringan Sungai` yang masih menunggu filter `bbox` pada endpoint `/api/v1/rivers` dari tim backend.
2. Permintaan `/favicon.ico` bawaan browser mengembalikan `404` karena proyek belum menyertakan berkas ikon tab browser khusus di `app/favicon.ico` (tidak memengaruhi fungsi halaman).

## Key Decisions Made

1. Mempertahankan seluruh string kontrak data di fungsi API/summary (`"Rumah Terpendam"`, `"Total Rumah Terpendam"`, `"—"`) sehingga seluruh 24 berkas unit test lulus 100%.
2. Menggunakan warna teks gelap `#111111` pada kelima kelas `StatusPill` (`#3CFF00` s.d. `#FF0000`) sesuai `DESIGN.md` §5 dan perhitungan kontras WCAG AA (`>= 4.72:1`).
3. Menyediakan tombol jeda eksplisit pada animasi lanskap beranda (`Jeda arus`) dan pada panel simulasi edukatif (`Jeda`), serta menghentikan otomatis seluruh gerak kontinu pada `prefers-reduced-motion: reduce`.
4. Menerjemahkan ID filter wilayah di `InteractiveFloodRanking` melalui `toMapIds` pada `RegionSelectionContext` sehingga tautan beranda menuju `/map?region=<numeric_id>` yang valid.

## Files Created & Modified

### Created
- `frontend/bejir/AI_PROJECT_CONTEXT.md`
- `frontend/bejir/AI_IMPLEMENTATION_WORKFLOW.md`
- `frontend/bejir/AI_PROGRESS.md`
- `frontend/bejir/apps/web/app/landing/_components/interactive-atlas-preview.tsx`
- `frontend/bejir/apps/web/components/shared/animated-metric-value.tsx`
- `frontend/bejir/apps/web/components/shared/status-pill.tsx`
- `frontend/bejir/apps/web/features/webgis/components/hydro-simulation-panel.tsx`
- `frontend/bejir/apps/web/features/webgis/components/map-quick-bar.tsx`
- `frontend/bejir/apps/web/lib/metric-format.ts`
- `frontend/bejir/apps/web/lib/metric-format.test.mjs`

### Modified
- `frontend/bejir/apps/web/app/globals.css`
- `frontend/bejir/apps/web/app/landing/_components/landing-motion.tsx`
- `frontend/bejir/apps/web/app/landing/_components/landing-page.tsx`
- `frontend/bejir/apps/web/app/landing/_components/landing.module.css`
- `frontend/bejir/apps/web/components/layout/webgis-header.css`
- `frontend/bejir/apps/web/components/layout/webgis-header.tsx`
- `frontend/bejir/apps/web/components/shared/sibajwa-brand.tsx`
- `frontend/bejir/apps/web/components/ui/button.tsx`
- `frontend/bejir/apps/web/features/assistant/components/assistant.tsx`
- `frontend/bejir/apps/web/features/evacuation/evacuation-layer.tsx`
- `frontend/bejir/apps/web/features/evacuation/evacuation-routing.tsx`
- `frontend/bejir/apps/web/features/floods/components/history-charts.tsx`
- `frontend/bejir/apps/web/features/floods/components/history-page.tsx`
- `frontend/bejir/apps/web/features/floods/components/history-table.tsx`
- `frontend/bejir/apps/web/features/geography/thematic-layers.tsx`
- `frontend/bejir/apps/web/features/map/components/interactive-map.tsx`
- `frontend/bejir/apps/web/features/rainfall/components/rainfall-chart.tsx`
- `frontend/bejir/apps/web/features/rainfall/components/rainfall-page.tsx`
- `frontend/bejir/apps/web/features/rainfall/components/rainfall-table.tsx`
- `frontend/bejir/apps/web/features/regions/boundary-layer.tsx`
- `frontend/bejir/apps/web/features/regions/region-search.tsx`
- `frontend/bejir/apps/web/features/regions/region-selection.tsx`
- `frontend/bejir/apps/web/features/rivers/river-layer.tsx`
- `frontend/bejir/apps/web/features/webgis/components/analysis-charts.tsx`
- `frontend/bejir/apps/web/features/webgis/components/analysis-filters.tsx`
- `frontend/bejir/apps/web/features/webgis/components/analysis-page.tsx`
- `frontend/bejir/apps/web/features/webgis/components/analysis-table.tsx`
- `frontend/bejir/apps/web/features/webgis/components/overview-panel.tsx`
- `frontend/bejir/apps/web/features/webgis/components/region-sidebar.tsx`
- `frontend/bejir/apps/web/features/webgis/components/webgis-workspace.tsx`

## Next Recommended Task

- Apabila backend menambahkan endpoint gerakan tanah atau time-series kecamatan, mulai dari **OPT-001** atau **OPT-002** dengan membaca `AI_PROJECT_CONTEXT.md` terlebih dahulu.
