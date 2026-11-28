"use client";

import { useTransform, type MotionValue } from "framer-motion";
import * as m from "framer-motion/m";
import styles from "./landing.module.css";

export function HeroLandscape({ progress }: { progress: MotionValue<number> }) {
  // Sequence 1 (0 -> 0.4): Cerah / Normal
  // Sequence 2 (0.4 -> 1.0): Hujan & Pasang (rain + rising river combined)
  const sunGlowOpacity = useTransform(progress, [0, 0.38], [0.95, 0]);
  const daylightLifeOpacity = useTransform(progress, [0.06, 0.36], [1, 0]);
  const stormTintOpacity = useTransform(progress, [0.08, 0.72], [0, 1]);
  const stormCloudsOpacity = useTransform(progress, [0.08, 0.65], [0, 1]);
  const valleyMistOpacity = useTransform(progress, [0, 0.7], [0.34, 0.95]);
  const windowGlowOpacity = useTransform(progress, [0.2, 0.55], [0, 1]);

  const rainLightOpacity = useTransform(progress, [0.12, 0.45], [0, 0.76]);
  const rainMidOpacity = useTransform(progress, [0.2, 0.58], [0, 0.92]);
  const rainHeavyOpacity = useTransform(progress, [0.28, 0.68], [0, 1]);

  // River rises continuously alongside the storm from calm low water (+18px) to high-water pasang (-34px)
  const riverTransform = useTransform(
    progress,
    [0.12, 0.92],
    ["translateY(18px)", "translateY(-34px)"],
  );
  const floodWaterTintOpacity = useTransform(progress, [0.25, 0.9], [0, 0.42]);
  const currentIntensityOpacity = useTransform(progress, [0.1, 0.85], [0.78, 1]);

  // High-water submersion wash and foam wakes rise over the stationary riverbed boulders
  const submersionOpacity = useTransform(progress, [0.32, 0.9], [0, 0.78]);
  const submersionTransform = useTransform(
    progress,
    [0.25, 0.94],
    ["translateY(28px)", "translateY(-30px)"],
  );
  const foamOpacity = useTransform(progress, [0.15, 0.85], [0.22, 0.96]);
  const foamTransform = useTransform(
    progress,
    [0.15, 0.94],
    ["translateY(14px)", "translateY(-24px)"],
  );

  return (
    <>
      {/* Layered animated West Java river valley SVG (Cerah -> Hujan & Pasang) */}
      <svg
        className={styles.heroVectorScene}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          {/* Bright normal morning sky gradient */}
          <linearGradient id="hero-sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cde6ff" />
            <stop offset="46%" stopColor="#e7f3ff" />
            <stop offset="82%" stopColor="#f5faff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Soft daytime sun glow & diagonal light shafts that fade as storm clouds roll in */}
          <radialGradient id="hero-sun-glow" cx="76%" cy="20%" r="32%">
            <stop offset="0%" stopColor="#fff9db" stopOpacity="0.68" />
            <stop offset="48%" stopColor="#fffef4" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-sun-beam" x1="0.8" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Rainy atmosphere tint: lighter at top for hero copy contrast, deeper toward the valley */}
          <linearGradient id="hero-storm-tint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f4f85" stopOpacity="0.16" />
            <stop offset="36%" stopColor="#2f4f85" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#243f70" stopOpacity="0.48" />
          </linearGradient>

          {/* Distant horizon mountains */}
          <linearGradient id="hero-far-mtn-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c3deff" />
            <stop offset="100%" stopColor="#e3f1ff" />
          </linearGradient>
          <linearGradient id="hero-far-mtn-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ec7ff" />
            <stop offset="100%" stopColor="#cde4ff" />
          </linearGradient>

          {/* Left Priangan volcano directional lighting */}
          <linearGradient id="hero-volcano-lit" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#87bcff" />
            <stop offset="55%" stopColor="#5d9df7" />
            <stop offset="100%" stopColor="#3c7de8" />
          </linearGradient>
          <linearGradient id="hero-volcano-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4e8cf2" />
            <stop offset="100%" stopColor="#2c64d4" />
          </linearGradient>
          <linearGradient id="hero-left-ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3777e6" />
            <stop offset="100%" stopColor="#1d4db0" />
          </linearGradient>
          <linearGradient id="hero-left-foothill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2255b8" />
            <stop offset="100%" stopColor="#143782" />
          </linearGradient>

          {/* Right hills */}
          <linearGradient id="hero-right-hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7eb5ff" />
            <stop offset="100%" stopColor="#4e8ff0" />
          </linearGradient>
          <linearGradient id="hero-right-hill-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a8af0" />
            <stop offset="100%" stopColor="#245ac2" />
          </linearGradient>

          {/* Terrace sunlit grass & shaded risers */}
          <linearGradient id="hero-terrace-top-1" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="#cce97c" />
            <stop offset="100%" stopColor="#9ad055" />
          </linearGradient>
          <linearGradient id="hero-terrace-top-2" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="#b8e069" />
            <stop offset="100%" stopColor="#84c048" />
          </linearGradient>
          <linearGradient id="hero-terrace-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3e8a6b" />
            <stop offset="100%" stopColor="#205273" />
          </linearGradient>

          {/* Village plateau grass */}
          <linearGradient id="hero-village-grass" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#bce36e" />
            <stop offset="55%" stopColor="#94cc52" />
            <stop offset="100%" stopColor="#6eaf4a" />
          </linearGradient>

          {/* Shallow alluvial riverbank exposed during normal water level */}
          <linearGradient id="hero-riverbed-bank" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8dbce0" />
            <stop offset="100%" stopColor="#4b89c4" />
          </linearGradient>

          {/* River water depth & bank reflections */}
          <linearGradient id="hero-river-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4f3ff" />
            <stop offset="18%" stopColor="#7fd8ff" />
            <stop offset="55%" stopColor="#45b8fd" />
            <stop offset="100%" stopColor="#2692e8" />
          </linearGradient>
          <linearGradient id="hero-river-surge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#70c4f5" />
            <stop offset="42%" stopColor="#2c8ae0" />
            <stop offset="100%" stopColor="#165eb3" />
          </linearGradient>
          <linearGradient id="hero-bank-reflect-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1966c4" stopOpacity="0.48" />
            <stop offset="65%" stopColor="#2582de" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2582de" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-bank-reflect-r" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#1557b3" stopOpacity="0.52" />
            <stop offset="60%" stopColor="#237bd6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#237bd6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-current-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#eafcff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#eafcff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-mist-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#eaf6ff" stopOpacity="0" />
          </linearGradient>

          {/* Bamboo cylindrical shading */}
          <linearGradient id="hero-bamboo-culm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0b204a" />
            <stop offset="35%" stopColor="#183f7d" />
            <stop offset="68%" stopColor="#2c60a8" />
            <stop offset="100%" stopColor="#0f2959" />
          </linearGradient>

          <clipPath id="hero-vector-river-clip">
            <path d="M0,652 L615,652 Q760,648 965,654 L1600,664 L1600,980 L0,980 Z" />
          </clipPath>
        </defs>

        {/* 1. SKY & WEATHER ATMOSPHERE */}
        <g>
          <rect width="1600" height="900" fill="url(#hero-sky-grad)" />
          <m.g style={{ opacity: sunGlowOpacity }}>
            <rect className={styles.heroSunPulse} width="1600" height="900" fill="url(#hero-sun-glow)" />
            <polygon className={styles.heroSunBeamA} points="1180,0 1340,0 1020,640 830,640" fill="url(#hero-sun-beam)" />
            <polygon className={styles.heroSunBeamB} points="1400,0 1565,0 1300,610 1120,610" fill="url(#hero-sun-beam)" />
          </m.g>
          <m.rect width="1600" height="900" fill="url(#hero-storm-tint)" style={{ opacity: stormTintOpacity }} />

          {/* Calm daytime cumulus clouds with subtle horizontal breathing */}
          <g className={styles.heroCloudBankDrift}>
            <path d="M1040,460 Q1095,388 1175,402 Q1235,328 1335,342 Q1405,252 1505,258 Q1555,190 1605,198 L1605,515 L1010,515 Z" fill="#ffffff" opacity="0.78" />
            <path d="M1115,465 Q1185,412 1275,418 Q1355,348 1455,356 Q1530,295 1605,302 L1605,515 L1090,515 Z" fill="#dbeafe" opacity="0.58" />
          </g>
          <path d="M105,104 Q265,126 445,152 Q285,146 118,122 Z" fill="#ffffff" opacity="0.65" />
          <path d="M1070,322 Q1210,308 1350,298 Q1235,322 1085,332 Z" fill="#ffffff" opacity="0.6" />

          {/* Overcast storm cloud bank fading in during rain phase */}
          <m.g style={{ opacity: stormCloudsOpacity }}>
            <path d="M-20,175 Q95,125 215,150 Q310,96 440,126 Q535,102 640,148 Q510,182 350,184 Q160,186 -20,175 Z" fill="#9fb8db" opacity="0.52" />
            <path d="M980,465 Q1065,375 1165,392 Q1240,312 1350,330 Q1425,244 1525,254 Q1570,192 1610,198 L1610,515 L970,515 Z" fill="#89a8d4" opacity="0.52" />
            <path d="M1090,468 Q1175,405 1275,412 Q1365,342 1468,352 Q1538,295 1610,304 L1610,515 L1075,515 Z" fill="#6d90c2" opacity="0.45" />
          </m.g>
        </g>

        {/* 2. DRIFTING CLOUDS */}
        <g>
          <g className={styles.heroSvgCloudA} opacity="0.88">
            <path d="M0,152 C38,140 72,140 98,131 C118,123 144,116 176,120 C202,123 224,132 248,138 C278,141 312,147 340,158 C275,162 222,159 180,162 C130,165 64,162 0,152 Z" fill="#f8fbff" />
            <path d="M28,154 C96,158 175,158 310,156 C250,163 140,166 28,154 Z" fill="#cbdcf2" opacity="0.72" />
            <m.path d="M14,152 C92,158 188,160 326,156 C262,165 138,168 14,152 Z" fill="#7c9bc7" style={{ opacity: stormCloudsOpacity }} />
          </g>
          <g className={styles.heroSvgCloudB} opacity="0.76">
            <path d="M0,248 C30,238 60,236 86,228 C108,220 132,216 160,222 C184,226 204,234 228,240 C252,243 278,248 300,256 C235,259 182,256 135,258 C88,260 40,256 0,248 Z" fill="#f1f7ff" />
            <path d="M22,250 C92,254 180,254 282,254 C218,260 118,261 22,250 Z" fill="#c7dbf2" opacity="0.68" />
            <m.path d="M12,249 C88,255 184,256 290,254 C224,262 118,263 12,249 Z" fill="#7c9bc7" style={{ opacity: stormCloudsOpacity }} />
          </g>
          <g className={styles.heroSvgCloudC} opacity="0.64">
            <path d="M0,336 C36,326 70,325 98,318 C122,312 150,310 178,317 C206,324 240,330 272,340 C204,342 148,340 96,342 C56,343 26,341 0,336 Z" fill="#eff6ff" />
          </g>
        </g>

        {/* 3. DISTANT VALLEY MOUNTAINS & DRIFTING MIST */}
        <g>
          <path d="M470,565 L598,468 Q622,452 648,468 L735,512 L826,478 Q846,470 866,480 L948,516 L1052,452 Q1074,440 1098,452 L1195,502 L1195,695 L470,695 Z" fill="url(#hero-far-mtn-1)" />
          <path d="M528,595 L664,506 Q684,494 706,506 L790,542 L898,498 Q918,490 938,500 L1035,548 L1158,510 L1158,695 L528,695 Z" fill="url(#hero-far-mtn-2)" />
          <m.g style={{ opacity: valleyMistOpacity }}>
            <rect className={styles.heroValleyMist} x="520" y="535" width="560" height="110" fill="url(#hero-mist-grad)" />
            <rect className={styles.heroValleyMistB} x="460" y="560" width="640" height="96" fill="url(#hero-mist-grad)" opacity="0.7" />
          </m.g>

          {/* Gliding valley birds in calm daylight sky (clear of centered hero copy, fade out in storm) */}
          <m.g style={{ opacity: daylightLifeOpacity }} fill="none" stroke="#234a85" strokeLinecap="round" strokeLinejoin="round">
            <g className={styles.heroBirdGlideA}>
              <g transform="translate(1110, 326)">
                <path className={styles.heroBirdFlapA} d="M-11,2 Q-5,-5 0,0 Q5,-5 11,2" strokeWidth="2.1" />
              </g>
            </g>
            <g className={styles.heroBirdGlideB}>
              <g transform="translate(1164, 304)">
                <path className={styles.heroBirdFlapB} d="M-9,1.5 Q-4,-4 0,0 Q4,-4 9,1.5" strokeWidth="1.8" />
              </g>
            </g>
            <g className={styles.heroBirdGlideC}>
              <g transform="translate(260, 238)">
                <path className={styles.heroBirdFlapC} d="M-8,1.5 Q-3.5,-3.5 0,0 Q3.5,-3.5 8,1.5" strokeWidth="1.7" opacity="0.82" />
              </g>
            </g>
          </m.g>
        </g>

        {/* 4. LEFT PRIANGAN VOLCANO & SCULPTED RIDGES */}
        <g>
          <path d="M-20,378 L142,262 Q160,252 178,262 L236,288 L376,396 L565,500 L745,592 L745,695 L-20,695 Z" fill="url(#hero-volcano-lit)" />
          <path d="M160,256 L130,328 L88,365 L144,344 L172,386 L202,340 L256,368 L236,288 Z" fill="url(#hero-volcano-shade)" opacity="0.72" />
          <path d="M160,256 L112,310 L56,348 L128,324 Z" fill="#9ac9ff" opacity="0.58" />
          <path d="M160,256 L192,314 L268,354 L236,288 Z" fill="#3a76e0" opacity="0.45" />
          <path d="M236,288 L286,356 L362,402 L376,396 Z" fill="#2b63cf" opacity="0.38" />
          <path d="M-20,394 Q55,398 118,422 Q178,434 228,448 Q288,412 365,420 Q422,426 485,468 Q575,522 695,586 Q768,618 848,648 L848,695 L-20,695 Z" fill="url(#hero-left-ridge)" />
          <path d="M228,448 Q288,412 365,420 Q422,426 485,468 Q418,438 358,432 Q292,426 228,448 Z" fill="#68a6ff" opacity="0.55" />
          <path d="M-20,454 Q48,460 112,480 Q188,502 268,530 Q355,556 442,582 Q528,608 618,632 L735,656 L735,695 L-20,695 Z" fill="url(#hero-left-foothill)" />
          <path d="M62,466 C74,446 98,446 108,464 C122,452 146,456 154,474 C168,464 192,470 200,488 C218,478 242,486 250,506 C268,496 292,504 300,522 C318,514 342,522 350,538 C368,532 392,540 400,556 C418,550 442,558 450,572 C470,568 492,576 502,590 C522,586 544,594 554,608 L554,630 L62,530 Z" fill="#1b489c" />
        </g>

        {/* 5. RIGHT HILLS & LAYERED CANOPY */}
        <g>
          <path d="M895,648 Q1005,554 1138,486 Q1285,406 1462,354 Q1535,334 1620,340 L1620,695 L895,695 Z" fill="url(#hero-right-hill-back)" />
          <path d="M1110,498 C1122,480 1144,476 1156,488 C1168,468 1192,462 1206,474 C1218,452 1246,446 1262,458 C1278,434 1308,426 1326,438 C1344,412 1378,402 1398,414 C1418,386 1456,374 1480,388 L1480,450 L1110,540 Z" fill="#5e9ef7" />
          <path d="M935,652 Q1068,578 1222,516 Q1380,452 1620,402 L1620,695 L935,695 Z" fill="url(#hero-right-hill-front)" />
          <path d="M1040,596 Q1165,536 1315,482 Q1448,434 1605,406 Q1455,448 1322,494 Q1174,548 1040,596 Z" fill="#77b3ff" opacity="0.45" />
        </g>

        {/* 6. LEFT SUNDANESE RICE TERRACES (5-TIER SAWAH) */}
        <g>
          <path d="M0,506 Q135,512 268,540 L338,566 L0,566 Z" fill="url(#hero-terrace-top-1)" />
          <path d="M0,506 Q135,512 268,540 Q135,518 0,512 Z" fill="#e5f8a2" opacity="0.85" />
          <path d="M0,520 Q134,526 264,552 L264,564 Q134,538 0,532 Z" fill="url(#hero-terrace-wall)" />

          <path d="M0,530 Q162,538 322,570 L405,598 L0,598 Z" fill="url(#hero-terrace-top-2)" />
          <path d="M0,530 Q162,538 322,570 Q162,544 0,536 Z" fill="#daf394" opacity="0.8" />
          <path d="M0,546 Q160,554 316,584 L316,596 Q160,566 0,558 Z" fill="url(#hero-terrace-wall)" />

          <path d="M0,556 Q190,564 378,598 L470,626 L0,626 Z" fill="url(#hero-terrace-top-1)" />
          <path d="M0,556 Q190,564 378,598 Q190,570 0,562 Z" fill="#e0f69b" opacity="0.8" />
          <path d="M0,574 Q188,582 372,612 L372,626 Q188,596 0,588 Z" fill="#2d6e6e" />

          <path d="M0,584 Q218,592 436,626 L542,648 L0,648 Z" fill="url(#hero-terrace-top-2)" />
          <path d="M0,584 Q218,592 436,626 Q218,598 0,590 Z" fill="#d2ef8b" opacity="0.75" />
          <path d="M0,604 Q216,612 432,640 L432,652 Q216,626 0,618 Z" fill="#215575" />

          <path d="M0,614 Q248,620 495,646 L628,658 L0,662 Z" fill="#82bc4b" />
          <path d="M0,634 Q252,638 498,654 L634,662 L634,695 L0,695 Z" fill="#18426e" />

          <g className={styles.heroPalmLeftSway}>
            <path d="M86,518 Q80,470 68,434" stroke="#163c78" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <g fill="#153973">
              <path d="M68,434 C44,424 26,432 18,446 C38,440 52,438 68,434 Z" />
              <path d="M68,434 C56,410 66,396 80,392 C74,408 72,420 68,434 Z" />
              <path d="M68,434 C88,418 106,422 116,434 C98,430 84,432 68,434 Z" />
              <path d="M68,434 C86,438 102,450 108,464 C94,452 82,444 68,434 Z" />
              <path d="M68,434 C48,442 36,454 32,468 C46,454 56,444 68,434 Z" />
            </g>
          </g>

          <g>
            <path d="M618,648 C622,626 644,616 662,626 C674,606 704,606 716,624 C734,618 754,630 756,648 Z" fill="#1e5385" />
            <path d="M632,634 C640,620 656,618 666,626 C678,610 698,612 708,624 C694,626 662,632 632,634 Z" fill="#4f9d73" />
            <path d="M128,656 C136,624 168,612 192,628 C208,614 238,622 246,644 C262,638 282,646 288,658 Z" fill="#163c73" />
            <path d="M142,638 C154,620 176,618 190,628 C206,618 226,622 234,636 C210,636 172,638 142,638 Z" fill="#3a8575" />
            <path d="M352,656 C362,636 386,630 404,640 C418,632 440,638 448,656 Z" fill="#19447a" />
            <path d="M475,658 C484,644 504,640 518,648 C530,644 546,648 552,658 Z" fill="#1c4a82" />
          </g>
        </g>

        {/* 7. RIGHT RIVERBANK VILLAGE (DAYTIME GLASS -> WARM LIT WINDOWS ON RAIN) */}
        <g>
          <g>
            <path d="M1035,622 C1042,588 1076,574 1102,590 C1118,572 1152,578 1162,606 L1162,632 L1035,632 Z" fill="#1c4f7d" />
            <path d="M1050,602 C1062,582 1086,578 1102,590 C1116,578 1138,582 1146,598 C1118,598 1082,602 1050,602 Z" fill="#4f9e69" />
            <path d="M1202,608 C1208,564 1246,542 1282,556 C1304,536 1344,548 1354,584 L1354,616 L1202,616 Z" fill="#1a4c78" />
            <path d="M1218,580 C1232,554 1262,548 1282,558 C1300,544 1326,550 1338,572 C1308,576 1258,580 1218,580 Z" fill="#6ab85c" />
            <path d="M1412,590 C1420,544 1462,522 1502,538 C1526,518 1568,530 1580,572 L1580,604 L1412,604 Z" fill="#1a4c78" />
            <path d="M1430,564 C1446,536 1478,530 1502,540 C1524,526 1554,534 1564,558 C1530,560 1476,564 1430,564 Z" fill="#76c25b" />
          </g>

          <g className={styles.heroPalmRightSway}>
            <path d="M1379,598 Q1375,542 1385,488 L1390,489 Q1382,542 1387,598 Z" fill="#173a6e" />
            <g fill="#15376b">
              <path d="M1387,488 C1352,472 1324,482 1310,502 C1338,494 1362,492 1387,488 Z" />
              <path d="M1387,488 C1360,460 1368,438 1388,430 C1384,450 1386,468 1387,488 Z" />
              <path d="M1387,488 C1408,454 1436,448 1456,462 C1430,464 1408,474 1387,488 Z" />
              <path d="M1387,488 C1420,472 1450,482 1464,504 C1436,496 1412,494 1387,488 Z" />
              <path d="M1387,488 C1414,498 1434,518 1440,540 C1420,522 1404,506 1387,488 Z" />
              <path d="M1387,488 C1362,502 1344,522 1338,544 C1356,524 1370,506 1387,488 Z" />
            </g>
            <path d="M1387,488 C1364,464 1370,444 1388,434 C1382,452 1384,470 1387,488 Z" fill="#2d64a6" opacity="0.7" />
          </g>

          <path d="M958,648 Q1125,612 1320,600 L1600,592 L1600,680 L948,680 Z" fill="url(#hero-village-grass)" />
          <path d="M975,650 Q1140,618 1330,608 L1600,600 L1600,614 L1330,620 Q1140,630 975,656 Z" fill="#c7eb78" opacity="0.75" />

          {/* Stone embankment extended cleanly down to y=700 so low-water normal state has zero gap */}
          <path d="M1002,662 Q1182,634 1376,624 L1600,618 L1600,700 L972,700 Z" fill="#325080" />
          <path d="M1002,662 Q1182,634 1376,624 L1600,618 L1600,628 L1376,634 Q1182,644 1002,670 Z" fill="#1d345c" opacity="0.75" />
          <g fill="#46689e" opacity="0.65">
            <polygon points="1072,662 1126,654 1128,664 1074,672" />
            <polygon points="1136,653 1192,646 1194,656 1138,663" />
            <polygon points="1204,644 1266,638 1268,648 1206,654" />
            <polygon points="1280,637 1344,632 1346,642 1282,647" />
            <polygon points="1360,631 1428,628 1430,638 1362,641" />
            <polygon points="1444,627 1516,624 1518,634 1446,637" />
            <polygon points="1152,666 1216,659 1218,669 1154,676" />
            <polygon points="1234,658 1304,652 1306,662 1236,668" />
            <polygon points="1322,651 1396,646 1398,656 1324,661" />
          </g>

          {/* Gentle morning hearth wisps rising behind village roofs in Cerah */}
          <m.g style={{ opacity: daylightLifeOpacity }} fill="none" stroke="#ffffff" strokeLinecap="round">
            <path className={styles.heroVillageWispA} d="M1134,580 Q1128,566 1138,554 Q1146,542 1139,530" strokeWidth="3.2" />
            <path className={styles.heroVillageWispB} d="M1422,538 Q1416,522 1427,510 Q1436,496 1429,482" strokeWidth="3.8" />
          </m.g>

          {/* House 1 */}
          <g transform="translate(1096, 576)">
            <ellipse cx="36" cy="63" rx="34" ry="4" fill="#4f8539" opacity="0.55" />
            <rect x="8" y="28" width="38" height="34" fill="#f5faff" />
            <rect x="46" y="28" width="18" height="34" fill="#bdd5f2" />
            <rect x="8" y="28" width="56" height="6" fill="#9bbbe3" opacity="0.65" />
            <polygon points="0,30 27,6 54,30" fill="#214482" />
            <polygon points="27,6 68,28 54,30" fill="#132a57" />
            <path d="M0,30 L27,6 L54,30" fill="none" stroke="#3662ab" strokeWidth="1.5" />
            <rect x="15" y="38" width="9" height="11" rx="1" fill="#6b90be" />
            <rect x="29" y="38" width="9" height="11" rx="1" fill="#6b90be" />
            <m.g style={{ opacity: windowGlowOpacity }}>
              <rect x="15" y="38" width="9" height="11" rx="1" fill="#fde047" />
              <rect x="29" y="38" width="9" height="11" rx="1" fill="#fde047" />
            </m.g>
            <rect x="14" y="49" width="11" height="2" fill="#89a9d4" />
            <rect x="28" y="49" width="11" height="2" fill="#89a9d4" />
          </g>

          {/* House 2 */}
          <g transform="translate(1174, 572)">
            <ellipse cx="34" cy="61" rx="32" ry="4" fill="#4f8539" opacity="0.55" />
            <rect x="8" y="26" width="36" height="34" fill="#eef6ff" />
            <rect x="44" y="26" width="16" height="34" fill="#b4cef0" />
            <rect x="8" y="26" width="52" height="6" fill="#94b5de" opacity="0.65" />
            <polygon points="0,28 28,4 54,28" fill="#1f427d" />
            <polygon points="28,4 65,26 54,28" fill="#122854" />
            <rect x="16" y="36" width="8" height="10" rx="1" fill="#6b90be" />
            <rect x="29" y="36" width="8" height="10" rx="1" fill="#6b90be" />
            <m.g style={{ opacity: windowGlowOpacity }}>
              <rect x="16" y="36" width="8" height="10" rx="1" fill="#fde047" />
              <rect x="29" y="36" width="8" height="10" rx="1" fill="#fde047" />
            </m.g>
          </g>

          {/* House 3 */}
          <g transform="translate(1344, 536)">
            <ellipse cx="76" cy="87" rx="68" ry="6" fill="#477a35" opacity="0.55" />
            <rect x="20" y="38" width="82" height="48" fill="#f7fbff" />
            <rect x="102" y="38" width="34" height="48" fill="#bdd6f5" />
            <rect x="20" y="54" width="82" height="9" fill="#92b4de" opacity="0.72" />
            <polygon points="10,41 68,2 118,41" fill="#23498a" />
            <polygon points="68,2 146,38 118,41" fill="#122752" />
            <path d="M10,41 L68,2 L118,41" fill="none" stroke="#4272bf" strokeWidth="2" />
            <polygon points="2,55 24,42 106,42 106,55" fill="#1b3c75" />
            <line x1="2" y1="55" x2="106" y2="55" stroke="#3c6ab5" strokeWidth="1.5" />
            <rect x="10" y="55" width="4" height="31" fill="#dceafa" />
            <rect x="96" y="55" width="4" height="31" fill="#c4dbf5" />
            <rect x="57" y="57" width="15" height="29" rx="1" fill="#1d3c73" />
            <rect x="60" y="60" width="9" height="10" fill="#6b90be" />
            <rect x="32" y="60" width="14" height="13" rx="1" fill="#6b90be" />
            <rect x="80" y="60" width="13" height="13" rx="1" fill="#6b90be" />
            <rect x="112" y="58" width="13" height="13" rx="1" fill="#597fae" />
            <m.g style={{ opacity: windowGlowOpacity }}>
              <rect x="60" y="60" width="9" height="10" fill="#fde047" opacity="0.88" />
              <rect x="32" y="60" width="14" height="13" rx="1" fill="#fde047" />
              <rect x="80" y="60" width="13" height="13" rx="1" fill="#fde047" />
              <rect x="112" y="58" width="13" height="13" rx="1" fill="#facc15" />
            </m.g>
            <rect x="30" y="73" width="18" height="2" fill="#89a9d4" />
            <rect x="78" y="73" width="17" height="2" fill="#89a9d4" />
          </g>
        </g>

        {/* Shallow riverbed / bank base visible beneath the calm waterline */}
        <path d="M0,654 Q460,650 820,654 Q1220,658 1600,668 L1600,900 L0,900 Z" fill="url(#hero-riverbed-bank)" />

        {/* 8A. RISING RIVER SURFACE (CALM NORMAL -> HIGH-WATER PASANG) */}
        <m.g style={{ transform: riverTransform }}>
          <path d="M0,652 L615,652 Q760,648 965,654 L1600,664 L1600,980 L0,980 Z" fill="url(#hero-river-base)" />
          <m.path
            d="M0,652 L615,652 Q760,648 965,654 L1600,664 L1600,980 L0,980 Z"
            fill="url(#hero-river-surge)"
            style={{ opacity: floodWaterTintOpacity }}
          />
          <path d="M0,652 L540,652 Q420,730 330,980 L0,980 Z" fill="url(#hero-bank-reflect-l)" />
          <path d="M1040,654 L1600,664 L1600,980 L1200,980 Q1180,750 1040,654 Z" fill="url(#hero-bank-reflect-r)" />
          <path d="M620,654 Q760,650 930,656 Q840,674 680,676 Q510,678 440,694 Q670,698 920,696 Q1100,694 1140,710 Q890,716 640,722 Q450,726 420,746 Q680,748 940,756 Q1160,762 1190,786 Q870,790 610,806 Q460,816 520,842 Q760,836 1050,860 L960,886 Q670,866 430,874 Q320,836 470,804 Q720,782 990,774 Q740,762 490,758 Q330,748 450,722 Q670,708 910,702 Q660,696 420,692 Q470,670 620,654 Z" fill="#b4eeff" opacity="0.52" />
          <path d="M520,660 Q765,653 1020,662 Q780,672 520,660 Z" fill="#e6fbff" opacity="0.9" />

          <m.g clipPath="url(#hero-vector-river-clip)" style={{ opacity: currentIntensityOpacity }}>
            <g className={styles.heroRiverCurrentA}>
              <path d="M180,686 Q430,676 680,686 Q430,694 180,686 Z" fill="url(#hero-current-grad)" opacity="0.82" />
              <path d="M260,716 Q490,704 720,716 Q490,726 260,716 Z" fill="url(#hero-current-grad)" />
              <path d="M840,732 Q1080,718 1310,732 Q1080,742 840,732 Z" fill="url(#hero-current-grad)" />
            </g>
            <g className={styles.heroRiverCurrentB}>
              <path d="M130,774 Q450,754 780,776 Q450,792 130,774 Z" fill="url(#hero-current-grad)" />
              <path d="M770,796 Q1090,776 1410,798 Q1090,812 770,796 Z" fill="url(#hero-current-grad)" />
            </g>
            <g className={styles.heroRiverCurrentC}>
              <path d="M270,846 Q650,822 1030,848 Q650,868 270,846 Z" fill="url(#hero-current-grad)" />
              <path d="M980,872 Q1280,852 1550,874 Q1280,888 980,872 Z" fill="url(#hero-current-grad)" />
            </g>
          </m.g>

          {/* Sunlit specular water glints sparkling on calm daylight river */}
          <m.g clipPath="url(#hero-vector-river-clip)" style={{ opacity: daylightLifeOpacity }} fill="#ffffff">
            <path className={styles.heroWaterGlintA} d="M472,724 L476,727 L472,730 L468,727 Z" />
            <path className={styles.heroWaterGlintB} d="M624,698 L629,701 L624,704 L619,701 Z" />
            <path className={styles.heroWaterGlintC} d="M756,738 L762,741 L756,744 L750,741 Z" />
            <path className={styles.heroWaterGlintA} d="M904,708 L909,711 L904,714 L899,711 Z" />
            <path className={styles.heroWaterGlintB} d="M1032,754 L1038,757 L1032,760 L1026,757 Z" />
            <path className={styles.heroWaterGlintC} d="M1152,718 L1157,721 L1152,724 L1147,721 Z" />
            <path className={styles.heroWaterGlintA} d="M674,782 L680,785 L674,788 L668,785 Z" />
          </m.g>
        </m.g>

        {/* 8B. ANCHORED RIVER BOULDERS (STATIONARY IN RIVERBED) */}
        <g>
          <ellipse cx="348" cy="734" rx="84" ry="12" fill="#1652a3" opacity="0.4" />
          <path d="M268,724 L286,684 L322,666 L372,668 L408,688 L426,718 Q364,732 268,724 Z" fill="#1e3466" />
          <polygon points="286,684 322,666 372,668 352,688 308,694" fill="#5273b5" opacity="0.72" />
          <polygon points="372,668 408,688 426,718 362,726 352,688" fill="#132347" opacity="0.82" />

          <path d="M522,706 L534,686 L558,682 L582,688 L592,706 Z" fill="#22386b" />
          <polygon points="534,686 558,682 566,694 538,696" fill="#4f6fad" opacity="0.65" />
          <path d="M636,704 L646,691 L664,690 L678,704 Z" fill="#273f75" />

          <path d="M1060,716 L1076,694 L1106,690 L1132,696 L1144,716 Z" fill="#213769" />
          <polygon points="1076,694 1106,690 1114,702 1082,704" fill="#4f6fad" opacity="0.65" />

          <ellipse cx="1224" cy="738" rx="52" ry="7" fill="#144d9c" opacity="0.38" />
          <path d="M1176,732 L1190,698 L1224,692 L1254,700 L1270,732 Z" fill="#1a2f5e" />
          <polygon points="1190,698 1224,692 1232,708 1196,712" fill="#4c6ca8" opacity="0.68" />

          <ellipse cx="1485" cy="774" rx="132" ry="15" fill="#11448f" opacity="0.42" />
          <path d="M1288,726 L1328,672 L1398,658 L1488,660 L1565,678 L1600,698 L1600,764 L1282,740 Z" fill="#1a2e5c" />
          <polygon points="1328,672 1398,658 1476,662 1435,686 1352,692" fill="#4b6ca8" opacity="0.65" />
          <path d="M1402,764 L1432,716 L1496,704 L1562,712 L1600,738 L1600,774 Z" fill="#122247" />
          <polygon points="1432,716 1496,704 1528,720 1456,730" fill="#3a5994" opacity="0.6" />
        </g>

        {/* 8C. BOULDER RIPPLES, HIGH-WATER SUBMERSION WASH & RISING FOAM WAKES */}
        <g>
          {/* Expanding concentric ripples around exposed rocks during calm daylight flow */}
          <m.g style={{ opacity: daylightLifeOpacity }} fill="none" stroke="#ebfcff" strokeWidth="2">
            <ellipse className={styles.heroBoulderRippleA} cx="348" cy="728" rx="84" ry="11" />
            <ellipse className={styles.heroBoulderRippleB} cx="556" cy="708" rx="40" ry="5.5" />
            <ellipse className={styles.heroBoulderRippleC} cx="1224" cy="734" rx="54" ry="7.5" />
          </m.g>
          <m.g style={{ opacity: submersionOpacity, transform: submersionTransform }}>
            <path d="M0,702 Q420,692 840,700 Q1240,704 1600,722 L1600,980 L0,980 Z" fill="url(#hero-river-base)" />
            <path d="M0,704 Q420,695 840,703 Q1240,707 1600,724" fill="none" stroke="#e6fbff" strokeWidth="3" opacity="0.72" />
          </m.g>
          <m.g style={{ opacity: foamOpacity, transform: foamTransform }}>
            <path className={styles.heroRiverFoam} d="M242,724 Q285,714 352,718 Q412,720 446,728 Q396,736 346,734 Q284,734 242,724 Z" fill="#ebfcff" opacity="0.88" />
            <ellipse className={styles.heroRiverFoam} cx="556" cy="706" rx="44" ry="5.5" fill="#ebfcff" opacity="0.8" />
            <ellipse className={styles.heroRiverFoam} cx="1102" cy="716" rx="50" ry="6.5" fill="#ebfcff" opacity="0.8" />
            <ellipse className={styles.heroRiverFoam} cx="1222" cy="732" rx="60" ry="7.5" fill="#ebfcff" opacity="0.85" />
            <path className={styles.heroRiverFoam} d="M1340,758 Q1425,746 1515,754 Q1570,760 1605,772 Q1530,780 1445,774 Q1380,770 1340,758 Z" fill="#ebfcff" opacity="0.88" />
          </m.g>
        </g>

        {/* 9. FOREGROUND FRAMING BOTANICALS */}
        <g>
          <g className={styles.heroBambooSway}>
            <path d="M24,638 L80,0 L91,0 L37,638 Z" fill="#194280" />
            <path d="M-6,625 L48,0 L65,0 L14,625 Z" fill="url(#hero-bamboo-culm)" />
            <g stroke="#4f83cc" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
              <line x1="39" y1="118" x2="57" y2="120" />
              <line x1="28" y1="242" x2="46" y2="244" />
              <line x1="17" y1="366" x2="35" y2="368" />
              <line x1="6" y1="490" x2="24" y2="492" />
            </g>
            <g stroke="#14356b" strokeWidth="2" fill="none">
              <path d="M55,108 Q86,102 114,108" />
              <path d="M78,26 Q112,20 142,32" />
            </g>
            <g fill="#0f2b5c">
              <path d="M60,106 C104,84 148,88 184,108 C142,102 102,104 60,106 Z" />
              <path d="M62,106 C108,110 152,130 176,162 C136,142 100,124 62,106 Z" />
              <path d="M58,108 C88,136 110,170 118,204 C96,172 78,140 58,108 Z" />
              <path d="M84,26 C126,12 168,18 202,42 C158,32 122,28 84,26 Z" />
              <path d="M84,26 C126,40 162,68 182,100 C146,76 116,50 84,26 Z" />
              <path d="M82,28 C104,62 118,96 120,128 C102,94 92,62 82,28 Z" />
            </g>
            <g fill="#2659a3" opacity="0.82">
              <path d="M60,106 C98,90 138,94 170,108 C134,100 98,102 60,106 Z" />
              <path d="M84,26 C122,16 160,22 190,42 C152,32 118,28 84,26 Z" />
            </g>
          </g>

          <g className={styles.heroBushLeftSway}>
            <path d="M-10,900 L-10,648 Q74,710 140,788 Q194,842 258,900 Z" fill="#0f2654" />
            <path d="M-10,798 C58,728 134,700 202,692 C142,734 78,768 -10,798 Z" fill="#1c478a" />
            <path d="M-10,798 C56,734 126,708 190,698 C130,722 66,752 -10,798 Z" fill="#326bc2" opacity="0.55" />
            <path d="M-10,852 C78,794 162,776 236,780 C166,812 86,838 -10,852 Z" fill="#2355a0" />
            <path d="M-10,852 C74,798 152,784 222,784 C154,798 78,822 -10,852 Z" fill="#3b78d4" opacity="0.5" />
            <path d="M44,900 C134,844 228,830 310,842 C228,866 142,886 44,900 Z" fill="#163770" />
            <path d="M12,900 C88,864 164,860 228,874 C158,886 86,894 12,900 Z" fill="#2a60b0" opacity="0.7" />
          </g>

          <g className={styles.heroBananaSway}>
            <path d="M1610,336 C1546,290 1502,262 1478,248 C1518,256 1566,278 1610,308 Z" fill="#0f2a59" />
            <path d="M1610,322 C1556,286 1514,264 1482,250" stroke="#2d63ad" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M1610,432 C1548,390 1492,374 1446,382 L1460,392 L1436,386 C1424,390 1412,396 1404,404 C1468,406 1534,422 1610,466 Z" fill="#133369" />
            <path d="M1610,432 C1548,390 1492,374 1446,382 L1460,392 L1436,386 C1424,390 1412,396 1404,404 C1472,396 1538,406 1610,446 Z" fill="#2659a3" opacity="0.68" />
            <path d="M1610,448 C1540,410 1472,398 1408,404" stroke="#3c74c4" strokeWidth="2.2" fill="none" opacity="0.75" />
            <path d="M1610,506 C1536,466 1482,474 1442,516 C1496,508 1550,514 1610,542 Z" fill="#1a4080" />
            <path d="M1610,506 C1536,466 1482,474 1442,516 C1496,496 1550,498 1610,522 Z" fill="#2f67b5" opacity="0.55" />
            <path d="M1610,702 C1542,648 1506,626 1486,616 C1532,626 1574,650 1610,676 Z" fill="#112d5e" />
            <path d="M1610,702 C1542,648 1506,626 1486,616 C1536,634 1574,658 1610,688 Z" fill="#245399" opacity="0.5" />
          </g>
        </g>

        {/* 10. STAGGERED SCROLL-DRIVEN RAINFALL (HIDDEN AT NORMAL/CERAH) */}
        <g stroke="#dbeafe" strokeWidth="1.8" strokeLinecap="round">
          <m.g style={{ opacity: rainHeavyOpacity }}>
            <g className={styles.heroRainDropA}>
              <line x1="180" y1="60" x2="155" y2="145" />
              <line x1="420" y1="120" x2="395" y2="205" />
              <line x1="680" y1="40" x2="655" y2="125" />
              <line x1="940" y1="110" x2="915" y2="195" />
              <line x1="1220" y1="70" x2="1195" y2="155" />
              <line x1="1440" y1="140" x2="1415" y2="225" />
              <line x1="300" y1="360" x2="275" y2="445" />
              <line x1="820" y1="340" x2="795" y2="425" />
              <line x1="1310" y1="380" x2="1285" y2="465" />
            </g>
          </m.g>
          <m.g style={{ opacity: rainMidOpacity }}>
            <g className={styles.heroRainDropB}>
              <line x1="260" y1="180" x2="238" y2="255" />
              <line x1="540" y1="80" x2="518" y2="155" />
              <line x1="790" y1="190" x2="768" y2="265" />
              <line x1="1080" y1="60" x2="1058" y2="135" />
              <line x1="1360" y1="210" x2="1338" y2="285" />
              <line x1="610" y1="410" x2="588" y2="485" />
              <line x1="1040" y1="430" x2="1018" y2="505" />
            </g>
          </m.g>
          <m.g style={{ opacity: rainLightOpacity }}>
            <g className={styles.heroRainDropC}>
              <line x1="120" y1="280" x2="98" y2="355" />
              <line x1="460" y1="290" x2="438" y2="365" />
              <line x1="900" y1="250" x2="878" y2="325" />
              <line x1="1180" y1="300" x2="1158" y2="375" />
              <line x1="1490" y1="320" x2="1468" y2="395" />
            </g>
          </m.g>
        </g>
      </svg>

      {/* Mid-depth 3D topographic contour strata floating above the river valley */}
      <svg className={styles.heroContours3d} viewBox="0 0 1440 520" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="#1d4ed8" strokeWidth="1.2">
          <path opacity="0.18" d="M-40 385 Q190 295 430 355 T920 330 T1480 375" />
          <path opacity="0.14" d="M-40 422 Q220 335 470 392 T980 368 T1480 412" />
          <path opacity="0.11" d="M-40 458 Q260 378 520 426 T1040 404 T1480 448" />
        </g>
      </svg>
    </>
  );
}
