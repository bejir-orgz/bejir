import Link from "next/link";
import {
  IconArrowRight, IconArrowUpRight, IconChartBar, IconChevronRight,
  IconCloudRain, IconDatabase, IconLayersIntersect, IconMap2,
  IconMapPin, IconRoute, IconShieldCheck,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Brand } from "@/components/shared/brand";
import { GisPreview } from "@/components/shared/gis-preview";
import { Button } from "@/components/ui/button";

const capabilities = [
  { number: "01", icon: IconMap2, title: "Kenali riwayat banjir", description: "Jelajahi kejadian banjir berdasarkan wilayah dan periode untuk memahami konteks di balik setiap lokasi.", tag: "Data historis" },
  { number: "02", icon: IconLayersIntersect, title: "Lihat wilayah lebih utuh", description: "Bandingkan curah hujan, sungai, elevasi, dan tutupan lahan dalam satu konteks geografis.", tag: "Layer geografis" },
  { number: "03", icon: IconChartBar, title: "Pahami potensi dampak", description: "Baca hasil analisis kerawanan dan estimasi dampak terhadap penduduk serta bangunan.", tag: "Hasil analisis" },
];

const steps = [
  { title: "Pilih wilayah dan periode", text: "Tentukan konteks lokasi dan waktu sesuai cakupan data." },
  { title: "Jelajahi layer peta", text: "Tampilkan informasi yang relevan dan baca legendanya." },
  { title: "Baca detail dan hasil analisis", text: "Pahami sumber, satuan, dan makna di balik setiap hasil." },
];

export function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section">
          <div className="site-container relative grid items-center gap-4 lg:grid-cols-[1.04fr_1fr]">
            <div className="hero-copy">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 p-2 text-[11px] font-semibold tracking-[.08em] text-blue-700">
                <span className="size-1.5 rounded-full bg-blue-600" />WEBGIS BANJIR JAWA BARAT
              </div>
              <h1 className="max-w-[620px] text-[44px] leading-[1.08] font-semibold tracking-[-2px] text-neutral-950 sm:text-[58px] lg:text-[68px]">
                Pahami wilayah.<br />Kenali banjir.<br /><span className="text-blue-600">Bersiap lebih baik.</span>
              </h1>
              <p className="mt-8 max-w-[430px] text-[16px] leading-[1.8] text-neutral-500">Satu ruang untuk menjelajahi informasi banjir dan kondisi geografis Jawa Barat. Mulai dari peta, temukan konteks yang berarti.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg"><Link href="/map">Jelajahi WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
                <a href="#tentang" className="inline-flex h-12 items-center gap-2 rounded-lg p-2 text-sm font-medium text-neutral-600 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600">Kenali Bejir <IconArrowRight size={17} aria-hidden="true" /></a>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-neutral-500"><IconMapPin size={15} stroke={1.7} aria-hidden="true" /><span>Berfokus pada wilayah Provinsi Jawa Barat</span></div>
            </div>
            <div className="hero-visual relative p-2">
              <div className="absolute -inset-4 rounded-[48px] bg-blue-100/40 blur-3xl" aria-hidden="true" />
              <GisPreview />
              <div className="relative mt-4 flex items-center justify-center gap-2 text-[11px] text-neutral-500"><span className="size-1 rounded-full bg-blue-400" />Informasi spasial, dalam satu perspektif.</div>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-100 bg-white" aria-label="Cakupan informasi">
          <div className="site-container flex flex-wrap items-center justify-between gap-4 py-4">
            <span className="text-[10px] font-semibold tracking-[.14em] text-neutral-500">MEMAHAMI BANJIR DARI BERBAGAI SISI</span>
            <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-2"><IconDatabase size={16} aria-hidden="true" />Riwayat banjir</span>
              <span className="flex items-center gap-2"><IconCloudRain size={16} aria-hidden="true" />Curah hujan</span>
              <span className="flex items-center gap-2"><IconLayersIntersect size={16} aria-hidden="true" />Kondisi geografis</span>
              <span className="flex items-center gap-2"><IconRoute size={16} aria-hidden="true" />Evakuasi</span>
            </div>
          </div>
        </section>

        <section id="tentang" className="section-space scroll-mt-8">
          <div className="site-container grid gap-4 md:grid-cols-[.8fr_1fr]">
            <div><p className="eyebrow">TENTANG BEJIR</p><h2 className="section-title mt-4 max-w-md">Informasi yang terhubung.<br /><span className="text-neutral-500">Pemahaman yang lebih utuh.</span></h2></div>
            <div className="md:pt-8">
              <p className="max-w-xl text-base leading-8 text-neutral-500">Banjir tidak berdiri sendiri. Curah hujan, bentang alam, sungai, dan aktivitas di suatu wilayah saling berkaitan. Bejir dirancang untuk menyatukan informasi tersebut melalui peta interaktif.</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500">Tujuannya sederhana: membantu eksplorasi data dan pemahaman wilayah untuk mendukung pemantauan serta mitigasi banjir di Jawa Barat.</p>
            </div>
          </div>
        </section>

        <section id="fitur" className="section-space scroll-mt-8 border-y border-neutral-100 bg-[#f8fafc]">
          <div className="site-container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="eyebrow">DARI DATA KE PEMAHAMAN</p><h2 className="section-title mt-4">Jelajahi. Hubungkan. Pahami.</h2></div>
              <p className="max-w-xs text-sm leading-6 text-neutral-500">Cakupan platform yang dikembangkan untuk melihat banjir dari berbagai perspektif.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {capabilities.map(({ number, icon: Icon, title, description, tag }) => (
                <article key={number} className="feature-card rounded-2xl border border-neutral-200/70 bg-white p-4">
                  <div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={25} stroke={1.5} aria-hidden="true" /></span><span className="text-xs text-neutral-500">{number}</span></div>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight text-neutral-900">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-neutral-500">{description}</p>
                  <div className="mt-8 flex items-center gap-2 text-[11px] font-medium text-blue-700"><span className="size-1 rounded-full bg-blue-600" />{tag}</div>
                </article>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-neutral-500"><IconShieldCheck size={16} className="mt-1 shrink-0 text-neutral-500" aria-hidden="true" />Platform dalam pengembangan. Prediksi, simulasi, dan hasil analisis akan diberi label sesuai sumber dan metodenya.</p>
          </div>
        </section>

        <section id="cara-kerja" className="section-space scroll-mt-8">
          <div className="site-container grid gap-4 md:grid-cols-[.8fr_1fr]">
            <div><p className="eyebrow">CARA KERJA</p><h2 className="section-title mt-4">Mulai dari sebuah wilayah.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-neutral-500">Alur eksplorasi yang dirancang agar informasi geografis lebih mudah dipahami.</p></div>
            <ol className="divide-y divide-neutral-100">
              {steps.map((step, index) => <li key={step.title} className="flex gap-4 py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xs text-blue-600">0{index + 1}</span><div><h3 className="text-sm font-semibold text-neutral-900">{step.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-500">{step.text}</p></div></li>)}
            </ol>
          </div>
        </section>

        <section className="site-container pb-16">
          <div className="cta-panel relative overflow-hidden rounded-[24px] bg-blue-600 p-4 text-white">
            <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div><p className="text-[10px] font-medium tracking-[.14em] text-blue-200">PERSPEKTIF BARU UNTUK JAWA BARAT</p><h2 className="mt-4 text-[28px] leading-tight font-semibold tracking-[-1px] sm:text-[34px]">Kenali wilayahmu lebih dekat.</h2><p className="mt-4 text-sm leading-6 text-blue-100">Masuk ke ruang WebGIS dan mulai mengenal Bejir.</p></div>
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50"><Link href="/map">Buka WebGIS <IconArrowUpRight aria-hidden="true" /></Link></Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-neutral-100">
        <div className="site-container flex flex-wrap items-center justify-between gap-4 py-8"><div className="flex flex-wrap items-center gap-4"><Brand /><span className="text-xs text-neutral-500">WebGIS Banjir Jawa Barat</span></div><Link href="/map" className="flex items-center gap-2 rounded-md p-2 text-xs text-neutral-500 hover:text-blue-600">Jelajahi platform <IconChevronRight size={14} aria-hidden="true" /></Link></div>
      </footer>
    </>
  );
}
