import Link from "next/link";
import {
  IconArrowDown,
  IconArrowUpRight,
  IconChartBar,
  IconCloudRain,
  IconHistory,
  IconMap2,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SibajwaBrand } from "@/components/shared/sibajwa-brand";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, HeroWeatherStage, LandingNavbar, LandingMotion, MotionProgress, MotionReveal } from "./landing-motion";
import { InteractiveFloodRanking } from "./flood-ranking-list";
import { WatershedScrollStage } from "./watershed-scroll-stage";
import { floodRankingSource } from "./flood-data";
import styles from "./landing.module.css";

const floodSource = "https://bnpb.go.id/storage/app/media/Buletin%20Info%20Bencana/Buku%20Data%20Bencana%202024/20250613_Buku%20Data%202024.pdf#page=142";

const impactMetrics = [
  { value: 143, label: "kejadian banjir" },
  { value: 483117, label: "warga terdampak" },
  { value: 115820, label: "rumah terendam" },
] as const;

const mapToolPills = ["Daerah", "Timeline", "Legenda", "Simulasi", "Layer", "2D / 3D"] as const;

const companionModules = [
  {
    href: "/histori-banjir",
    title: "Histori Banjir",
    text: "Tren kejadian bulanan, dampak rumah, dan tabel riwayat per kabupaten/kota.",
    icon: IconHistory,
  },
  {
    href: "/curah-hujan",
    title: "Curah Hujan",
    text: "Grafik intensitas hujan bulanan dan klasifikasi tahunan 27 wilayah Jawa Barat.",
    icon: IconCloudRain,
  },
  {
    href: "/analisis",
    title: "Analisis Wilayah",
    text: "Peringkat kelas kerawanan AHP 5 parameter serta daftar fasilitas terdampak.",
    icon: IconChartBar,
  },
] as const;

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
        <HeroWeatherStage>
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
        </HeroWeatherStage>

        <section id="fakta-banjir" className={styles.riverContinuation} aria-label="Catatan dampak banjir Jawa Barat 2024">
          <MotionReveal className={styles.regionSummary}>
            <div className={styles.regionSummaryHeading}>
              <h2>Catatan banjir Jawa Barat 2024</h2>
              <p>Pilih salah satu dari 5 kabupaten dengan kejadian terbanyak untuk langsung membuka batas wilayah dan ringkasannya di Map Interaktif.</p>

              <dl className={styles.summaryMetrics}>
                {impactMetrics.map(({ value, label }, i) => (
                  <div key={label} className={styles.summaryMetricItem}>
                    <dt>{label}</dt>
                    <dd><AnimatedNumber value={value} delay={i * 0.06} /></dd>
                  </div>
                ))}
              </dl>

              <p className={styles.summarySource}>
                Data historis Januari s.d. Desember 2024, bukan peringatan bencana aktif.{" "}
                <a href={floodRankingSource} target="_blank" rel="noreferrer">
                  Sumber: BNPB 2024 <IconArrowUpRight size={13} aria-hidden="true" />
                </a>
              </p>
            </div>
            <InteractiveFloodRanking />
          </MotionReveal>
        </section>

        <WatershedScrollStage />

        <section id="fitur" className={`${styles.section} ${styles.features}`}>
          <div className={styles.featuresInner}>
            <MotionReveal className={styles.sectionHeading}>
              <h2>Empat ruang kerja dalam satu WebGIS</h2>
              <p>Semua data wilayah, peta 3D, histori banjir, dan curah hujan saling terhubung sehingga kamu bisa langsung mengecek kecamatan yang kamu kenal.</p>
            </MotionReveal>

            <div className={styles.workspaceGrid}>
              <MotionReveal as="article" className={styles.workspaceLead}>
                <span className={styles.cardIcon}><IconMap2 size={22} aria-hidden="true" /></span>
                <h3>Map Interaktif 3D</h3>
                <p>
                  Telusuri 627 kecamatan di atas kontur 3D dan bangunan 3D, nyalakan layer kerawanan, uji simulasi genangan DEM, atau cari rute ke 14.338 titik evakuasi aman.
                </p>
                <div className={styles.workspacePills} aria-label="Pintasan alat di Map Interaktif">
                  {mapToolPills.map((pill) => (
                    <span key={pill}>{pill}</span>
                  ))}
                </div>
                <div className={styles.workspaceLeadAction}>
                  <Button asChild size="lg">
                    <Link href="/map">Buka Map Interaktif <IconArrowUpRight aria-hidden="true" /></Link>
                  </Button>
                </div>
              </MotionReveal>

              <div className={styles.workspaceCompanions}>
                {companionModules.map(({ href, title, text, icon: Icon }, i) => (
                  <MotionReveal as="article" key={href} delay={i * 0.05}>
                    <Link href={href} className={styles.workspaceCard}>
                      <span className={styles.workspaceCardIcon}><Icon size={20} aria-hidden="true" /></span>
                      <div className={styles.workspaceCardBody}>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                      <IconArrowUpRight size={18} className={styles.workspaceCardArrow} aria-hidden="true" />
                    </Link>
                  </MotionReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <Landscape />
          <MotionReveal className={styles.ctaCard}>
            <h2>Siap menelusuri peta banjir Jawa Barat?</h2>
            <p>Buka peta interaktif 3D, periksa statistik curah hujan, atau telusuri histori banjir tahunan per kabupaten dan kota.</p>
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
