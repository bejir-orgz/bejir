import Image from "next/image";
import styles from "./landing.module.css";

const panorama = "/images/jabar-river-hero.webp";

export function HeroLandscape() {
  return (
    <>
      <Image src={panorama} alt="" fill sizes="100vw" unoptimized preload className={styles.heroImage} />
      <div className={styles.heroSky} aria-hidden="true">
        {[0, 1, 2].map((cloud) => (
          <svg key={cloud} className={styles.heroCloud} viewBox="0 0 320 36">
            <path fill="#fff" d="M0 29c35-10 68-9 89-15 17-5 33-14 62-14 23 0 43 6 60 12 29 1 73 5 109 16-50 2-89-1-114 2-26 6-57 6-85 2C85 36 36 34 0 29Z" />
          </svg>
        ))}
      </div>
      <svg className={styles.heroScene} viewBox="0 0 1672 941" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="hero-current-light">
            <stop stopColor="#bdf5ff" stopOpacity="0" />
            <stop offset=".45" stopColor="#eaffff" stopOpacity=".9" />
            <stop offset="1" stopColor="#bdf5ff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="hero-river-clip">
            <path d="M477 759Q640 743 774 737L1016 747L1095 770L1150 806L1380 840L1430 908V941H393L386 876L420 827Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#hero-river-clip)" fill="url(#hero-current-light)">
          <g className={styles.riverCurrent}><path d="M496 744q110-12 251-5-140 13-251 5Zm281-19q106-10 244 0-133 12-244 0Z" /></g>
          <g className={styles.riverCurrent}><path d="M305 784q171-16 352-6-176 19-352 6Zm446-22q135-13 308 5-169 12-308-5Z" /></g>
          <g className={styles.riverCurrent}><path d="M455 823q174-18 386 4-201 17-386-4Zm466-18q153-13 310 5-151 14-310-5Z" /></g>
        </g>
      </svg>
    </>
  );
}