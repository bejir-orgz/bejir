import Link from "next/link";
import { HeroLandscape } from "./hero-landscape";
import { IconArrowDown, IconArrowUpRight, IconCloudRain, IconLayersIntersect, IconMap2, IconRoute, IconShieldCheck } from "@tabler/icons-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SibajwaBrand } from "@/components/shared/sibajwa-brand";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, LandingNavbar, LandingMotion, MotionArtwork, MotionDataBar, MotionProgress, MotionReveal } from "./landing-motion";
import { InteractiveAtlasPreview, InteractiveFloodRanking } from "./interactive-atlas-preview";
import { WatershedScrollStage } from "./watershed-scroll-stage";
import { floodRankingSource } from "./flood-data";
import styles from "./landing.module.css";

const steps = [
  { title: "Pilih wilayah pada peta 3D berkontur", text: "Cari kabupaten, kota, atau kecamatan untuk melihat batas administrasi, kontur elevasi, bangunan 3D, dan periode pengamatan." },
  { title: "Bandingkan layer hidrologi & simulasi DEM", text: "Nyalakan curah hujan, jaringan sungai, kerawanan, atau jalankan simulasi edukatif banjir DEM dan longsor lereng langsung di atas peta." },
  { title: "Cari titik evakuasi aman & baca sumbernya", text: "Klik titik di peta untuk mencari rute atau titik evakuasi aman terdekat serta pelajari catatan metode di panel ringkasan." },
];

const floodSource = "https://bnpb.go.id/storage/app/media/Buletin%20Info%20Bencana/Buku%20Data%20Bencana%202024/20250613_Buku%20Data%202024.pdf#page=142";
const floodStats = [
  { value: 143, label: "kejadian banjir tercatat", detail: "Sepanjang Januari s.d. Desember 2024 di Jawa Barat", icon: IconCloudRain },
  { value: 483117, label: "jiwa mengungsi & terdampak", detail: "Akumulasi warga terdampak dalam catatan BNPB 2024", icon: IconShieldCheck },
  { value: 115820, label: "unit rumah terendam", detail: "Dampak permukiman akibat kejadian banjir selama 2024", icon: IconMap2 },
];

function Landscape() {
  return (
    <div className={styles.landscape} aria-hidden="true">
      <div className={styles.cloud} /><div className={styles.cloud} />
      <svg viewBox="0 0 1440 520" preserveAspectRatio="none">
        <path fill="#eff6ff" d="M0 245 140 150 250 210 420 70 580 230 760 155 900 240 1100 90 1260 220 1440 130V520H0Z" />
        <path fill="#dbeafe" d="m0 290 180-80 140 90 180-130 150 130 170-75 140 70 170-125 160 105 150-75v310H0Z" />
        <path fill="#bfdbfe" d="M0 330Q180 215 390 350T770 340 1100 300 1440 290V520H0Z" />
        <path fill="#eff6ff" d="M800 305Q680 350 800 377T650 450L560 520H1040Q790 445 940 419T865 365Q770 345 870 305Z" />
        <path fill="#93c5fd" d="M0 380Q160 315 310 400T560 440L390 520H0Z" />
        <path fill="#60a5fa" opacity=".4" d="M1440 350Q1280 300 1160 400T1030 520H1440Z" />
        <path fill="#2563eb" opacity=".16" d="M0 450Q190 380 400 510L430 520H0ZM1440 430Q1250 385 1150 520H1440Z" />
        <g fill="none" stroke="#fff" opacity=".45"><path d="M0 408Q160 345 315 426T500 462" /><path d="M1440 380Q1280 335 1170 430" /><path d="M50 480Q180 435 320 490" /></g>
      </svg>
    </div>
  );
}

export function LandingPage() {
  return (
    <LandingMotion><div className={styles.landing}>
      <MotionProgress />
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <LandingNavbar className={styles.navbar}><SiteHeader /></LandingNavbar>
      <main id="main-content">
        <section className={styles.hero} id="jelajahi">
          <MotionArtwork className={styles.heroArt} controlClassName={styles.heroAmbientToggle}>
            <HeroLandscape />
          </MotionArtwork>

          <div className={styles.heroContent}>
            <h1>Kenali banjir.<br />Pahami <span>wilayahmu.</span></h1>
            <p className={styles.heroDescription}>Jawa Barat berulang kali mengalami banjir dari cekungan tengah hingga pantura. Mulai dari peta interaktif, telusuri sungainya, dan pahami risiko di setiap kecamatan.</p>
            <div className={styles.actions}>
              <Button asChild size="lg"><Link href="/map">Jelajahi WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
              <a href="#fakta-banjir" className={styles.secondaryLink}>Lihat catatan BNPB <IconArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <a href={floodSource} target="_blank" rel="noreferrer" className={styles.heroFact}>
              <span className={styles.factIcon}><IconCloudRain size={22} aria-hidden="true" /></span>
              <span>
                <strong><AnimatedNumber value={143} /><span> kejadian banjir</span></strong>
                <small>Jawa Barat · Tahun 2024 · Sumber BNPB <IconArrowUpRight size={12} aria-hidden="true" /></small>
              </span>
            </a>
          </div>

          <svg className={styles.heroShore} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60C220 118 390 18 680 65S1180 110 1440 42V120H0Z" fill="#bde6ff" /><path d="M0 82C220 125 420 48 710 85S1190 105 1440 65V120H0Z" fill="#eaf4ff" /></svg>
        </section>

        <div className={styles.riverContinuation}>
          <MotionReveal className={styles.regionSummary}>
            <div className={styles.regionSummaryHeading}>
              <h2>5 daerah dengan kejadian banjir terbanyak</h2>
              <p>Pilih salah satu wilayah untuk langsung membuka batas administrasi dan ringkasannya pada Map Interaktif. Data catatan Januari s.d. Desember 2024.</p>
              <a href={floodRankingSource} target="_blank" rel="noreferrer">
                BNPB · Buku Data Bencana 2024, Tabel L5, hlm. 128 sampai 129 <IconArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
            <InteractiveFloodRanking />
          </MotionReveal>

          <section className={styles.coverage} aria-label="Cakupan informasi">
            <p>Empat dimensi data geospasial yang terhubung dalam satu ruang kerja</p>
            <div>
              <Link href="/histori-banjir"><IconMap2 aria-hidden="true" />Riwayat banjir</Link>
              <Link href="/curah-hujan"><IconCloudRain aria-hidden="true" />Curah hujan</Link>
              <Link href="/analisis"><IconLayersIntersect aria-hidden="true" />Kerawanan & medan</Link>
              <Link href="/map"><IconRoute aria-hidden="true" />Rute evakuasi</Link>
            </div>
          </section>

          <section id="fakta-banjir" className={`${styles.section} ${styles.statsSection}`}>
            <MotionReveal className={styles.sectionHeading}>
              <h2>Skala dampak banjir Jawa Barat sepanjang 2024</h2>
              <p>Ratusan ribu warga terdampak dalam satu tahun kalender. Data terbuka yang mudah dibaca membantu warga, peneliti, dan pemerintah daerah mengenali pola kerentanan lebih dini.</p>
            </MotionReveal>
            <div className={styles.statsGrid}>
              {floodStats.map(({ value, label, detail, icon: Icon }, i) => (
                <MotionReveal as="article" className={styles.statCard} key={label} delay={i * 0.07}>
                  <span className={styles.cardIcon}><Icon size={22} aria-hidden="true" /></span>
                  <strong><AnimatedNumber value={value} delay={i * 0.07} /></strong>
                  <h3>{label}</h3>
                  <p>{detail}</p>
                  <div className={styles.statLine} aria-hidden="true"><MotionDataBar /></div>
                </MotionReveal>
              ))}
            </div>
            <p className={styles.sourceNote}>
              Data historis Januari s.d. Desember 2024, bukan peringatan bencana aktif saat ini.<br />
              <a href={floodSource} target="_blank" rel="noreferrer">Sumber: BNPB · Data Bencana Indonesia 2024 · Tabel L4, hlm. 124 <IconArrowUpRight size={12} aria-hidden="true" /></a>
            </p>
          </section>
        </div>

        <WatershedScrollStage />

        <section id="fitur" className={`${styles.section} ${styles.features}`}>
          <div className={styles.featuresInner}>
            <MotionReveal className={styles.sectionHeading}>
              <h2>Coba bagaimana setiap layer membaca bentang alam 3D Jawa Barat</h2>
              <p>Ganti lapisan atau putar maket 3D Cekungan Bandung di bawah ini untuk melihat curah hujan, sungai, elevasi DEM, simulasi banjir, dan jalur evakuasi saling melengkapi.</p>
            </MotionReveal>
            <MotionReveal delay={0.06}>
              <InteractiveAtlasPreview />
            </MotionReveal>
            <p className={styles.mapFootnote}>
              <IconShieldCheck size={15} aria-hidden="true" />
              Maket 3D di atas dibangun dari potongan raster DEM 30 m, HAND, curah hujan, dan klaster bangunan Cekungan Bandung. Eksplorasi penuh 627 kecamatan, bangunan 3D detail, dan 14.338 titik evakuasi tersedia di halaman Map Interaktif.
            </p>
          </div>
        </section>

        <section id="cara-kerja" className={`${styles.section} ${styles.workflow}`}>
          <MotionReveal>
            <h2>Mulai eksplorasi dari tempat yang kamu kenal</h2>
            <p>Dirancang agar mudah dijelajahi baik untuk mengecek satu kecamatan maupun membandingkan tren antarkabupaten.</p>
            <Link href="/map" className={styles.textLink}>Buka Map Interaktif sekarang <IconArrowUpRight size={18} aria-hidden="true" /></Link>
          </MotionReveal>
          <ol>
            {steps.map((step, i) => (
              <MotionReveal as="li" key={step.title} delay={i * 0.06}>
                <span aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </MotionReveal>
            ))}
          </ol>
        </section>

        <section className={styles.ctaSection}>
          <Landscape />
          <MotionReveal className={styles.ctaCard}>
            <h2>Siap menelusuri peta banjir dan kondisi geografis Jawa Barat?</h2>
            <p>Buka peta interaktif, periksa statistik curah hujan, atau telusuri histori banjir tahunan per kabupaten dan kota.</p>
            <div className={styles.ctaActions}>
              <Button asChild size="lg"><Link href="/map">Buka Map Interaktif <IconArrowUpRight aria-hidden="true" /></Link></Button>
              <Button asChild variant="outline" size="lg" className={styles.ctaSecondaryBtn}><Link href="/histori-banjir">Lihat Histori Banjir</Link></Button>
            </div>
          </MotionReveal>
        </section>
      </main>
      <footer className={styles.footer}><SibajwaBrand /><p>Sistem Informasi Banjir Jawa Barat</p><a href="#main-content">Kembali ke atas ↑</a></footer>
    </div></LandingMotion>
  );
}
