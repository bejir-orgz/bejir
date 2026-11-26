# AI Implementation Workflow: SIBAJAWA UI/UX Redesign & Motion Engineering

Dokumen ini adalah panduan teknis, arah kreatif, hasil audit, dan daftar tugas atomik utama untuk pengembangan frontend **SIBAJAWA (Bejir WebGIS)**. Seluruh keputusan desain dan arsitektur telah ditetapkan di sini sehingga model AI penerus dapat langsung mengeksekusi task secara presisi tanpa mengulang audit atau menebak arah desain.

## 1. Project Overview

SIBAJAWA adalah platform WebGIS kebencanaan banjir untuk Provinsi Jawa Barat yang mengintegrasikan data historis kejadian banjir (2008 sampai tahun berjalan), distribusi curah hujan, parameter spasial 627 kecamatan (elevasi DEM, tutupan lahan, kelas kerawanan banjir), jaringan sungai (~114.000 segmen), lokasi serta rute evakuasi terdekat, dan asisten AI kontekstual ("Aji").

Tujuan transformasi ini adalah mengubah SIBAJAWA dari aplikasi dashboard akademis yang terasa kaku dan pasif menjadi produk eksplorasi geospasial yang hidup, interaktif, jernih secara visual, dan menyenangkan untuk dijelajahi tanpa mengorbankan kredibilitas data kebencanaan.

## 2. Current Architecture

Aplikasi frontend berada di `frontend/bejir/apps/web` menggunakan arsitektur berlapis berbasis domain:

- `app/`: Routing Next.js App Router (`/`, `/landing`, `/map`, `/histori-banjir`, `/curah-hujan`, `/analisis`) serta API proxy internal (`app/api/*`).
- `app/landing/_components/`: Komponen halaman beranda publik, ilustrasi lanskap sungai, animasi scroll, dan data ringkasan BNPB 2024.
- `components/layout/`: Header beranda (`site-header.tsx`) dan header aplikasi WebGIS (`webgis-header.tsx`).
- `components/ui/`: Primitif antarmuka berbasis shadcn/ui dan Radix UI (`button`, `card`, `chart`, `table`, `tabs`, `popover`, `dropdown-menu`, `sheet`, kalender, filter wilayah, dan filter kategori).
- `components/shared/`: Komponen lintas fitur (`data-table.tsx`, `table-sort-header.tsx`, `region-filter-popover.tsx`, `sibajwa-brand.tsx`).
- `features/map/`: Siklus hidup peta Leaflet (`interactive-map.tsx`) dan konfigurasi basemap OpenStreetMap Jawa Barat (`basemap.ts`).
- `features/webgis/`: Orkestrasi workspace peta (`webgis-workspace.tsx`, sidebar daerah, layer, legenda, timeline, panel overview) dan halaman `/analisis`.
- `features/geography/`, `features/rivers/`, `features/evacuation/`, `features/regions/`, `features/floods/`, `features/rainfall/`, `features/assistant/`: Modul domain masing-masing layer peta, pemrosesan data, grafik, tabel, dan asisten AI.
- `lib/`: Transport API, validasi skema, paginasi, dan kalkulasi perubahan tahunan (`year-over-year.ts`).

## 3. Existing Tech Stack

- **Runtime & Framework**: Next.js `16.3.8`, React `19.2.8`, TypeScript `5`
- **Styling**: Tailwind CSS `v4`, `tw-animate-css` `1.4.0`, CSS Modules selektif
- **Animasi**: `framer-motion` `14.6.0` (`LazyMotion` + `domAnimation`), CSS Transitions, CSS `@starting-style`, Web Animations / Canvas 2D
- **Komponen & Ikon**: `radix-ui` `1.8.1` (shadcn/ui pattern), `@tabler/icons-react` `3.49.0`
- **Peta & Spasial**: `leaflet` `1.9.4`, `jsts` `2.12.1`, GeoJSON Canvas & SVG renderers
- **Visualisasi Data**: `recharts` `3.8.0`, `@tanstack/react-table` `8.21.3`

Keputusan Stack: **Tidak perlu memasang library animasi atau peta baru** (seperti GSAP, Lottie, atau Three.js). Kombinasi `framer-motion` `14.6.0`, CSS custom properties, SVG/Canvas 2D, dan Leaflet sudah sangat mumpuni, ringan, dan menjaga ukuran bundle tetap ramping.

## 4. Current UI/UX Assessment

Audit dilakukan langsung terhadap source code `apps/web` dan inspeksi browser pada https://sibajawa.vercel.app/ (desktop `1440x900` dan seluler `390x844`).

### A. Kritik Desain Visual

1. **Bug Kritis Konten Menghilang pada Landing Page (`landing-motion.tsx:37`)**:
   - `MotionReveal` memasang `animate="hidden"` bersamaan dengan `whileInView="visible"` tanpa `viewport={{ once: true }}`. Akibatnya, seluruh seksi di luar irisan viewport langsung disembunyikan kembali (`opacity: 0, y: 28`), menyisakan ruang putih kosong saat pengguna menggulir naik-turun atau melompat lewat tautan jangkar.
2. **Pola Template Berulang pada Landing Page (`landing-page.tsx`, `landing.module.css`)**:
   - Setiap seksi mengulang rumus identik: kotak nomor `01` s.d. `05` bergaris tipis horizontal (`sectionLabel::after`), judul dua baris dengan baris kedua selalu abu-abu `#737373`, dan tiga kartu fitur seragam berisi bangun CSS abstrak (`<i>`, `<b>`, `<em>`) yang tidak merepresentasikan antarmuka WebGIS sesungguhnya.
   - Terdapat lebih dari 25 baris CSS mati di `landing.module.css` (`.mapFrame`, `.mapToolbar`, `.cityChoices`, `.mapBody`) sisa komponen lama yang sudah tidak dipakai.
3. **Kesan Pertama Peta `/map` Terlalu Kosong dan Dingin (`webgis-workspace.tsx`, `interactive-map.tsx`)**:
   - Saat `/map` dibuka, seluruh panel tertutup dan pengguna hanya disuguhi peta dasar OSM polos dengan 4 tombol ikon tanpa label teks di sisi kiri dan 1 tombol ikon di sisi kanan. Tidak ada petunjuk cepat layer apa saja yang tersedia atau cara mulai mengeksplorasi.
4. **Bug Visual & Hierarki pada Halaman Dashboard (`/histori-banjir`, `/curah-hujan`, `/analisis`)**:
   - **Konflik Warna Badge Korban (`history-charts.tsx:26`)**: Pada kartu Distribusi Korban, baris `Hilang` menggunakan selektor Tailwind `[&_b]:bg-[#ffdddd]` dan kondisional `[&_b]:bg-[#fef9c2]` dengan spesifisitas setara, sehingga pil persentase `Hilang` tetap berwarna merah muda `#ffdddd` alih-alih kuning `#fef9c2`.
   - **Sumbu Y Timeline Banjir Gepeng (`history-charts.tsx:41`)**: Nilai `domain={[0, 300]}` dikunci statis. Ketika data tahun berjalan memiliki puncak sekitar 25 kejadian per bulan, kurva menempel rata di dasar grafik dan menyisakan 90% ruang kosong.
   - **Grafik Frekuensi Banjir Terpotong (`analysis-charts.tsx:13-22`)**: Tinggi tetap `h-[258px]` untuk 10 batang horizontal menyebabkan batang ke-10 (`Kota Depok` / kabupaten urutan bawah) terpotong keluar batas bawah saat nama kabupaten membungkus menjadi dua baris pada layar sempit/menengah.
   - **Tabel Data Terlalu Datar (`rainfall-table.tsx`, `analysis-table.tsx`, `history-table.tsx`)**: Kolom `Klasifikasi` dan `Kerawanan` hanya menampilkan teks polos tanpa badge status semantik, angka tidak didampingi indikator proporsional, dan baris wilayah tidak menyediakan pintasan langsung untuk meninjau wilayah tersebut di `/map`.

### B. Evaluasi User Experience & Aksesibilitas

1. **Peringkat Daerah di Beranda Bersifat Pasif**: Daftar 5 daerah dengan banjir terbanyak di beranda tidak dapat diklik untuk langsung membuka wilayah tersebut pada peta interaktif atau melihat detail konteksnya.
2. **Transisi Data Tanpa Umpan Balik**: Saat pengguna mengganti tahun (`YearFilterButton`) atau wilayah (`RegionFilterPopover`), angka KPI dan grafik berubah mendadak tanpa transisi nilai atau indikator pemuatan yang halus, sehingga sulit menyadari metrik mana yang baru saja berubah.
3. **Panel AI Kosong Tanpa Panduan (`assistant.tsx`)**: Tab AI membuka ruang putih kosong dengan satu kotak input kecil `"Tanya Aji"`. Pengguna baru tidak tahu pertanyaan apa yang relevan atau bahwa mereka harus mengaktifkan layer sumber terlebih dahulu jika belum ada sumber terpilih.
4. **Kepadatan Header Seluler (`webgis-header.css:28-45`)**: Pada lebar `390px`, baris atas memadatkan logo, subjudul panjang, input pencarian, dan tombol Beranda sekaligus, serta Chrome DevTools mencatat peringatan `input` pencarian tanpa atribut `id`/`name`.
5. **Tombol Tanpa Umpan Balik Tekan (`button.tsx`)**: Menggunakan `transition-all` (anti-pattern performa) dan belum memiliki respons taktil `:active` (`scale(0.97)`).

### C. Animation Opportunity Audit

Setiap kandidat telah disaring melalui kerangka keputusan 4 tahap (Frekuensi, Tujuan UX, Kecepatan/Budget, dan Fungsi Data):

| Prioritas | ID | Lokasi & Komponen | Kondisi Saat Ini | Masalah / Peluang UX | Ide Animasi & Interaksi | Hasil Visual yang Diharapkan | Teknologi | Kompleksitas | Dampak UX & Performa |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | AO-01 | `landing-motion.tsx` (`MotionReveal`) | `animate="hidden"` tanpa `once: true` membuat seksi hilang saat keluar viewport | Konten halaman hilang dan berkedip berulang saat scroll | Perbaiki siklus reveal satu arah (`once: true`), gunakan transform string terakselerasi GPU dan fallback aman | Setiap seksi muncul mulus satu kali dengan stagger 60ms dan tetap terlihat permanen | Framer Motion (`LazyMotion`) + CSS | Rendah | Sangat tinggi; nol layout shift, 60fps |
| **P0** | AO-02 | `features/rivers/river-layer.tsx` & `/map` (`Living River Flow`) | Garis sungai statis `#0284c7` di atas peta | Sulit menangkap karakter hidrologis jaringan sungai | Tambahkan aliran arus hidrologis halus (animated dash flow overlay pada segmen sungai utama saat zoom memadai) dengan opsi jeda otomatis pada `reduced-motion` | Jaringan sungai tampak mengalir lembut di atas peta tanpa mengaburkan batas administrasi | Leaflet SVG/Canvas overlay + CSS animation | Sedang | Tinggi; dibatasi jumlah segmen/viewport agar tetap 60fps |
| **P0** | AO-03 | `features/webgis/components/` (`HydroTerrainSimulator`) | Belum ada simulasi visual genangan banjir & longsor edukatif | Pengguna belum bisa memahami hubungan curah hujan, elevasi rendah (banjir), dan lereng curam (longsor) | Buat panel interaktif **Simulasi Edukatif Hidro-Geologi** berlabel tegas `"Simulasi Edukatif · Bukan Kondisi Aktual"` dengan slider intensitas hujan yang menggerakkan tinggi muka air bergelombang (dataran rendah) & simulasi geseran material lereng (dataran tinggi) | Eksplorasi visual hidup yang membedakan banjir cekungan sungai vs kerentanan lereng sesuai elevasi wilayah terpilih | React + SVG/CSS Keyframes + `framer-motion` | Sedang | Sangat tinggi untuk storytelling edukatif; terisolasi di komponen mandiri |
| **P0** | AO-04 | `app/landing/_components/` (`InteractiveLayerPreview`) | 3 kartu fitur statis berisi elemen CSS dekoratif | Pengunjung belum merasakan cara kerja multi-layer WebGIS sebelum masuk `/map` | Ganti ilustrasi abstrak dengan penjelajah interaktif **Eksplorasi Layer & Wilayah Jawa Barat** (pilih layer Hujan/Sungai/Elevasi/Kerawanan/Evakuasi + klik 5 daerah tertinggi langsung terhubung ke `/map`) | Pratinjau interaktif responsif dengan transisi layer halus 220ms dan umpan balik instan | React + `framer-motion` + CSS transitions | Sedang | Sangat tinggi; mengubah pembaca pasif menjadi penjelajah aktif |
| **P1** | AO-05 | `evacuation-layer.tsx` & `evacuation-routing.tsx` | Titik evakuasi 5px nyaris tak terlihat; garis rute muncul mendadak | Sulit mengenali titik evakuasi dan arah rute saat klik peta | Perjelas marker titik evakuasi dengan cincin kontras + efek hover/fokus, animasi gambar garis rute (`stroke-dashoffset`), beacon asal-tujuan, dan kartu ringkasan jarak/waktu | Saat pengguna mengklik peta pada mode evakuasi, rute tergambar mulus menuju titik evakuasi terdekat | Leaflet SVG Polyline + CSS transition | Sedang | Tinggi; memperjelas fitur paling aplikatif di `/map` |
| **P1** | AO-06 | `interactive-map.tsx` & `boundary-layer.tsx` & `webgis-workspace.tsx` | Pindah wilayah melompat kaku; belum ada bilah cepat layer aktif di kanvas peta | Orientasi spasial terputus saat ganti wilayah; kontrol layer tersembunyi di balik ikon | Gunakan `flyToBounds` berdurasi terukur (nonaktif jika `reduced-motion`), tambahkan **Quick Layer Bar** mengambang di atas peta dengan indikator jumlah aktif & cuplikan warna | Kamera peta bergerak mulus ke kabupaten/kecamatan terpilih; pengguna dapat menyalakan layer dalam 1 klik | Leaflet `flyToBounds` + CSS transitions | Rendah | Tinggi; memperbaiki alur utama `/map` |
| **P1** | AO-07 | `/histori-banjir`, `/curah-hujan`, `/analisis` (`AnimatedMetric` & Charts) | Angka KPI statis, grafik `isAnimationActive={false}`, sumbu Y & tinggi bar bermasalah | Perubahan tahun/wilayah tidak terasa hidup dan beberapa grafik terpotong/gepeng | Tambahkan interpolasi angka cepat (`450ms ease-out`) pada kartu metrik saat nilai berubah, perbaiki sumbu Y dinamis, tinggi chart frekuensi, warna badge `Hilang`, dan transisi bar/area | Dashboard terasa responsif dan akurat secara proporsi saat pengguna membandingkan tahun atau daerah | `framer-motion` (`animate`) + Recharts + CSS | Sedang | Tinggi; meningkatkan keterbacaan data |
| **P2** | AO-08 | `rainfall-table.tsx`, `analysis-table.tsx`, `history-table.tsx` | Kolom klasifikasi/kerawanan teks polos, tidak ada aksi lintas halaman ke peta | Sulit memindai tingkat risiko secara cepat di tabel dan melompat ke peta | Tambahkan badge warna semantik resmi, batang proporsi mikro pada angka utama, highlight baris halus, dan tautan cepat lihat wilayah di `/map` | Tabel mudah dipindai dalam satu tatapan dan terhubung langsung dengan eksplorasi peta | Tailwind CSS + komponen shared | Rendah | Menengah-Tinggi; nol beban performa |
| **P2** | AO-09 | `components/ui/button.tsx`, `webgis-header.tsx`, `overview-button.tsx`, `assistant.tsx` | `transition-all`, tanpa `:active` scale, tab AI kosong saat awal | Kontrol terasa datar dan kurang responsif terhadap sentuhan/klik | Ganti `transition-all` dengan properti spesifik, tambahkan `:active` `scale(0.97)` (`150ms`), rapikan responsivitas header seluler, dan tambahkan kartu pertanyaan pemantik di asisten Aji | Seluruh tombol, tab, dan panel terasa presisi, cepat, dan ramah pengguna baru | CSS transitions + Tailwind v4 | Rendah | Menengah-Tinggi; meningkatkan kesan kualitas produk secara menyeluruh |

#### Kandidat Animasi yang Sengaja Ditolak (Rejected Candidates)

- **Animasi pengetikan karakter per huruf pada judul atau pencarian daerah (`RegionSearch` / `Input`)**: Ditolak. Aksi pencarian berbasis papan ketik dilakukan puluhan kali; penundaan animasi membuat input terasa lambat.
- **Efek paralaks kursor 3D pada tabel dan grafik analitik (`/analisis`, `/curah-hujan`)**: Ditolak. Data yang sedang dibaca dan dibandingkan tidak boleh bergerak mengikuti mouse karena mengganggu akurasi pembacaan sumbu.
- **Denyut merah berkedip tanpa henti pada seluruh poligon kerawanan tinggi**: Ditolak. Melanggar prinsip kejujuran data kebencanaan (memberi kesan alarm bencana aktif padahal data merupakan kelas kerawanan spasial) serta melelahkan mata.

## 5. Final Creative Direction

### Design Read & Liveliness Dials

- **Landing Page (`/` & `/landing`)**: Halaman cerita publik kebencanaan Jawa Barat untuk warga, mahasiswa, dan pemangku kebijakan, bergaya **Editorial Hydrological Atlas**, dial **ENERGY 2 / RHYTHM 3 / MOTION 2**.
- **WebGIS & Analytical Dashboards (`/map`, `/histori-banjir`, `/curah-hujan`, `/analisis`)**: Ruang kerja eksplorasi geospasial dan data kebencanaan, bergaya **Living Cartographic Instrument**, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

### Filosofi & Kepribadian Visual: "Living Hydrological Atlas"

SIBAJAWA memadukan **ketenangan instrumen kartografi modern** dengan **kehangatan cerita bentang alam Jawa Barat** (sungai, cekungan dataran rendah, dan perbukitan vulkanik). Antarmuka terasa terang, jernih, tangkas, sedikit ekspresif pada momen edukatif, tetapi tetap disiplin dan jujur saat menyajikan angka serta peta.

### Tiga Konsep Kreatif Utama

1. **Concept 1: Living Disaster Map (`/map`)**:
   - Peta memiliki bilah akses cepat layer di bagian atas sehingga pengguna langsung terdorong mencoba layer **Curah Hujan**, **Kerawanan Banjir**, **Jaringan Sungai**, **DEM**, **Tutupan Lahan**, dan **Titik Evakuasi**.
   - Layer sungai menampilkan animasi aliran arus hidrologis yang halus; mode evakuasi menggambar rute secara progresif dengan penanda asal-tujuan yang jelas; perpindahan wilayah menggunakan kamera `flyToBounds` yang mulus.
   - Dilengkapi **Simulasi Edukatif Hidro-Geologi** (Banjir Cekungan & Pergerakan Lereng/Longsor) yang terpisah secara visual dan berlabel eksplisit sebagai simulasi pembelajaran konsep, bukan kejadian aktual.
2. **Concept 2: Data Storytelling (`/` & Dashboards)**:
   - Di halaman beranda, pengunjung dapat mengklik langsung 5 daerah banjir tertinggi BNPB atau mengganti layer pada modul pratinjau interaktif untuk melihat bagaimana hujan, elevasi, sungai, dan kerawanan saling terhubung sebelum membuka `/map`.
   - Di halaman dashboard, pergantian tahun dan wilayah menggerakkan angka metrik serta proporsi grafik secara terukur, dilengkapi badge klasifikasi semantik dan bar proporsional di dalam tabel.
3. **Concept 3: Delightful Interactions (Global Micro-Polish)**:
   - Setiap tombol memberikan respons tekan `scale(0.97)` dalam `150ms`; panel samping peta meluncur mulus dengan kurva drawer `cubic-bezier(0.32, 0.72, 0, 1)`; asisten AI "Aji" menyambut pengguna dengan chip pertanyaan kontekstual siap klik.

## 6. Design System Decisions (Alasan Satu Kalimat per Keputusan)

1. **Palet Warna Terang Berbasis Air & Kertas Peta (`#FFFFFF`, `#F4F8FD`, `#2B7FFF`, `#172554`)**: Permukaan terang menjaga keterbacaan peta OSM, tabel kepadatan tinggi, dan lima warna klasifikasi kerawanan tanpa mendistorsi kontras warna ilmiah.
2. **Pertahankan 5 Warna Status Resmi (`#3CFF00` s.d. `#FF0000` dengan teks `#111111`)**: Konsistensi warna antara peta, legenda, grafik, dan badge tabel mencegah salah tafsir tingkat kerawanan banjir dan reklasifikasi hujan.
3. **Tipografi Tunggal `Google Sans Flex` dengan `tabular-nums` pada Angka**: Satu keluarga huruf variabel menjaga kesatuan antara narasi editorial di beranda dan ketepatan perataan kolom angka di tabel serta metrik dashboard.
4. **Variasi Ritme Seksi Tanpa Nomor Indeks Template (`01`..`05`)**: Menghapus kotak nomor dekoratif `01`..`05` di beranda membuat hierarki ditentukan oleh kontras ukuran judul, komposisi asimetris, dan komponen interaktif nyata.
5. **Batas Permukaan Tegas & Elevasi Selektif**: Panel mengambang di atas peta menggunakan garis batas halus dan pemisahan bidang bersih agar informasi geospasial di bawahnya tetap tajam dan tidak tertutup kabut blur berlebihan.
6. **Ikonografi `@tabler/icons-react` Fungsional**: Setiap ikon mendampingi tindakan atau kategori data nyata (sungai, hujan, rute evakuasi, fasilitas terdampak), tanpa ikon dekoratif generik.

## 7. Animation Guidelines

Token motion global ditambahkan pada `apps/web/app/globals.css`:

- `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)` untuk elemen masuk, umpan balik tekan, popover, dan angka metrik.
- `--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1)` untuk perpindahan indikator/morphing di layar.
- `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` untuk panel samping peta dan sheet navigasi.

Aturan wajib:

1. **Batas Durasi UI**: Tekan tombol `140ms`, hover/fokus `150ms`, dropdown/popover `180ms`, drawer/panel peta `280ms`, interpolasi angka metrik `450ms`, reveal seksi beranda `550ms` (stagger `60ms`).
2. **Properti Terakselerasi**: Hanya animasikan `transform`, `opacity`, `clip-path`, atau `stroke-dashoffset`. Dilarang menggunakan `transition: all` atau `scale(0)` (mulai dari `scale(0.96)` + `opacity: 0`).
3. **Reduced Motion & Pointer Gating**:
   - Pada `@media (prefers-reduced-motion: reduce)` atau `useReducedMotion() === true`, hentikan translasi posisi, animasi arus berulang, dan terbang kamera peta; pertahankan perubahan `opacity`/warna singkat agar pergantian status tetap terbaca.
   - Semua transformasi `:hover` dibungkus `@media (hover: hover) and (pointer: fine)` agar perangkat sentuh tidak mengalami hover lengket.
4. **Aturan Simulasi lebih dari 5 Detik**: Animasi berulang pada modul simulasi edukatif atau aliran sungai wajib memiliki kontrol jeda/nonaktif yang jelas dan langsung berhenti saat tab tidak aktif atau `reduced-motion` menyala.

## 8. Component Architecture

### Komponen yang Diperbarui

- `apps/web/app/globals.css`: Token kurva motion, utilitas fokus/interaksi, aturan `prefers-reduced-motion` yang ramah pemahaman state, serta animasi aliran garis peta (`.gis-river-flow`, `.gis-route-path`, `.gis-evac-pulse`).
- `apps/web/components/ui/button.tsx`: Mengganti `transition-all` menjadi transisi spesifik (`transform`, `background-color`, `border-color`, `color`, `opacity`) + umpan balik `:active` `scale-[0.97]`.
- `apps/web/app/landing/_components/landing-motion.tsx`, `landing-page.tsx`, `landing.module.css`: Perbaikan bug `MotionReveal`, penghapusan pola template nomor `01..05` dan CSS mati, peningkatan interaktivitas daftar 5 daerah banjir, serta integrasi komponen penjelajah layer interaktif.
- `apps/web/components/layout/webgis-header.tsx` & `webgis-header.css` & `features/regions/region-search.tsx`: Perbaikan atribut `id`/`name` form pencarian, perapian tata letak mobile `<640px`, dan penghalusan transisi pil navigasi aktif.
- `apps/web/features/webgis/components/webgis-workspace.tsx`, `interactive-map.tsx`, `boundary-layer.tsx`: Penambahan bilah cepat layer aktif (`MapQuickBar`) + tombol buka simulasi edukatif, penghalusan `flyToBounds`, serta peningkatan keterbacaan status peta.
- `apps/web/features/rivers/river-layer.tsx`, `features/evacuation/evacuation-layer.tsx`, `features/evacuation/evacuation-routing.tsx`, `features/geography/thematic-layers.tsx`: Animasi aliran sungai terkontrol, highlight hover kecamatan dengan tooltip terstruktur, marker evakuasi yang jelas, dan animasi garis rute evakuasi beserta tombol hapus rute.
- `apps/web/features/floods/components/history-charts.tsx`, `history-page.tsx`, `history-table.tsx`: Perbaikan warna badge `Hilang`, domain Y dinamis pada `TimelineChart`, metrik teranimasi, dan peningkatan visual tabel.
- `apps/web/features/rainfall/components/rainfall-page.tsx`, `rainfall-chart.tsx`, `rainfall-table.tsx`: Metrik teranimasi, badge warna klasifikasi pada tabel, dan bar proporsi curah hujan.
- `apps/web/features/webgis/components/analysis-page.tsx`, `analysis-charts.tsx`, `analysis-table.tsx`: Perbaikan tinggi `FrequencyChart` agar 10 daerah tidak terpotong, empty state yang informatif saat data kosong, badge kerawanan semantik, dan tautan cepat wilayah ke `/map`.
- `apps/web/features/assistant/components/assistant.tsx`: Empty state interaktif dengan chip pertanyaan pemantik berbasis layer aktif dan indikator loading yang jelas.

### Komponen Baru yang Dibuat

1. `apps/web/app/landing/_components/interactive-atlas-preview.tsx`: Komponen interaktif di halaman beranda ("One Live Thing") untuk mencoba 5 layer geospasial Jawa Barat dan menjelajahi 5 kabupaten banjir tertinggi dengan tautan langsung ke `/map`.
2. `apps/web/components/shared/animated-metric-value.tsx`: Komponen ringan untuk menginterpolasi nilai metrik berformat teks Indonesia (`"97.321 unit"`, `"262,2 mm"`, `"616.694 jiwa"`, `"—"`), tetap mempertahankan teks asli untuk pembaca layar dan langsung tampil instan saat `reduced-motion`.
3. `apps/web/components/shared/status-pill.tsx`: Komponen badge semantik bersama untuk kelas kerawanan/klasifikasi (`Sangat Rendah` s.d. `Sangat Tinggi`) dengan warna resmi `DESIGN.md` dan teks kontras tinggi `#111111`.
4. `apps/web/features/webgis/components/hydro-simulation-panel.tsx`: Panel/drawer simulasi edukatif **Banjir Cekungan & Stabilitas Lereng (Longsor)** di `/map` dengan slider curah hujan simulasi, tombol jeda animasi, pembacaan elevasi wilayah terpilih, dan label tegas `"Simulasi Edukatif · Bukan Kondisi Aktual"`.
5. `apps/web/features/webgis/components/map-quick-bar.tsx`: Bilah akses cepat layer peta dan pembuka mode simulasi edukatif di atas kanvas `/map`.

## 9. Implementation Roadmap

- **Phase 1: Design & Motion Foundation (`UI-001`, `UI-002`)**
  - Token motion global, aturan `prefers-reduced-motion`, perbaikan primitif `Button`, komponen bersama `AnimatedMetricValue` dan `StatusPill`, serta perbaikan header/pencarian WebGIS.
- **Phase 2: Landing Page Redesign & Interactive Storytelling (`UI-003`, `UI-004`)**
  - Perbaikan bug kritis `MotionReveal`, pembersihan pola template dan CSS mati, pembuatan `InteractiveAtlasPreview`, serta tautan interaktif 5 wilayah banjir terbanyak ke `/map`.
- **Phase 3: Living Disaster Map & Educational Simulation (`UI-005`, `UI-006`, `UI-007`)**
  - Bilah cepat layer (`MapQuickBar`), kamera `flyToBounds` halus, aliran arus jaringan sungai (`RiverLayer`), highlight kecamatan (`ThematicLayers`), peningkatan marker dan animasi rute evakuasi (`EvacuationLayer`, `EvacuationRouting`), serta `HydroSimulationPanel` (simulasi edukatif banjir & longsor).
- **Phase 4: Analytical Dashboards & Data Storytelling (`UI-008`, `UI-009`, `UI-010`)**
  - Perbaikan bug grafik dan peningkatan animasi data serta tabel pada `/histori-banjir`, `/curah-hujan`, dan `/analisis`.
- **Phase 5: Assistant UX & Global Polish (`UI-011`)**
  - Empty state interaktif dengan starter prompts pada asisten AI "Aji" (`BejirAssistant`) dan polesan akhir mikro-interaksi panel.
- **Phase 6: Quality Assurance & Verification (`UI-012`)**
  - Eksekusi seluruh unit test (`*.test.mjs`), `eslint`, `next build`, serta verifikasi multi-viewport (`1440px`, `768px`, `390px`), konsol, keyboard, dan `prefers-reduced-motion` melalui Chrome DevTools.

## 10. Atomic Task List

### Task ID: UI-001
- **Task Name**: Motion Tokens, Reduced-Motion System, and Shared UI Primitives
- **Priority**: P0
- **Objective**: Membangun fondasi kurva animasi standar, umpan balik tekan tombol yang presisi, serta komponen bersama `AnimatedMetricValue` dan `StatusPill`.
- **Files to Inspect**: `apps/web/app/globals.css`, `apps/web/components/ui/button.tsx`, `DESIGN.md`
- **Files to Modify**: `apps/web/app/globals.css`, `apps/web/components/ui/button.tsx`, `apps/web/components/shared/animated-metric-value.tsx` (baru), `apps/web/components/shared/status-pill.tsx` (baru)
- **Current Condition**: `globals.css` belum memiliki variabel kurva motion dan mematikan seluruh transisi secara kasar pada `prefers-reduced-motion`; `button.tsx` memakai `transition-all` tanpa efek `:active`; belum ada komponen angka teranimasi maupun pill status lintas tabel.
- **Expected Result**: Variabel `--ease-out-strong`, `--ease-in-out-strong`, dan `--ease-drawer` tersedia global; `Button` memakai transisi properti spesifik dan `active:scale-[0.97]`; `AnimatedMetricValue` dapat menganimasikan angka berformat Indonesia dengan aman; `StatusPill` menampilkan 5 kelas status resmi secara konsisten.
- **Implementation Instructions**:
  1. Tambahkan `--ease-out-strong`, `--ease-in-out-strong`, `--ease-drawer`, serta keyframes utilitas peta (`.gis-river-flow`, `.gis-route-flow`) ke `apps/web/app/globals.css` dengan penanganan `@media (prefers-reduced-motion: reduce)` yang menghentikan gerak spasial namun menjaga keterbacaan state.
  2. Di `apps/web/components/ui/button.tsx`, ganti `transition-all` menjadi `transition-[transform,background-color,border-color,color,opacity] duration-150 ease-[var(--ease-out-strong)] active:scale-[0.97] motion-reduce:active:scale-100`.
  3. Buat `apps/web/components/shared/status-pill.tsx` yang memetakan `"Sangat Rendah"` s.d. `"Sangat Tinggi"` ke token `--status-*` dengan teks `#111111`, border tipis, dan titik indikator kontras.
  4. Buat `apps/web/components/shared/animated-metric-value.tsx` yang mengekstrak angka utama serta sufiks satuan (misal `"97.321 unit"` atau `"262,2 mm"`), menganimasikannya dari nilai sebelumnya ke nilai baru menggunakan `animate` dari `framer-motion` selama `450ms`, dan langsung merender string asli bila `"—"` atau `useReducedMotion()` bernilai `true`.
- **Animation Specification**:
  - Trigger: `:active` pada tombol; perubahan prop `value` pada `AnimatedMetricValue`.
  - Initial/Final state: Tombol `scale(1)` ke `scale(0.97)`; angka metrik interpolasi numerik ke target.
  - Duration & Easing: Tombol `150ms cubic-bezier(0.23, 1, 0.32, 1)`; angka `450ms easeOut`.
  - Stagger: Tidak ada.
  - Interaction behavior: Dapat diinterupsi kapan saja tanpa lompatan layout.
- **Constraints**: Pertahankan seluruh varian ukuran dan warna `Button` sesuai `DESIGN.md`; jangan merusak kontras fokus keyboard.
- **Acceptance Criteria**: Seluruh tombol memiliki respons tekan halus tanpa `transition-all`; `AnimatedMetricValue` merender nilai `"—"` tanpa error NaN; `StatusPill` menampilkan teks dan warna yang tepat untuk ke-5 kelas.
- **Testing Instructions**: Jalankan `npm run lint` dari `apps/web` dan periksa render komponen.
- **Dependencies**: Tidak ada.

### Task ID: UI-002
- **Task Name**: WebGIS Header, Region Search Accessibility, and Mobile Shell Refinement
- **Priority**: P1
- **Objective**: Memperbaiki peringatan aksesibilitas input pencarian di konsol, merapikan tata letak header WebGIS pada layar ponsel (`390px`), dan memperhalus umpan balik navigasi antarhalaman.
- **Files to Inspect**: `apps/web/components/layout/webgis-header.tsx`, `apps/web/components/layout/webgis-header.css`, `apps/web/features/regions/region-search.tsx`, `apps/web/features/floods/components/history-filters.tsx`, `apps/web/features/rainfall/components/rainfall-filters.tsx`, `apps/web/features/webgis/components/analysis-filters.tsx`, `apps/web/features/webgis/components/region-sidebar.tsx`
- **Files to Modify**: Berkas pada daftar *Files to Inspect* di atas.
- **Current Condition**: DevTools mencatat peringatan `A form field element should have an id or name attribute` pada input pencarian; pada lebar `390px`, subjudul panjang dan tombol Beranda berdesakan di baris pertama `WebgisHeader`; warna teks input pencarian di beberapa filter tertulis `text-neutral-400` sehingga teks yang diketik terlihat pudar.
- **Expected Result**: Seluruh input pencarian memiliki atribut `name` yang valid dan warna teks ketikan tajam (`text-neutral-900` dengan `placeholder:text-neutral-400`); header WebGIS di layar `<640px` tampil proporsional, rapi, dan nyaman disentuh (`min-h` target memadai).
- **Implementation Instructions**:
  1. Tambahkan atribut `name="region-query"` atau `id` unik pada `<Input>` di `region-search.tsx`, `region-sidebar.tsx`, `history-filters.tsx`, `rainfall-filters.tsx`, dan `analysis-filters.tsx`.
  2. Ubah warna teks aktif input pencarian pada bar filter dari `text-neutral-400` menjadi `text-neutral-900` agar teks yang diketik memenuhi standar kontras WCAG AA (`>4.5:1`), sambil mempertahankan `placeholder:text-neutral-400`.
  3. Di `webgis-header.css`, sembunyikan subjudul kecil `.gis-brand small` pada layar sangat sempit (`max-width: 520px`) agar ruang baris atas lega untuk merek `SIBAJAWA`, input pencarian daerah, dan tombol `Beranda`, serta tambahkan transisi warna/latar halus `160ms` pada `.gis-nav-link`.
- **Animation Specification**:
  - Trigger: Hover/fokus pada tautan navigasi dan fokus pada kotak pencarian.
  - Initial/Final state: Transisi latar, border, dan warna teks.
  - Duration & Easing: `160ms cubic-bezier(0.23, 1, 0.32, 1)`.
  - Stagger: Tidak ada.
  - Interaction behavior: Respons instan tanpa menggeser lebar kontainer.
- **Constraints**: Pertahankan struktur link `webgisNavigation` dan perilaku `onRegionSelect` menuju `/map?region=...`.
- **Acceptance Criteria**: Peringatan form field tanpa `id`/`name` hilang di DevTools; teks pencarian terbaca jelas; header pada `390px` tidak tumpang tindih atau memotong teks penting.
- **Testing Instructions**: Periksa tampilan `390x844` dan `1440x900` serta panel Issues/Console di Chrome DevTools.
- **Dependencies**: `UI-001`.

### Task ID: UI-003
- **Task Name**: Fix Landing Page Scroll Reveal Bug and Clean Template Tells
- **Priority**: P0
- **Objective**: Memperbaiki bug `MotionReveal` yang menyembunyikan konten beranda di produksi, menghapus nomor indeks template (`01..05`) serta CSS mati, dan menyempurnakan tipografi serta ritme visual beranda.
- **Files to Inspect**: `apps/web/app/landing/_components/landing-motion.tsx`, `apps/web/app/landing/_components/landing-page.tsx`, `apps/web/app/landing/_components/landing.module.css`
- **Files to Modify**: `apps/web/app/landing/_components/landing-motion.tsx`, `apps/web/app/landing/_components/landing-page.tsx`, `apps/web/app/landing/_components/landing.module.css`
- **Current Condition**: `MotionReveal` memasang `animate="hidden"` bersamaan dengan `whileInView="visible"` tanpa `once: true`, sehingga seksi menghilang saat keluar viewport; setiap seksi memakai kotak nomor `01..05` dan judul abu-abu separuh yang seragam; `landing.module.css` memuat puluhan baris aturan mati.
- **Expected Result**: Seluruh seksi beranda muncul satu kali secara mulus saat masuk layar dan tetap terlihat permanen (termasuk pada tangkapan layar halaman penuh dan navigasi jangkar); penomoran kotak `01..05` diganti label konteks bersih; aturan CSS mati dibersihkan.
- **Implementation Instructions**:
  1. Di `landing-motion.tsx`, perbaiki `MotionReveal` agar menggunakan `initial={{ opacity: 0, transform: "translateY(20px)" }}`, `whileInView={{ opacity: 1, transform: "translateY(0px)" }}`, dan `viewport={{ once: true, amount: 0.12 }}` (tanpa prop `animate="hidden"` yang menimpa state). Jika `useReducedMotion()` aktif, render tanpa pergeseran `translateY`.
  2. Batasi hover lift pada kartu (`@media (hover: hover) and (pointer: fine)` di CSS, bukan `whileHover={{ y: -4 }}` tanpa pengecekan pointer).
  3. Di `landing-page.tsx` dan `landing.module.css`, hapus elemen `<span className={styles.sectionIndex}>01..05</span>` dan garis `::after` template; variasikan penekanan judul agar tidak setiap `<h2>` membagi warna abu-abu dengan rumus yang sama; hapus blok CSS mati (`.mapFrame`, `.mapToolbar`, `.mapBody`, `.cityChoices`, `.cityMarker`, dll. yang tidak lagi direferensikan).
- **Animation Specification**:
  - Trigger: Elemen masuk 12% ke dalam viewport (`once: true`).
  - Initial state: `opacity: 0; transform: translateY(20px)`.
  - Final state: `opacity: 1; transform: translateY(0px)`.
  - Duration & Easing: `520ms cubic-bezier(0.23, 1, 0.32, 1)`.
  - Stagger: `60ms` s.d. `80ms` antar item dalam satu kelompok.
  - Interaction behavior: Hanya berjalan satu kali; tidak pernah menyembunyikan ulang konten yang sudah terlihat.
- **Constraints**: Pertahankan seluruh data BNPB 2024 dan tautan sumber PDF resmi (`floodSource`, `floodRankingSource`).
- **Acceptance Criteria**: Tangkapan layar penuh (`fullPage: true`) pada `/` menampilkan seluruh seksi secara utuh tanpa ruang putih kosong; scroll naik-turun tidak memicu kedipan ulang.
- **Testing Instructions**: Buka `/` di Chrome DevTools, gulir dari atas ke bawah lalu kembali ke atas, dan ambil full-page screenshot.
- **Dependencies**: `UI-001`.

### Task ID: UI-004
- **Task Name**: Interactive Hydrological Layer Explorer & Clickable Flood Ranking on Landing Page
- **Priority**: P0
- **Objective**: Menghadirkan satu pengalaman interaktif nyata di halaman beranda (`InteractiveAtlasPreview`) dan membuat daftar 5 daerah banjir terbanyak dapat dieksplorasi serta terhubung langsung ke `/map?region=<id>`.
- **Files to Inspect**: `apps/web/app/landing/_components/landing-page.tsx`, `apps/web/app/landing/_components/flood-data.ts`, `apps/web/features/regions/region-selection.tsx`
- **Files to Modify**: `apps/web/app/landing/_components/interactive-atlas-preview.tsx` (baru), `apps/web/app/landing/_components/landing-page.tsx`, `apps/web/app/landing/_components/landing.module.css`
- **Current Condition**: Daftar 5 daerah banjir terbanyak hanya berupa teks statis tanpa interaksi; seksi fitur hanya menampilkan 3 kartu abstrak tanpa memberi gambaran nyata cara kerja layer SIBAJAWA.
- **Expected Result**: Pengunjung dapat mengklik salah satu dari 5 daerah banjir tertinggi (Karawang, Bogor, Bandung, Cirebon, Bekasi) untuk memfokuskan informasi daerah tersebut atau langsung membukanya di `/map` menggunakan ID katalog yang cocok dari `useRegionSelection()`; seksi fitur dilengkapi penjelajah layer interaktif tempat pengguna menyalakan/membandingkan layer **Curah Hujan**, **Jaringan Sungai**, **Elevasi (DEM)**, **Kerawanan Banjir**, dan **Rute Evakuasi** beserta pratinjau visual kartografis dan penjelasan sumber datanya.
- **Implementation Instructions**:
  1. Buat `interactive-atlas-preview.tsx` (`"use client"`) yang membaca `tree` dari `useRegionSelection()` untuk mencocokkan nama kabupaten pada `topFloodRegions` dengan ID wilayah `/map` yang valid (fallback ke `/map` jika belum cocok).
  2. Sediakan 5 tombol tab layer interaktif (`Curah Hujan`, `Jaringan Sungai`, `Elevasi DEM`, `Kerawanan Banjir`, `Titik & Rute Evakuasi`) dengan visualisasi SVG peta skematik cekungan Jawa Barat berlapis yang merespons pilihan layer secara mulus (`opacity` dan `transform` `220ms`), lengkap dengan legenda nyata, metrik konteks, dan tombol `"Buka Layer Ini di WebGIS"`.
  3. Jadikan baris pada `5 daerah dengan banjir terbanyak` dapat diklik untuk menuju `/map?region=<matchedId>` dengan indikator hover/fokus yang jelas.
- **Animation Specification**:
  - Trigger: Klik tab layer atau pilih salah satu dari 5 daerah di beranda.
  - Initial/Final state: Layer SVG aktif bertransisi `opacity: 0.15 -> 1` dan `scale(0.985) -> scale(1)`; panel keterangan bertransisi `opacity: 0 -> 1`.
  - Duration & Easing: `220ms cubic-bezier(0.23, 1, 0.32, 1)`.
  - Stagger: `40ms` pada elemen indikator legenda.
  - Interaction behavior: Dapat diklik cepat berulang kali (interruptible CSS/Motion transitions) dan sepenuhnya dapat dioperasikan dengan tombol `Tab` serta `Enter`/`Space`.
- **Constraints**: Wajib memberi keterangan jelas bahwa pratinjau di beranda adalah ilustrasi konsep antarmuka berbasis parameter SIBAJAWA (sesuai `DESIGN.md` §9 & §14), sedangkan data observasi lengkap dibuka di `/map`.
- **Acceptance Criteria**: Seluruh 5 tab layer berfungsi lewat mouse maupun keyboard; klik daerah membawa pengguna ke `/map` dengan wilayah tersebut langsung terpilih dan batas wilayahnya dimuat.
- **Testing Instructions**: Klik tiap tab layer di `/` dan klik `"Kabupaten Bogor"` untuk memastikan `/map?region=...` terbuka dan memfokuskan Kabupaten Bogor.
- **Dependencies**: `UI-001`, `UI-003`.

### Task ID: UI-005
- **Task Name**: Disaster Map Quick Layer Bar, Smooth Camera FlyTo, and District Hover Inspector
- **Priority**: P0
- **Objective**: Menghidupkan kesan pertama halaman `/map` melalui bilah cepat pemilihan layer di atas kanvas peta, pergerakan kamera wilayah yang mulus (`flyToBounds`), dan highlight interaktif saat kursor menyentuh poligon kecamatan pada `ThematicLayers`.
- **Files to Inspect**: `apps/web/features/webgis/components/webgis-workspace.tsx`, `apps/web/features/map/components/interactive-map.tsx`, `apps/web/features/regions/boundary-layer.tsx`, `apps/web/features/geography/thematic-layers.tsx`
- **Files to Modify**: `apps/web/features/webgis/components/map-quick-bar.tsx` (baru), `apps/web/features/webgis/components/webgis-workspace.tsx`, `apps/web/features/map/components/interactive-map.tsx`, `apps/web/features/regions/boundary-layer.tsx`, `apps/web/features/geography/thematic-layers.tsx`
- **Current Condition**: Kanvas `/map` tampak kosong tanpa petunjuk saat pertama dibuka; perpindahan ke wilayah terpilih melompat tanpa animasi kamera terukur; poligon kecamatan tematik tidak memberikan highlight batas saat disentuh kursor.
- **Expected Result**: Bagian atas tengah peta memiliki `MapQuickBar` kompak yang menampilkan chip layer cepat (`Kerawanan Banjir`, `Curah Hujan`, `Jaringan Sungai`, `Titik Evakuasi`, dll.) serta tombol `Simulasi Edukatif`; memilih wilayah menggerakkan peta dengan `flyToBounds` berdurasi `0.65s` (instan jika `prefers-reduced-motion`); menyentuh kecamatan pada layer tematik menebalkan batasnya dan menampilkan kartu ringkas yang rapi.
- **Implementation Instructions**:
  1. Buat `map-quick-bar.tsx` yang menampilkan chip toggle untuk layer-layer utama `data.layers` beserta lencana jumlah aktif dan tombol pembuka panel `Simulasi Edukatif`. Pastikan pada layar sempit bilah ini dapat digulir horizontal dengan rapi tanpa menutupi tombol panel kiri/kanan.
  2. Di `boundary-layer.tsx` dan tombol reset di `interactive-map.tsx`, periksa `window.matchMedia("(prefers-reduced-motion: reduce)").matches`: gunakan `map.flyToBounds(..., { padding: [32, 32], duration: 0.65 })` jika motion diizinkan, atau `fitBounds(..., { animate: false })` jika reduced motion aktif.
  3. Di `thematic-layers.tsx`, tambahkan interaksi `mouseover` dan `mouseout` pada fitur GeoJSON untuk menonjolkan batas kecamatan aktif dan merapikan isi tooltip terstruktur (Nama Kecamatan, Nilai Parameter + Satuan, dan catatan periode).
- **Animation Specification**:
  - Trigger: Toggle chip layer, pilih daerah baru, atau hover poligon kecamatan.
  - Initial/Final state: Kamera peta interpolasi koordinat `0.65s`; chip aktif bertransisi warna/border `160ms`.
  - Duration & Easing: Kamera `650ms` ease-out Leaflet; chip UI `160ms cubic-bezier(0.23, 1, 0.32, 1)`.
  - Stagger: Tidak ada.
  - Interaction behavior: `flyToBounds` dibatalkan dengan bersih jika pengguna memilih daerah lain di tengah animasi.
- **Constraints**: Jangan mengubah skema query URL `?region=...` atau logika `panelReducer` yang diuji oleh `panel-state.test.mjs`.
- **Acceptance Criteria**: Pengguna dapat mengaktifkan/menonaktifkan layer langsung dari chip atas peta maupun dari `OptionsSidebar` secara sinkron; `panel-state.test.mjs` tetap lulus 100%.
- **Testing Instructions**: Buka `/map`, klik chip `Kerawanan Banjir` dan `Jaringan Sungai`, cari `"Kota Bogor"` di header, dan pastikan kamera bergerak mulus serta panel overview terbuka.
- **Dependencies**: `UI-001`, `UI-002`.

### Task ID: UI-006
- **Task Name**: Living River Flow & Animated Evacuation Markers and Routing
- **Priority**: P0
- **Objective**: Mengubah visualisasi `RiverLayer`, `EvacuationLayer`, dan `EvacuationRouting` di `/map` menjadi visualisasi geospasial yang hidup, jelas, dan informatif tanpa membebani performa ribuan segmen.
- **Files to Inspect**: `apps/web/features/rivers/river-layer.tsx`, `apps/web/features/evacuation/evacuation-layer.tsx`, `apps/web/features/evacuation/evacuation-routing.tsx`, `apps/web/app/globals.css`
- **Files to Modify**: `apps/web/features/rivers/river-layer.tsx`, `apps/web/features/evacuation/evacuation-layer.tsx`, `apps/web/features/evacuation/evacuation-routing.tsx`, `apps/web/app/globals.css`
- **Current Condition**: Sungai hanya berupa garis tipis statis; titik evakuasi berupa lingkaran putih kecil `radius: 5` yang tenggelam di atas basemap; rute evakuasi muncul seketika sebagai garis biru polos tanpa penanda tujuan atau tombol pembersih rute.
- **Expected Result**: Layer sungai merender garis dasar di Canvas (cepat untuk ribuan segmen) ditambah lapisan arus hidrologis mengalir (`stroke-dasharray` bergerak lembut) untuk segmen utama di viewport saat `reduced-motion` tidak aktif; titik evakuasi lebih jelas dengan kontras ganda dan umpan balik hover; saat peta diklik pada mode evakuasi, garis rute tergambar progresif menuju titik evakuasi terdekat lengkap dengan penanda titik awal, titik tujuan, serta petunjuk klik peta.
- **Implementation Instructions**:
  1. Di `river-layer.tsx`, pertahankan `L.canvas` untuk seluruh segmen agar ringan, dan tambahkan overlay SVG ringan (dibatasi maksimal 180 segmen terpanjang di viewport dan nonaktif bila `prefers-reduced-motion: reduce`) menggunakan kelas `.gis-river-flow` (`stroke-dasharray: 6 14`, animasi `stroke-dashoffset` linear lembut) sehingga sungai tampak hidup mengalir tanpa menurunkan frame rate.
  2. Di `evacuation-layer.tsx`, tingkatkan keterbacaan titik evakuasi (`radius: 6.5`, cincin luar biru tegas `#1d4ed8` `weight: 2`, isi putih `#ffffff` dengan titik inti atau perubahan ukuran/warna saat `mouseover`/`mouseout`) serta tooltip jelas berisi nama dan kategori lokasi.
  3. Di `evacuation-routing.tsx`, render garis dasar halo putih tipis di bawah garis rute utama berkelas `.gis-route-flow` yang menganimasikan kemunculan dan arah menuju titik evakuasi, tambahkan marker jelas pada titik awal dan titik tujuan evakuasi, serta tampilkan pesan petunjuk awal `"Mode Evakuasi aktif: klik titik mana saja di peta untuk menghitung rute terdekat"` saat belum ada titik diklik.
- **Animation Specification**:
  - Trigger: Mengaktifkan layer `Jaringan Sungai` atau mengklik peta saat layer `Titik Evakuasi` aktif.
  - Initial/Final state: Rute evakuasi masuk dengan animasi garis dan aliran arah; arus sungai bergerak kontinu pelan.
  - Duration & Easing: Masuk rute `450ms cubic-bezier(0.23, 1, 0.32, 1)`; aliran garis kontinu dengan kontrol otomatis berhenti pada `prefers-reduced-motion: reduce` atau saat layer dimatikan.
  - Stagger: Tidak ada.
  - Interaction behavior: AbortController membatalkan request rute sebelumnya jika pengguna mengklik titik baru secara cepat.
- **Constraints**: Pertahankan seluruh kontrak API `/backend/web/rivers/layers` dan `/api/v1/evacuation/routes`; pastikan semua unit test `rivers.test.mjs` dan `evacuation/api.test.mjs` tetap lulus.
- **Acceptance Criteria**: Layer sungai dan evakuasi tampil hidup pada 60fps, bersih saat layer dimatikan (cleanup sempurna tanpa kebocoran DOM/listener), dan menghormati `prefers-reduced-motion`.
- **Testing Instructions**: Aktifkan `Jaringan Sungai` dan `Titik Evakuasi` di `/map`, perbesar peta, klik satu lokasi di Jawa Barat, lalu matikan layer untuk memastikan seluruh elemen bersih.
- **Dependencies**: `UI-001`, `UI-005`.

### Task ID: UI-007
- **Task Name**: Educational Flood Inundation & Landslide Slope Simulator on Disaster Map
- **Priority**: P1
- **Objective**: Menyediakan modul interaktif **Simulasi Edukatif Hidro-Geologi** di `/map` untuk memvisualisasikan dinamika genangan banjir (dataran rendah/cekungan sungai) dan pergerakan material lereng/longsor (wilayah berelevasi tinggi/curam) secara jujur dan terpisah dari data observasi aktual.
- **Files to Inspect**: `apps/web/features/webgis/components/webgis-workspace.tsx`, `apps/web/features/webgis/components/overview-panel.tsx`, `DESIGN.md`
- **Files to Modify**: `apps/web/features/webgis/components/hydro-simulation-panel.tsx` (baru), `apps/web/features/webgis/components/webgis-workspace.tsx`
- **Current Condition**: Belum ada visualisasi dinamis yang menjelaskan mekanisme genangan banjir maupun longsor/ketidakstabilan lereng pada workspace peta.
- **Expected Result**: Pengguna dapat membuka panel **Simulasi Edukatif** dari `MapQuickBar` di `/map`. Panel ini memiliki lencana peringatan mencolok `"SIMULASI EDUKATIF · BUKAN KONDISI BENCANA AKTUAL"`, membaca konteks elevasi wilayah terpilih (jika ada, misal dari `overview.elevation`), menyediakan dua mode tab (**Genangan Banjir Cekungan** dan **Pergerakan Tanah / Lereng**), slider intensitas curah hujan simulasi (`20` s.d. `180 mm/hari`), tombol Jeda/Putar animasi (memenuhi aturan kontrol jeda untuk animasi >5 detik), serta penampang geografis SVG interaktif yang menganimasikan tinggi gelombang genangan, area terdampak, serta pergeseran lapisan tanah lereng.
- **Implementation Instructions**:
  1. Buat `hydro-simulation-panel.tsx` sebagai dialog/panel mengambang yang dapat ditutup dengan tombol `X` maupun tombol `Escape`.
  2. Sediakan dua tab simulasi:
     - **Tab Banjir Cekungan**: Penampang sungai & permukiman dataran rendah dengan tinggi muka air dinamis, riak gelombang SVG halus, indikator zona tergenang berdasarkan slider curah hujan simulasi, dan penjelasan faktor bobot AHP proyek (jarak sungai, lereng datar, curah hujan, elevasi HAND, tutupan lahan).
     - **Tab Longsor & Lereng**: Penampang lereng perbukitan dengan visualisasi jenuh air pori tanah, bidang gelincir, dan animasi pergerakan material tanah turun lereng saat intensitas hujan simulasi melewati ambang jenuh, disertai edukasi mengapa wilayah perbukitan Jawa Barat (seperti Bogor, Cianjur, Garut, Sukabumi) memiliki risiko turunan hidrometeorologi yang berbeda dari pantura.
  3. Tambahkan tombol **Jeda Animasi / Putar Animasi** dan otomatis mulai dalam kondisi dijeda bila `useReducedMotion()` bernilai `true`.
- **Animation Specification**:
  - Trigger: Membuka panel simulasi dan menggeser slider intensitas hujan simulasi atau mengganti tab Banjir/Lereng.
  - Initial/Final state: Panel muncul `opacity: 0, scale(0.96)` ke `opacity: 1, scale(1)`; ketinggian air dan posisi massa lereng bertransisi menggunakan `transform` (`translateY`, `translate`).
  - Duration & Easing: Buka/tutup panel `220ms cubic-bezier(0.23, 1, 0.32, 1)`; respons slider `280ms cubic-bezier(0.23, 1, 0.32, 1)`.
  - Stagger: Tidak ada.
  - Interaction behavior: Dapat ditutup dengan `Escape`, memiliki tombol jeda eksplisit, dan tidak pernah mengubah atau memalsukan angka pada `OverviewPanel`.
- **Constraints**: Wajib mematuhi aturan kejujuran data kebencanaan (`DESIGN.md` §13 dan `antislop` R-17/R-38): tidak boleh menaruh marker bencana palsu di atas peta nyata yang menyiratkan kejadian sedang berlangsung.
- **Acceptance Criteria**: Panel dapat dibuka/ditutup lewat klik dan `Escape`, kedua mode simulasi merespons slider secara mulus, tombol jeda menghentikan gerak gelombang/material, dan label `"Simulasi Edukatif · Bukan Kondisi Aktual"` selalu terlihat jelas.
- **Testing Instructions**: Buka `/map`, klik `Simulasi Edukatif`, uji slider pada kedua tab, uji tombol Jeda, dan tekan `Escape`.
- **Dependencies**: `UI-001`, `UI-005`.

### Task ID: UI-008
- **Task Name**: Fix & Enliven Flood History Dashboard (`/histori-banjir`)
- **Priority**: P0
- **Objective**: Memperbaiki bug warna badge `Hilang` dan sumbu Y `TimelineChart` yang gepeng pada `/histori-banjir`, mengaktifkan interpolasi angka metrik, serta meningkatkan keterbacaan visual grafik dan tabel histori.
- **Files to Inspect**: `apps/web/features/floods/components/history-page.tsx`, `apps/web/features/floods/components/history-charts.tsx`, `apps/web/features/floods/components/history-table.tsx`, `apps/web/features/floods/history.test.mjs`
- **Files to Modify**: `apps/web/features/floods/components/history-page.tsx`, `apps/web/features/floods/components/history-charts.tsx`, `apps/web/features/floods/components/history-table.tsx`
- **Current Condition**: Badge persentase `Hilang` berwarna merah muda `#ffdddd` karena konflik selektor Tailwind; `YAxis` pada `TimelineChart` dikunci `[0, 300]` sehingga data tahun berjalan tampak rata; angka metrik dan grafik berubah kaku tanpa transisi.
- **Expected Result**: Baris `Meninggal` memiliki badge merah muda `#fee2e2`/`#ffdddd` dan baris `Hilang` memiliki badge kuning `#fef9c2` secara konsisten; `TimelineChart` menyesuaikan skala puncak secara proporsional (`[0, (max) => Math.max(20, Math.ceil(max * 1.2))]`) sehingga pola musiman banjir bulanan langsung terbaca; kartu metrik menggunakan `AnimatedMetricValue`; tabel histori menampilkan highlight baris halus, badge jenis banjir yang rapi, dan indikator visual rumah terdampak.
- **Implementation Instructions**:
  1. Di `history-charts.tsx`, pisahkan kelas warna badge `<b>` secara eksplisit (`entry.kind === "missing" ? "bg-[#fef9c2] text-[#713f12]" : "bg-[#ffdddd] text-[#7f1d1d]"`) agar tidak saling menimpa.
  2. Ubah `YAxis` pada `TimelineChart` menjadi skala adaptif yang rapi (`domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.25))]}` dengan `allowDecimals={false}`), gunakan kurva `monotone` yang halus, dan aktifkan animasi Recharts yang cepat (`isAnimationActive={!reducedMotion}`, `animationDuration={420}`, `animationEasing="ease-out"`).
  3. Di `history-page.tsx`, gunakan `AnimatedMetricValue` pada nilai kartu `Total Kejadian Banjir`, `Total Rumah Terpendam`, dan `Total Korban`.
  4. Di `history-table.tsx`, tambahkan efek hover baris yang lembut (`hover:bg-blue-50/40 transition-colors`), badge halus pada `Jenis Banjir`, serta tautan ikon/teks ringkas pada nama `Kota/Kabupaten` atau gaya interaktif yang rapi tanpa merusak pengurutan kolom.
- **Animation Specification**:
  - Trigger: Pemuatan awal atau pergantian tahun/wilayah di header `/histori-banjir`.
  - Initial/Final state: Angka berinterpolasi `450ms`; kurva area dan donut bertransisi `420ms ease-out`.
  - Duration & Easing: `420ms` s.d. `450ms ease-out` (nonaktif otomatis jika `useReducedMotion()`).
  - Stagger: Tidak ada.
  - Interaction behavior: Filter tabel tetap instan tanpa penundaan ketikan.
- **Constraints**: Jangan mengubah pemisahan state `summaryYear` vs `tableYear` dan jangan mengubah logika `history-summary.ts` yang diuji oleh `history.test.mjs`.
- **Acceptance Criteria**: Badge `Hilang` berwarna kuning `#fef9c2`; kurva `Timeline Banjir` tahun 2026 maupun 2024 tampil proporsional; `node --test features/floods/history.test.mjs` lulus 100%.
- **Testing Instructions**: Buka `/histori-banjir`, ganti tahun `2026` ke `2024`, uji pencarian dan pengurutan tabel, serta jalankan unit test banjir.
- **Dependencies**: `UI-001`, `UI-002`.

### Task ID: UI-009
- **Task Name**: Enliven Rainfall Dashboard & Classification Table (`/curah-hujan`)
- **Priority**: P1
- **Objective**: Menghidupkan penyajian data curah hujan melalui metrik teranimasi, grafik batang bulanan yang responsif, badge klasifikasi berwarna semantik di tabel, dan bar proporsi curah hujan.
- **Files to Inspect**: `apps/web/features/rainfall/components/rainfall-page.tsx`, `apps/web/features/rainfall/components/rainfall-chart.tsx`, `apps/web/features/rainfall/components/rainfall-table.tsx`, `apps/web/features/rainfall/view.test.mjs`
- **Files to Modify**: `apps/web/features/rainfall/components/rainfall-page.tsx`, `apps/web/features/rainfall/components/rainfall-chart.tsx`, `apps/web/features/rainfall/components/rainfall-table.tsx`
- **Current Condition**: Metrik curah hujan dan grafik batang tidak bertransisi saat tahun/wilayah diganti; kolom `Klasifikasi` pada tabel hanya menampilkan teks hitam biasa padahal kartu legenda di atasnya memiliki 5 warna semantik resmi.
- **Expected Result**: Kartu metrik curah hujan berinterpolasi halus dengan `AnimatedMetricValue`; batang `RainfallChart` memiliki sudut atas membulat (`radius={[6, 6, 0, 0]}`) dan animasi terukur `400ms` (patuh `reduced-motion`); kolom `Klasifikasi` di `RainfallTable` menggunakan `StatusPill` resmi dan kolom `Curah Hujan` menampilkan bar proporsi halus di bawah/samping angka.
- **Implementation Instructions**:
  1. Gunakan `AnimatedMetricValue` pada ketiga kartu metrik di `rainfall-page.tsx` dan tambahkan highlight halus pada baris kartu `Reklasifikasi Curah Hujan`.
  2. Di `rainfall-chart.tsx`, tambahkan `useReducedMotion()` dari `framer-motion`, aktifkan `isAnimationActive={!reduced}` dengan `animationDuration={400}` dan `radius={[6, 6, 0, 0]}` pada `<Bar>`.
  3. Di `rainfall-table.tsx`, render `StatusPill` pada sel `classification` (tetap tampilkan `"—"` bila `null`, misalnya pada wilayah dengan lubang CHIRPS seperti sebagian Bekasi) dan tambahkan bar visual proporsional tipis pada nilai `rainfallMm` terhadap nilai maksimum di kumpulan baris aktif.
- **Animation Specification**:
  - Trigger: Pergantian tahun atau wilayah pada `/curah-hujan`.
  - Duration & Easing: `400ms` s.d. `450ms ease-out`.
  - Interaction behavior: Pengurutan kolom `Klasifikasi` tetap mengikuti urutan `classOrder` (`Sangat Rendah` s.d. `Sangat Tinggi`).
- **Constraints**: Pertahankan nilai kosong (`null` -> `"—"`) tanpa pernah menggantinya menjadi `0` (sesuai kontrak data CHIRPS dan `view.test.mjs`).
- **Acceptance Criteria**: `StatusPill` muncul akurat di seluruh baris berklasifikasi; baris `null` tetap `"—"`; `view.test.mjs` dan `api.test.mjs` di `features/rainfall` lulus 100%.
- **Testing Instructions**: Buka `/curah-hujan`, uji filter bulan, daerah, dan klasifikasi, serta jalankan unit test curah hujan.
- **Dependencies**: `UI-001`, `UI-002`.

### Task ID: UI-010
- **Task Name**: Fix Clipped Frequency Chart & Upgrade Analysis Dashboard (`/analisis`)
- **Priority**: P0
- **Objective**: Memperbaiki bug terpotongnya batang ke-10 pada `FrequencyChart` di `/analisis`, menambahkan empty/loading state yang jelas pada ketiga grafik analisis, mengintegrasikan `AnimatedMetricValue`, dan memperkaya `AnalysisTable` dengan `StatusPill` serta pintasan eksplorasi ke `/map`.
- **Files to Inspect**: `apps/web/features/webgis/components/analysis-page.tsx`, `apps/web/features/webgis/components/analysis-charts.tsx`, `apps/web/features/webgis/components/analysis-table.tsx`, `apps/web/features/webgis/overview-api.test.mjs`, `apps/web/features/webgis/analysis-api.test.mjs`
- **Files to Modify**: `apps/web/features/webgis/components/analysis-page.tsx`, `apps/web/features/webgis/components/analysis-charts.tsx`, `apps/web/features/webgis/components/analysis-table.tsx`
- **Current Condition**: Pada layar sempit/menengah, label Y `FrequencyChart` membungkus menjadi 2 baris dan mendorong batang ke-10 keluar/terpotong di bagian bawah `Card` `h-[330px]`; saat wilayah kecamatan dipilih sehingga `frequency` atau `annualEvents` kosong (`[]`), kartu grafik hanya menampilkan kotak putih kosong tanpa keterangan penyebab; kolom `Kerawanan` di tabel hanya teks polos.
- **Expected Result**: Seluruh 10 kabupaten/kota pada `FrequencyChart` terbaca utuh di semua ukuran layar tanpa terpotong; saat data grafik kosong (misal filter kecamatan dipilih), muncul pesan empty state yang menjelaskan penyebab dan langkah selanjutnya; metrik menggunakan `AnimatedMetricValue`; tabel kerawanan menampilkan `StatusPill`, bar proporsi kepadatan/elevasi yang bersih, dan tautan cepat ke `/map?region=<row.id>`.
- **Implementation Instructions**:
  1. Di `analysis-charts.tsx`, ubah tinggi kartu `FrequencyChart` menjadi fleksibel (`min-h-[348px]` dengan tinggi container chart `h-[284px]` dan lebar sumbu Y responsif + pemendekan rapi atau `fontSize={12}` satu baris) sehingga ke-10 baris selalu muat utuh.
  2. Tambahkan empty state yang jelas (`role="status"`) pada `FrequencyChart`, `SusceptibilityChart` (ketika semua nilai `null`), dan `AnnualEventsChart` yang menjelaskan mengapa grafik kosong (misalnya cakupan histori hanya tersedia di tingkat provinsi/kabupaten/kota) sesuai aturan `antislop` R-27.
  3. Aktifkan animasi batang terukur (`isAnimationActive={!reduced}`, `animationDuration={400}`) serta sudut membulat pada `AnnualEventsChart` (`radius={[6, 6, 0, 0]}`).
  4. Di `analysis-page.tsx`, gunakan `AnimatedMetricValue` pada 4 kartu metrik utama dan pada angka `OverviewPanel` di `/map`.
  5. Di `analysis-table.tsx`, gunakan `StatusPill` untuk kolom `Kerawanan` dan tambahkan tautan ringkas ke `/map?region=${encodeURIComponent(row.original.id)}` pada sel `Kota/Kabupaten` agar pengguna dapat langsung melompat dari tabel analisis ke peta wilayah tersebut.
- **Animation Specification**:
  - Trigger: Pergantian tahun/wilayah di `/analisis` dan interaksi baris tabel.
  - Duration & Easing: Grafik `400ms ease-out`; metrik `450ms ease-out`; hover baris `150ms ease`.
- **Constraints**: Jangan mengubah string metrik di `analysis-api.ts` atau `overview-api.ts` yang diuji oleh unit test (`"Total Rumah Terpendam"`, dll.).
- **Acceptance Criteria**: Tidak ada label atau batang yang terpotong pada `390px`, `768px`, maupun `1440px`; empty state tampil jelas saat filter kecamatan dipilih; klik wilayah di tabel membuka `/map?region=<id>` dengan tepat.
- **Testing Instructions**: Uji `/analisis` pada lebar `390px` dan `1440px`, pilih satu kecamatan di filter header untuk memverifikasi empty state, dan jalankan `analysis-api.test.mjs` serta `overview-api.test.mjs`.
- **Dependencies**: `UI-001`, `UI-002`.

### Task ID: UI-011
- **Task Name**: Overview Panel & Bejir AI Assistant ("Aji") Interactive Polish
- **Priority**: P2
- **Objective**: Memoles panel kanan `/map` (`OverviewPanel` & `BejirAssistant`) agar metrik teranimasi halus, skala kerawanan menyorot kelas aktif dengan jelas, dan asisten AI "Aji" memiliki tampilan awal yang ramah dengan saran pertanyaan kontekstual.
- **Files to Inspect**: `apps/web/features/webgis/components/overview-panel.tsx`, `apps/web/features/assistant/components/assistant.tsx`, `apps/web/features/assistant/api.test.mjs`, `apps/web/features/assistant/components/assistant-markdown.test.mjs`
- **Files to Modify**: `apps/web/features/webgis/components/overview-panel.tsx`, `apps/web/features/assistant/components/assistant.tsx`
- **Current Condition**: `OverviewPanel` menampilkan balok 5 warna kerawanan dengan tinggi seragam tanpa penanda visual balok mana yang sedang aktif; `BejirAssistant` menampilkan area kosong melompong sebelum pengguna mengetik pertanyaan, dan jika belum ada layer aktif, tombol kirim mati tanpa penjelasan yang mudah terlihat.
- **Expected Result**: Pada `OverviewPanel`, angka metrik menggunakan `AnimatedMetricValue` dan balok warna yang sesuai dengan `overview.susceptibility.label` ditandai secara visual (outline tegas + sedikit lebih tinggi/menonjol); pada `BejirAssistant`, saat percakapan masih kosong, muncul kartu pengantar singkat "Aji" beserta daftar chip pertanyaan siap klik dan petunjuk jelas apabila pengguna belum memilih sumber layer (beserta tombol satu klik `"Aktifkan semua sumber"`).
- **Implementation Instructions**:
  1. Di `overview-panel.tsx`, integrasikan `AnimatedMetricValue` pada `metric.value` dan beri penanda aktif (`ring-2 ring-neutral-900 scale-y-115` atau indikator panah kecil) pada segmen warna `gis-risk-scale` yang cocok dengan `overview.susceptibility.label`.
  2. Di `assistant.tsx`, ketika `exchanges.length === 0`, tampilkan pengantar ringkas asisten banjir Jawa Barat "Aji", status sumber aktif (dengan tombol `"Pilih semua sumberdata"` bila `sourceLayerIds.length === 0`), dan 3 chip pertanyaan pemantik yang mengisi atau mengirim pertanyaan relevan secara langsung. Tambahkan juga indikator mengetik/memuat yang rapi saat `pending === true`.
- **Animation Specification**:
  - Trigger: Beralih ke tab AI, mengklik chip pertanyaan, atau menerima pembaruan data `OverviewPanel`.
  - Duration & Easing: Masuk pesan baru `220ms cubic-bezier(0.23, 1, 0.32, 1)`; tekan chip `150ms`.
- **Constraints**: Pertahankan logika `assistantSources(sourceLayerIds)` (tidak mengirim request jika sumber kosong, sesuai `assistant/api.test.mjs`).
- **Acceptance Criteria**: Pengalaman pertama membuka tab AI langsung jelas dan dapat dicoba dalam 1 klik; seluruh unit test di `features/assistant/` tetap lulus.
- **Testing Instructions**: Buka `/map`, buka panel kanan, periksa `Overview`, pindah ke tab `AI`, uji tombol pengaktif sumber dan chip pertanyaan.
- **Dependencies**: `UI-001`, `UI-005`.

### Task ID: UI-012
- **Task Name**: Full Multi-Viewport QA, Accessibility Audit, Unit Tests, and Production Build
- **Priority**: P0
- **Objective**: Memvalidasi seluruh perubahan terhadap standar performa, responsivitas desktop/tablet/mobile, reduced motion, konsol bebas error baru, seluruh unit test, ESLint, dan production build Next.js.
- **Files to Inspect**: Seluruh berkas yang dimodifikasi pada `UI-001` s.d. `UI-011`, `AI_PROGRESS.md`
- **Files to Modify**: Hanya berkas yang memerlukan perbaikan temuan QA serta `AI_PROGRESS.md`
- **Current Condition**: Tahap verifikasi akhir setelah implementasi fitur selesai.
- **Expected Result**:
  - Seluruh 23 berkas unit test `*.test.mjs` lulus (`0 fail`).
  - `npm run lint` lulus bersih (`0 errors`).
  - `npm run build` selesai sukses tanpa error TypeScript maupun prerender.
  - Pengujian browser pada `1440x900`, `768x1024`, dan `390x844` di seluruh route (`/`, `/map`, `/histori-banjir`, `/curah-hujan`, `/analisis`) membuktikan nol horizontal overflow tak disengaja, nol konten tersembunyi, navigasi keyboard berfungsi, dan `prefers-reduced-motion` dihormati.
- **Implementation Instructions**:
  1. Jalankan seluruh `*.test.mjs` dengan `node --test`.
  2. Jalankan `npm run lint` dan `npm run build` di `frontend/bejir/apps/web`.
  3. Jalankan server lokal dan uji klik demi klik setiap elemen interaktif menggunakan Chrome DevTools MCP pada tiga lebar layar (`1440`, `768`, `390`) serta mode `prefers-reduced-motion: reduce`.
  4. Perbarui `AI_PROGRESS.md` (dan salinannya di `frontend/`) dengan hasil pengujian nyata.
- **Animation Specification**: Memastikan seluruh animasi berjalan mulus tanpa layout shift (CLS) dan patuh terhadap `prefers-reduced-motion`.
- **Constraints**: Jangan mengklaim pemeriksaan yang tidak dijalankan secara nyata.
- **Acceptance Criteria**: Seluruh gerbang pengujian otomatis dan inspeksi visual browser lulus bersih.
- **Testing Instructions**: Dokumentasikan bukti klik dan hasil build secara spesifik di `AI_PROGRESS.md`.
- **Dependencies**: `UI-001` s.d. `UI-011`.

## 11. Task Dependencies

Urutan pengerjaan wajib mengikuti grafik ketergantungan berikut:

```text
UI-001 (Foundation: Motion Tokens, Button, AnimatedMetricValue, StatusPill)
  ├──► UI-002 (WebGIS Header, Search A11y & Mobile Shell)
  │      ├──► UI-005 (Map Quick Bar, Smooth FlyTo & District Hover)
  │      │      ├──► UI-006 (Living River Flow & Evacuation Route Animation)
  │      │      ├──► UI-007 (Educational Flood & Landslide Simulator)
  │      │      └──► UI-011 (Overview Panel & AI Assistant Polish)
  │      ├──► UI-008 (Histori Banjir Fixes & Motion)
  │      ├──► UI-009 (Curah Hujan Motion & Status Table)
  │      └──► UI-010 (Analisis Chart Fix, Motion & Map Links)
  └──► UI-003 (Landing Reveal Bug Fix & Clean Editorial Structure)
         └──► UI-004 (Landing Interactive Layer Explorer & Region Deep-Links)
                │
                ▼
         UI-012 (Full Multi-Viewport QA, Tests & Production Build)
```

## 12. Testing Requirements

Setiap model AI wajib menjalankan pemeriksaan berikut sebelum menandai suatu task sebagai `Completed` di `AI_PROGRESS.md`:

1. **Unit Tests**: `node --test <file.test.mjs>` untuk modul terkait, dan seluruh 23 berkas `*.test.mjs` pada akhir sesi.
2. **Static Analysis**: `npm run lint` di `frontend/bejir/apps/web` tanpa error.
3. **Production Build**: `npm run build` di `frontend/bejir/apps/web` untuk memverifikasi TypeScript dan App Router SSR/prerender.
4. **Browser Click-Through & Viewport Check**: Uji pada lebar `1440px` (Desktop), `768px` (Tablet), dan `390px` (Mobile), periksa `document.documentElement.scrollWidth <= window.innerWidth`, pastikan tidak ada error baru di Console, uji tombol `Tab`/`Escape`, dan uji emulasi `prefers-reduced-motion: reduce`.

## 13. Important Technical Constraints

1. **Jangan Mengubah Kontrak Data yang Diuji Unit Test**: Pertahankan string data di `overview-api.ts`, `analysis-api.ts`, `history-summary.ts`, dan `rainfall/view.ts` (termasuk `"Rumah Terpendam"`, `"Total Rumah Terpendam"`, dan nilai `"—"` untuk data `null`).
2. **Pertahankan Independensi Filter Header vs Filter Tabel**: Pada `/histori-banjir`, `/curah-hujan`, dan `/analisis`, perubahan tahun/wilayah di header tidak boleh mereset atau menimpa filter independen milik tabel kecuali ditentukan oleh kode asli.
3. **Batas Kebenaran Ilmiah**: Simulasi genangan banjir dan longsor wajib selalu terlabeli `"Simulasi Edukatif · Bukan Kondisi Aktual"` dan tidak boleh mencampuradukkan skenario edukatif dengan statistik historis BNPB/PostGIS.
4. **Disiplin Paket & Ikon**: Jangan menambah library npm baru tanpa kebutuhan mutlak; gunakan `@tabler/icons-react` untuk seluruh ikon antarmuka.
5. **Aturan Git**: Seluruh pekerjaan hanya dilakukan di branch `dev-animasi-FE` dalam repositori `frontend/bejir/`. Verifikasi `git config user.email` adalah `mochammadalthofsr@gmail.com` sebelum melakukan commit, tanpa atribusi AI atau trailer `Co-authored-by`.

## 14. Progress Tracking & Instructions for the Next AI Model

Seluruh status pengerjaan dicatat dan diperbarui secara langsung di `AI_PROGRESS.md`.

### Copy-Paste Prompt untuk Model AI Berikutnya

Salin blok di bawah ini apabila pekerjaan dilanjutkan pada sesi atau model AI lain:

```text
Kamu melanjutkan pengembangan frontend SIBAJAWA (Bejir WebGIS) pada branch `dev-animasi-FE`.
Ikuti urutan kerja wajib berikut tanpa melewati satu langkah pun:

1. Baca `frontend/bejir/AI_PROJECT_CONTEXT.md` untuk memahami arsitektur, tech stack, dan batasan kontrak pengujian.
2. Baca `frontend/bejir/AI_IMPLEMENTATION_WORKFLOW.md` untuk memahami arah kreatif, aturan motion, dan spesifikasi teknis tiap task atomik.
3. Baca `frontend/bejir/AI_PROGRESS.md` untuk memeriksa task yang sudah selesai, keputusan yang telah dibuat, dan task rekomendasi berikutnya.
4. Periksa branch Git aktif di `frontend/bejir` adalah `dev-animasi-FE` (`git -C frontend/bejir status`). Jangan pernah commit atau push ke `main` atau `frontend`.
5. Pilih satu task dengan prioritas tertinggi pada `AI_PROGRESS.md` yang seluruh dependency-nya telah selesai.
6. Baca seluruh berkas pada bagian "Files to Inspect" milik task tersebut sebelum menulis kode.
7. Implementasikan perubahan tepat sesuai spesifikasi task, patuhi standar aksesibilitas, `prefers-reduced-motion`, tanpa `transition: all`, tanpa em dash di teks baru, dan tanpa merusak kontrak unit test `*.test.mjs`.
8. Jalankan pengujian (`npm run lint`, unit test terkait dengan `node --test`, build/dev check, dan inspeksi browser jika menyentuh UI).
9. Perbarui `frontend/bejir/AI_PROGRESS.md` (dan sinkronkan ke `frontend/AI_PROGRESS.md`) dengan status terbaru, daftar berkas yang diubah, serta hasil validasi sebelum beralih ke task berikutnya.
```
