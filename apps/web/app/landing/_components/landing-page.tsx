import Link from "next/link";
import { HeroLandscape } from "./hero-landscape";
import { IconArrowDown, IconArrowUpRight, IconChartBar, IconCloudRain, IconLayersIntersect, IconMap2, IconMapPin, IconRoute, IconShieldCheck } from "@tabler/icons-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SibajwaBrand } from "@/components/shared/sibajwa-brand";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, LandingNavbar, LandingMotion, MotionArtwork, MotionDataBar, MotionProgress, MotionReveal } from "./landing-motion";
import { floodRankingSource, topFloodRegions } from "./flood-data";
import styles from "./landing.module.css";

const capabilities = [
  { number: "01", icon: IconMap2, tag: "Riwayat banjir", title: "Setiap lokasi punya cerita.", description: "Jelajahi riwayat banjir berdasarkan wilayah dan periode. Kenali konteks di balik setiap kejadian." },
  { number: "02", icon: IconLayersIntersect, tag: "Layer geografis", title: "Lihat lebih dari satu sisi.", description: "Hubungkan curah hujan, sungai, elevasi, dan tutupan lahan dalam satu perspektif geografis." },
  { number: "03", icon: IconChartBar, tag: "Analisis wilayah", title: "Pahami potensi dampaknya.", description: "Kenali analisis kerawanan dan estimasi dampak terhadap penduduk serta bangunan." },
];

const steps = [
  { title: "Mulai dari wilayahmu", text: "Pilih lokasi dan periode sesuai cakupan data yang tersedia." },
  { title: "Temukan keterkaitannya", text: "Jelajahi layer peta, bandingkan informasi, dan baca legendanya." },
  { title: "Bawa pulang pemahaman", text: "Baca detail, sumber, dan metode untuk memahami hasil analisis." },
];

const floodSource = "https://bnpb.go.id/storage/app/media/Buletin%20Info%20Bencana/Buku%20Data%20Bencana%202024/20250613_Buku%20Data%202024.pdf#page=142";
const floodStats = [
  { value: 143, label: "kejadian banjir", detail: "Tercatat di Jawa Barat selama 2024", icon: IconCloudRain },
  { value: 483117, label: "jiwa mengungsi & terdampak", detail: "Dampak banjir yang dicatat BNPB", icon: IconShieldCheck },
  { value: 115820, label: "rumah terendam", detail: "Akibat kejadian banjir selama 2024", icon: IconMap2 },
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
          <MotionArtwork className={styles.heroArt}><HeroLandscape /></MotionArtwork>

          <div className={styles.heroContent}>
            <h1>Kenali banjir.<br />Pahami <span>wilayahmu.</span></h1>
            <p className={styles.heroDescription}>Jawa Barat berulang kali mengalami banjir. Mulai dari peta, kenali lokasinya, dan pahami informasi di balik setiap wilayah.</p>
            <div className={styles.actions}>
              <Button asChild size="lg"><Link href="/map">Jelajahi WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
              <a href="#fakta-banjir" className={styles.secondaryLink}>Lihat faktanya <IconArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <a href={floodSource} target="_blank" rel="noreferrer" className={styles.heroFact}><span className={styles.factIcon}><IconCloudRain size={22} aria-hidden="true" /></span><span><strong><AnimatedNumber value={143} /><span> kejadian banjir</span></strong><small>Jawa Barat · Tahun 2024 · Sumber BNPB <IconArrowUpRight size={12} aria-hidden="true" /></small></span></a>
          </div>

          <svg className={styles.heroShore} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60C220 118 390 18 680 65S1180 110 1440 42V120H0Z" fill="#bde6ff" /><path d="M0 82C220 125 420 48 710 85S1190 105 1440 65V120H0Z" fill="#eaf4ff" /></svg>
        </section>

        <div className={styles.riverContinuation}>
        <MotionReveal className={styles.regionSummary}>
          <div className={styles.regionSummaryHeading}>
            <h2>5 daerah dengan banjir terbanyak</h2>
            <p>Jawa Barat · Januari–Desember 2024</p>
            <a href={floodRankingSource} target="_blank" rel="noreferrer">
              BNPB · Tabel L5, hlm. 128–129 <IconArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          <ol className={styles.regionList} role="list" aria-label="Peringkat kejadian banjir">
            {topFloodRegions.map((region, i) => (
              <MotionReveal as="li" key={region.code} delay={i * 0.08}>
                <span className={styles.regionRank} aria-hidden="true">{i + 1}</span>
                <span className={styles.regionName}>{region.name}</span>
                <strong className={styles.regionCount}>
                  <AnimatedNumber value={region.count} delay={i * 0.08} />
                  <small>kejadian</small>
                </strong>
                <div className={styles.regionBar} aria-hidden="true">
                  <div style={{ width: `${region.count / topFloodRegions[0].count * 100}%` }}>
                    <MotionDataBar />
                  </div>
                </div>
              </MotionReveal>
            ))}
          </ol>
        </MotionReveal>
        <section className={styles.coverage} aria-label="Cakupan informasi">
          <p>Kenali banjir dari berbagai sisi</p>

          <div><span><IconMap2 />Riwayat banjir</span><span><IconCloudRain />Curah hujan</span><span><IconLayersIntersect />Kondisi geografis</span><span><IconRoute />Evakuasi</span></div>
        </section>

        <section id="fakta-banjir" className={`${styles.section} ${styles.statsSection}`}>
          <MotionReveal className={styles.sectionHeading}><span className={styles.sectionLabel}><span className={styles.sectionIndex} aria-hidden="true">01</span>Kenapa kita perlu peduli?</span><h2>Bukan sekadar angka.<br /><span>Ada kehidupan di baliknya.</span></h2><p>Sepanjang 2024, BNPB mencatat ratusan ribu jiwa mengungsi dan terdampak banjir di Jawa Barat. Memahami wilayah adalah langkah awal untuk lebih bersiap.</p></MotionReveal>
          <div className={styles.statsGrid}>{floodStats.map(({ value, label, detail, icon: Icon }, i) => <MotionReveal as="article" className={styles.statCard} key={label} delay={i * 0.1}><span className={styles.cardIcon}><Icon size={22} aria-hidden="true" /></span><strong><AnimatedNumber value={value} delay={i * 0.1} /></strong><h3>{label}</h3><p>{detail}</p><div className={styles.statLine} aria-hidden="true"><MotionDataBar /></div></MotionReveal>)}</div>
          <p className={styles.sourceNote}>Data historis Januari–Desember 2024, bukan kondisi saat ini.<br /><a href={floodSource} target="_blank" rel="noreferrer">Sumber: BNPB · Data Bencana Indonesia 2024 · Tabel L4, hlm. 124 <IconArrowUpRight size={12} aria-hidden="true" /></a></p>
        </section>

        </div>

        <section id="tentang" className={`${styles.section} ${styles.about}`}>
          <MotionReveal><span className={styles.sectionLabel}><span className={styles.sectionIndex} aria-hidden="true">02</span>Tentang SIBAJAWA</span><h2>Informasi terhubung.<br /><span>Pemahaman lebih utuh.</span></h2></MotionReveal>
          <MotionReveal delay={0.08}><p>Banjir tidak berdiri sendiri. Curah hujan, bentang alam, sungai, dan aktivitas di suatu wilayah saling berkaitan.</p><p>SIBAJAWA menyatukan informasi tersebut melalui peta interaktif untuk mendukung pemantauan dan mitigasi banjir di Jawa Barat. Agar data tidak sekadar terlihat, tetapi juga bisa dipahami.</p><Link href="/map" className={styles.textLink}>Kenali wilayahmu <IconArrowUpRight size={18} aria-hidden="true" /></Link></MotionReveal>
        </section>

        <section id="fitur" className={`${styles.section} ${styles.features}`}>
          <MotionReveal className={styles.sectionHeading}><span className={styles.sectionLabel}><span className={styles.sectionIndex} aria-hidden="true">03</span>Dari data ke pemahaman</span><h2>Lihat lebih dekat.<br /><span>Temukan gambaran besarnya.</span></h2></MotionReveal>
          <div className={styles.featureGrid}>{capabilities.map(({ number, icon: Icon, title, description, tag }, i) => <MotionReveal as="article" key={number} className={styles.featureCard} delay={i * 0.08}><div className={styles.featureTop}><div className={styles.featureIdentity}><span className={styles.cardIcon}><Icon size={24} stroke={1.5} aria-hidden="true" /></span><span className={styles.cardLabel}>{tag}</span></div><span>{number}</span></div><div className={styles.featureIllustration} aria-hidden="true">{number === "01" ? <><i /><i /><i /><IconMapPin size={36} /></> : number === "02" ? <><b /><b /><b /></> : <>{[35, 65, 45, 90, 75, 100].map((height, i) => <em key={i} style={{ height: `${height}%` }} />)}</>}</div><h3>{title}</h3><p>{description}</p></MotionReveal>)}</div>
          <p className={styles.mapFootnote}><IconShieldCheck size={15} aria-hidden="true" />Platform dalam pengembangan. Hasil prediksi, simulasi, dan analisis mengikuti sumber serta metode yang digunakan.</p>
        </section>

        <section id="cara-kerja" className={`${styles.section} ${styles.workflow}`}>
          <MotionReveal><span className={styles.sectionLabel}><span className={styles.sectionIndex} aria-hidden="true">04</span>Tidak harus rumit</span><h2>Mulai dari<br /><span>tempat yang kamu kenal.</span></h2><p>Tiga langkah untuk melihat wilayah dari perspektif yang lebih utuh.</p><Link href="/map" className={styles.textLink}>Mulai eksplorasi <IconArrowUpRight size={18} aria-hidden="true" /></Link></MotionReveal>
          <ol>{steps.map((step, i) => <MotionReveal as="li" key={step.title} delay={i * 0.06}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></MotionReveal>)}</ol>
        </section>

        <section className={styles.ctaSection}><Landscape /><MotionReveal className={styles.ctaCard}><span className={styles.sectionLabel}><span className={styles.sectionIndex} aria-hidden="true">05</span>Perspektif baru untuk Jawa Barat</span><h2>Lebih kenal wilayah.<br /><span>Lebih siap melangkah.</span></h2><p>Perjalanan memahami banjir dimulai dari satu lokasi.</p><Button asChild size="lg"><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button></MotionReveal></section>
      </main>
      <footer className={styles.footer}><SibajwaBrand /><p>Sistem Informasi Banjir Jawa Barat</p><a href="#main-content">Kembali ke atas ↑</a></footer>
    </div></LandingMotion>
  );
}
