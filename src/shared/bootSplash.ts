/**
 * Inline dark login-style wash + BlazeAudit branded loading backdrop for the
 * pre-React / Electron data-URL splash and index.html persistent boot overlay.
 *
 * REVERSIBLE TOGGLE: flip `ENABLE_BRANDED_LOADING_SCREEN` to `false` to restore
 * the plain minimal spinner across boot splash, LoadingOverlay, and PdfExportOverlay.
 */
import {
  BOOT_PHOTO_BOTTOM_LEFT_CENTER_URL,
  BOOT_PHOTO_RIGHT_MID_URL,
  BOOT_PHOTO_TOP_LEFT_URL,
} from './loadingAssets';

export const ENABLE_BRANDED_LOADING_SCREEN = true;

export const BOOT_SYNC_SCRIPT = `<script>document.documentElement.style.setProperty('--ba-sync','-' + ((Date.now()%180000)/1000).toFixed(3) + 's');</script>`;

export const BOOT_SPLASH_AUTH_BG_CSS = `
  .ba-boot-auth-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
  .ba-boot-auth-bg__base {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 8% -5%, rgb(249 115 22 / 0.28), transparent 55%),
      radial-gradient(ellipse 60% 50% at 92% 8%, rgb(14 165 233 / 0.18), transparent 52%),
      radial-gradient(ellipse 50% 40% at 70% 90%, rgb(234 88 12 / 0.16), transparent 55%),
      linear-gradient(165deg, #0c0a09 0%, #09090b 42%, #0a0f14 100%);
  }
  .ba-boot-auth-bg__glow {
    position: absolute; border-radius: 9999px; filter: blur(40px); opacity: 0.7;
  }
  .ba-boot-auth-bg__glow--a {
    left: -8%; top: 15%; width: 42%; height: 50%;
    background: rgb(249 115 22 / 0.22);
    animation: ba-boot-drift 14s ease-in-out infinite alternate;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__glow--b {
    right: -10%; top: 5%; width: 45%; height: 55%;
    background: rgb(14 165 233 / 0.16);
    animation: ba-boot-drift 18s ease-in-out infinite alternate-reverse;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__glow--c {
    left: 30%; bottom: -20%; width: 50%; height: 45%;
    background: rgb(194 65 12 / 0.18);
    animation: ba-boot-drift 16s ease-in-out infinite alternate;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__lines {
    position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.96;
  }
  .ba-boot-auth-bg__sweep--1 {
    will-change: transform;
    opacity: 0.94;
    animation: ba-boot-sweep-1 14s ease-in-out infinite alternate; transform-origin: center;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__sweep--2 {
    will-change: transform;
    opacity: 0.88;
    animation: ba-boot-sweep-2 19s ease-in-out infinite alternate-reverse; transform-origin: center;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__grid {
    stroke: rgb(249 115 22 / 0.16); opacity: 0.36;
  }
  .ba-boot-auth-bg__pulse {
    will-change: transform, opacity;
    transform-box: fill-box; transform-origin: center;
    animation: ba-boot-ring 5.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__orbit {
    will-change: transform, opacity;
    transform-box: fill-box; transform-origin: center;
    animation: ba-boot-orbit 11s ease-in-out infinite alternate;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-boot-auth-bg__pulse--flame { stroke: rgb(249 115 22 / 0.48); }
  .ba-boot-auth-bg__pulse--sky { stroke: rgb(56 189 248 / 0.34); }
  .ba-boot-auth-bg__pulse--delay { animation-delay: calc(var(--ba-sync, 0s) + 1.85s); }
  .ba-boot-auth-bg__pulse--delay-2 { animation-delay: calc(var(--ba-sync, 0s) + 3.65s); }
  @keyframes ba-boot-drift {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(3%, -2%, 0) scale(1.06); }
  }
  @keyframes ba-boot-sweep-1 {
    from { transform: translate3d(-4.5%, -1.6%, 0) scaleY(0.97); }
    to { transform: translate3d(4.5%, 1.6%, 0) scaleY(1.03); }
  }
  @keyframes ba-boot-sweep-2 {
    from { transform: translate3d(-4%, 1.4%, 0) scaleY(1.03); }
    to { transform: translate3d(4%, -1.4%, 0) scaleY(0.97); }
  }
  @keyframes ba-boot-ring {
    0% { transform: scale(0.58); opacity: 0; }
    18% { opacity: 0.78; }
    72% { opacity: 0.28; }
    100% { transform: scale(1.52); opacity: 0; }
  }
  @keyframes ba-boot-orbit {
    from { transform: translate3d(-24px, -16px, 0) scale(0.92); opacity: 0.32; }
    to { transform: translate3d(26px, 18px, 0) scale(1.12); opacity: 0.62; }
  }
`;

export const BOOT_SPLASH_BRAND_CSS = `
  .ba-loading-photos {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 1;
  }
  .ba-loading-photo {
    position: absolute; height: auto; user-select: none; -webkit-user-drag: none;
    image-rendering: auto;
    will-change: transform;
    mix-blend-mode: screen;
    filter: saturate(1.12) contrast(1.08);
    mask-image: radial-gradient(ellipse 72% 70% at 50% 50%, #000 26%, rgb(0 0 0 / 0.65) 58%, transparent 92%);
    -webkit-mask-image: radial-gradient(ellipse 72% 70% at 50% 50%, #000 26%, rgb(0 0 0 / 0.65) 58%, transparent 92%);
  }
  /* 1) Top-left artistic macro zone */
  .ba-loading-photo--top-left {
    left: -6%; top: -8%;
    width: clamp(30rem, 47vw, 45rem);
    opacity: 0.28;
    animation: ba-photo-float-tl 18s ease-in-out infinite alternate;
    animation-delay: var(--ba-sync, 0s);
  }
  /* 2) Right-middle artistic macro zone */
  .ba-loading-photo--right-mid {
    right: -8%; top: 14%;
    width: clamp(31rem, 49vw, 47rem);
    opacity: 0.28;
    animation: ba-photo-float-rm 20s ease-in-out infinite alternate;
    animation-delay: var(--ba-sync, 0s);
  }
  /* 3) Bottom center / slightly left artistic macro zone */
  .ba-loading-photo--bottom-center-left {
    left: 7%; bottom: -14%;
    width: clamp(30rem, 46vw, 44rem);
    opacity: 0.27;
    animation: ba-photo-float-bc 19s ease-in-out infinite alternate-reverse;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-loading-brand {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    margin-top: -2.25rem;
    margin-bottom: 1.35rem; pointer-events: none; user-select: none;
    -webkit-font-smoothing: antialiased;
  }
  .ba-loading-brand--logo-only {
    margin-top: -1.5rem;
    margin-bottom: 1.25rem;
  }
  .ba-loading-brand__halo {
    position: absolute; top: -1.75rem; width: 17rem; height: 17rem; border-radius: 9999px;
    background: radial-gradient(circle, rgb(249 115 22 / 0.3) 0%, rgb(249 115 22 / 0.08) 50%, transparent 74%);
    filter: blur(22px); z-index: -1;
  }
  .ba-loading-brand__logo {
    width: clamp(8.5rem, 18vmin, 11.5rem); height: auto;
    opacity: 0.74;
    filter: drop-shadow(0 0 26px rgb(249 115 22 / 0.45)) drop-shadow(0 0 8px rgb(251 146 60 / 0.25));
    animation: ba-brand-breathe 4.2s ease-in-out infinite;
    animation-delay: var(--ba-sync, 0s);
  }
  .ba-loading-brand__wordmark-svg {
    margin-top: 1.05rem;
    width: clamp(15.5rem, 31vmin, 21.5rem);
    height: auto;
    opacity: 0.86;
    filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.5));
  }
  .ba-loading-brand__badge {
    margin-top: 0.8rem;
    padding: 0.34rem 1.05rem;
    border-radius: 9999px;
    border: 1px solid rgb(249 115 22 / 0.26);
    background: linear-gradient(90deg, rgb(249 115 22 / 0.1), rgb(255 255 255 / 0.03), rgb(14 165 233 / 0.08));
    font-family: 'Bahnschrift', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-variation-settings: 'wght' 600, 'wdth' 104;
    font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.24em;
    text-transform: uppercase; color: #fdba74; opacity: 0.72;
  }
  .ba-loading-brand__sub {
    margin-top: 0.55rem;
    display: flex; align-items: center; gap: 0.65rem;
    font-family: 'Bahnschrift', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-variation-settings: 'wght' 500, 'wdth' 106;
    font-size: 0.625rem; font-weight: 600; letter-spacing: 0.34em;
    text-transform: uppercase; color: #d4d4d8; opacity: 0.46;
  }
  .ba-loading-brand__sub::before,
  .ba-loading-brand__sub::after {
    content: ''; display: block; width: 1.85rem; height: 1px;
    background: linear-gradient(90deg, transparent, rgb(249 115 22 / 0.55), transparent);
  }
  @keyframes ba-brand-breathe {
    0%, 100% { opacity: 0.64; transform: scale(0.98); }
    50% { opacity: 0.82; transform: scale(1.028); }
  }
  @keyframes ba-photo-float-tl {
    from { transform: translate3d(0, 0, 0) rotate(-3deg); }
    to { transform: translate3d(7px, 8px, 0) rotate(-1.5deg); }
  }
  @keyframes ba-photo-float-rm {
    from { transform: translate3d(0, 0, 0) rotate(3deg); }
    to { transform: translate3d(-8px, -7px, 0) rotate(1.5deg); }
  }
  @keyframes ba-photo-float-bc {
    from { transform: translate3d(0, 0, 0) rotate(-2.5deg); }
    to { transform: translate3d(8px, -6px, 0) rotate(-1deg); }
  }
`;

export const BOOT_SPLASH_AUTH_BG_HTML = `
<div class="ba-boot-auth-bg" aria-hidden="true">
  <div class="ba-boot-auth-bg__base"></div>
  <div class="ba-boot-auth-bg__glow ba-boot-auth-bg__glow--a"></div>
  <div class="ba-boot-auth-bg__glow ba-boot-auth-bg__glow--b"></div>
  <div class="ba-boot-auth-bg__glow ba-boot-auth-bg__glow--c"></div>
  <svg class="ba-boot-auth-bg__lines" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="ba-boot-line" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(249 115 22)" stop-opacity="0" />
        <stop offset="32%" stop-color="rgb(251 146 60)" stop-opacity="0.78" />
        <stop offset="68%" stop-color="rgb(56 189 248)" stop-opacity="0.52" />
        <stop offset="100%" stop-color="rgb(56 189 248)" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="ba-boot-line-2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(234 88 12)" stop-opacity="0" />
        <stop offset="42%" stop-color="rgb(251 146 60)" stop-opacity="0.68" />
        <stop offset="78%" stop-color="rgb(14 165 233)" stop-opacity="0.42" />
        <stop offset="100%" stop-color="rgb(14 165 233)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g class="ba-boot-auth-bg__sweep--1" fill="none" stroke="url(#ba-boot-line)" stroke-width="1.65">
      <path d="M-80 620 C 180 520, 320 480, 520 500 S 880 620, 1280 420" />
      <path d="M-40 680 C 220 560, 400 540, 600 560 S 960 680, 1320 480" />
      <path d="M-120 540 C 140 460, 360 420, 560 440 S 900 520, 1300 340" />
    </g>
    <g class="ba-boot-auth-bg__sweep--2" fill="none" stroke="url(#ba-boot-line-2)" stroke-width="1.35">
      <path d="M-60 200 C 200 280, 380 300, 560 260 S 920 120, 1280 180" />
      <path d="M-100 260 C 160 340, 420 360, 640 300 S 980 160, 1340 220" />
      <path d="M 100 120 C 360 80, 520 140, 720 100 S 1040 40, 1400 90" />
    </g>
    <g class="ba-boot-auth-bg__grid" fill="none" stroke-width="0.75">
      <path d="M100 0 V800 M250 0 V800 M400 0 V800 M550 0 V800 M700 0 V800 M850 0 V800 M1000 0 V800" />
      <path d="M0 120 H1200 M0 260 H1200 M0 400 H1200 M0 540 H1200 M0 680 H1200" />
    </g>
    <circle class="ba-boot-auth-bg__pulse ba-boot-auth-bg__pulse--flame" cx="600" cy="390" r="135" fill="none" stroke-width="1.4" />
    <circle class="ba-boot-auth-bg__pulse ba-boot-auth-bg__pulse--sky ba-boot-auth-bg__pulse--delay" cx="600" cy="390" r="210" fill="none" stroke-width="1.25" />
    <circle class="ba-boot-auth-bg__pulse ba-boot-auth-bg__pulse--flame ba-boot-auth-bg__pulse--delay-2" cx="600" cy="390" r="295" fill="none" stroke-width="1.1" />
    <circle class="ba-boot-auth-bg__orbit ba-boot-auth-bg__pulse--flame" cx="270" cy="230" r="92" fill="none" stroke-width="1.15" />
    <circle class="ba-boot-auth-bg__orbit ba-boot-auth-bg__pulse--sky ba-boot-auth-bg__pulse--delay" cx="930" cy="560" r="115" fill="none" stroke-width="1.15" />
  </svg>
</div>
`;

export const BOOT_SPLASH_PHOTOS_HTML = `
<div class="ba-loading-photos" aria-hidden="true">
  <img class="ba-loading-photo ba-loading-photo--top-left" src="${BOOT_PHOTO_TOP_LEFT_URL}" alt="" draggable="false" />
  <img class="ba-loading-photo ba-loading-photo--right-mid" src="${BOOT_PHOTO_RIGHT_MID_URL}" alt="" draggable="false" />
  <img class="ba-loading-photo ba-loading-photo--bottom-center-left" src="${BOOT_PHOTO_BOTTOM_LEFT_CENTER_URL}" alt="" draggable="false" />
</div>
`;

export const BLAZE_WORDMARK_BLAZE_PATH =
  'M8 6 H23 C30.5 6 34.5 9.6 34.5 14.5 C34.5 18.2 32.2 20.8 28.5 21.7 C33.2 22.6 36 25.6 36 30 C36 35 31.8 38 24 38 H8 Z M13.6 10.8 V19.5 H22.2 C26.5 19.5 28.8 17.8 28.8 15.1 C28.8 12.4 26.5 10.8 22.2 10.8 Z M13.6 24.1 V33.2 H23.2 C27.8 33.2 30.2 31.5 30.2 28.6 C30.2 25.8 27.8 24.1 23.2 24.1 Z ' +
  'M52 6 H57.6 V32.8 H76 V38 H52 Z ' +
  'M102.4 6 H107.8 L122 38 H116 L112.7 30.2 H97.5 L94.2 38 H88.2 Z M99.5 25.4 H110.7 L105.1 12.1 Z ' +
  'M135 6 H162.5 V10.8 L142.4 32.8 H163 V38 H134.5 V33.2 L154.6 11.2 H135 Z ' +
  'M179 6 H204 V11.2 H184.6 V19.4 H201.5 V24.5 H184.6 V32.8 H204.5 V38 H179 Z';

export const BLAZE_WORDMARK_AUDIT_PATH =
  'M244.4 6 H249.8 L264 38 H258 L254.7 30.2 H239.5 L236.2 38 H230.2 Z M241.5 25.4 H252.7 L247.1 12.1 Z ' +
  'M279 6 H284.6 V24.8 C284.6 30.4 288 33.3 293 33.3 C298 33.3 301.4 30.4 301.4 24.8 V6 H307 V25 C307 33.4 301.4 38.5 293 38.5 C284.6 38.5 279 33.4 279 25 Z ' +
  'M325 6 H338.5 C348.8 6 355.5 12.4 355.5 22 C355.5 31.6 348.8 38 338.5 38 H325 Z M330.6 11.2 V32.8 H338.2 C345.4 32.8 349.7 28.6 349.7 22 C349.7 15.4 345.4 11.2 338.2 11.2 Z ' +
  'M373 6 H378.6 V38 H373 Z ' +
  'M395 6 H423 V11.2 H411.8 V38 H406.2 V11.2 H395 Z';

export const BLAZE_SHIELD_SVG_PATH =
  'M166.0 61.5 L156.0 52.0 L157.0 63.0 Q158.0 74.0 156.0 82.5 Q154.0 91.0 149.0 100.5 Q144.0 110.0 128.0 130.0 Q112.0 150.0 102.0 164.5 Q92.0 179.0 87.5 188.5 Q83.0 198.0 80.0 208.0 Q77.0 218.0 76.5 231.5 Q76.0 245.0 79.5 259.0 Q83.0 273.0 90.0 284.5 Q97.0 296.0 106.0 305.0 Q115.0 314.0 131.5 324.5 Q148.0 335.0 153.0 340.0 L158.0 345.0 L155.0 335.5 Q152.0 326.0 140.5 310.0 Q129.0 294.0 126.0 282.0 Q123.0 270.0 124.5 256.5 Q126.0 243.0 129.0 235.0 Q132.0 227.0 138.0 217.0 Q144.0 207.0 154.0 196.5 L164.0 186.0 L163.5 199.0 Q163.0 212.0 164.5 217.0 Q166.0 222.0 169.0 227.5 Q172.0 233.0 182.5 245.0 Q193.0 257.0 197.5 265.0 Q202.0 273.0 203.5 278.5 Q205.0 284.0 204.5 295.0 Q204.0 306.0 201.5 313.5 Q199.0 321.0 193.5 330.0 L188.0 339.0 L194.0 336.0 Q200.0 333.0 210.0 325.5 Q220.0 318.0 227.5 310.0 Q235.0 302.0 239.0 296.0 Q243.0 290.0 247.5 280.0 Q252.0 270.0 254.5 260.5 Q257.0 251.0 257.5 231.0 Q258.0 211.0 254.0 196.5 Q250.0 182.0 246.5 175.0 Q243.0 168.0 233.0 155.5 L223.0 143.0 L223.5 159.0 Q224.0 175.0 220.0 186.0 Q216.0 197.0 212.0 202.5 Q208.0 208.0 203.0 212.0 L198.0 216.0 L193.5 212.0 Q189.0 208.0 187.5 200.0 Q186.0 192.0 192.0 173.0 Q198.0 154.0 198.5 137.0 Q199.0 120.0 197.0 112.0 Q195.0 104.0 189.5 93.0 Q184.0 82.0 180.0 76.5 Q176.0 71.0 166.0 61.5 Z M179.5 19.0 L165.0 9.0 L151.5 18.5 Q138.0 28.0 122.0 36.0 Q106.0 44.0 83.5 51.0 Q61.0 58.0 38.0 62.0 Q15.0 66.0 12.5 68.0 Q10.0 70.0 9.0 73.0 Q8.0 76.0 8.0 130.0 Q8.0 184.0 9.5 198.5 Q11.0 213.0 15.5 229.5 Q20.0 246.0 27.5 262.0 Q35.0 278.0 42.0 288.5 Q49.0 299.0 63.5 315.0 Q78.0 331.0 90.0 341.0 Q102.0 351.0 119.0 362.5 Q136.0 374.0 152.5 382.5 L169.0 391.0 L191.5 378.0 Q214.0 365.0 232.5 350.0 Q251.0 335.0 266.5 317.5 Q282.0 300.0 293.0 281.5 Q304.0 263.0 310.0 246.5 Q316.0 230.0 319.0 213.0 Q322.0 196.0 322.0 134.5 Q322.0 73.0 318.5 69.5 Q315.0 66.0 288.0 61.0 Q261.0 56.0 240.5 49.0 Q220.0 42.0 207.0 35.5 Q194.0 29.0 179.5 19.0 Z M150.5 32.0 L164.0 23.0 L180.5 33.0 Q197.0 43.0 213.0 50.0 Q229.0 57.0 247.0 62.5 Q265.0 68.0 285.5 71.5 Q306.0 75.0 309.0 76.5 L312.0 78.0 L312.0 135.0 Q312.0 192.0 309.0 209.5 Q306.0 227.0 299.5 244.5 Q293.0 262.0 289.0 269.5 Q285.0 277.0 275.5 290.5 Q266.0 304.0 251.5 319.0 Q237.0 334.0 221.0 346.5 Q205.0 359.0 187.0 369.5 L169.0 380.0 L156.5 373.5 Q144.0 367.0 127.5 356.0 Q111.0 345.0 100.0 336.0 Q89.0 327.0 75.5 313.0 Q62.0 299.0 54.0 287.5 Q46.0 276.0 39.0 262.0 Q32.0 248.0 27.5 233.5 Q23.0 219.0 21.0 205.5 Q19.0 192.0 19.0 135.0 Q19.0 78.0 20.0 77.0 Q21.0 76.0 45.0 71.5 Q69.0 67.0 86.5 61.5 Q104.0 56.0 120.5 48.5 Q137.0 41.0 150.5 32.0 Z';

export const BOOT_SPLASH_LOGO_SVG_HTML = `<svg class="ba-loading-brand__logo" viewBox="0 0 331 400" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="ba-shield-grad" x1="165" y1="9" x2="165" y2="391" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="38%" stop-color="#fb923c" />
      <stop offset="78%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
  </defs>
  <path d="${BLAZE_SHIELD_SVG_PATH}" fill="url(#ba-shield-grad)" fill-rule="evenodd" />
</svg>`;

export const BOOT_SPLASH_BRAND_CENTER_HTML = `
<div class="ba-loading-brand" aria-hidden="true">
  <div class="ba-loading-brand__halo"></div>
  ${BOOT_SPLASH_LOGO_SVG_HTML}
  <svg class="ba-loading-brand__wordmark-svg" viewBox="0 0 431 44" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ba-wm-blaze" x1="0" y1="6" x2="0" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#fed7aa" />
        <stop offset="50%" stop-color="#f97316" />
        <stop offset="100%" stop-color="#ea580c" />
      </linearGradient>
      <linearGradient id="ba-wm-audit" x1="0" y1="6" x2="0" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="65%" stop-color="#e4e4e7" />
        <stop offset="100%" stop-color="#a1a1aa" />
      </linearGradient>
    </defs>
    <path d="${BLAZE_WORDMARK_BLAZE_PATH}" fill="url(#ba-wm-blaze)" fill-rule="evenodd" />
    <path d="${BLAZE_WORDMARK_AUDIT_PATH}" fill="url(#ba-wm-audit)" fill-rule="evenodd" />
  </svg>
  <div class="ba-loading-brand__badge">Fire Safety Documentation &amp; Reporting</div>
  <div class="ba-loading-brand__sub">SubraLab</div>
</div>
`;

const CORE_BOOT_SHELL_CSS = `
  html, body, #root { height: 100%; margin: 0; }
  body { overflow: hidden; background: #0a0a0a; color: #a3a3a3; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  #app-boot-loader {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem;
    background: #0a0a0a; -webkit-app-region: drag; overflow: hidden;
    opacity: 1; transition: opacity 0.22s ease-out;
  }
  #app-boot-loader.app-boot-loader--hide {
    opacity: 0; pointer-events: none; -webkit-app-region: no-drag;
  }
  #app-boot-loader .boot-spinner {
    position: relative; z-index: 2;
    width: 1.75rem; height: 1.75rem;
    border: 2px solid rgb(249 115 22 / 0.22); border-top-color: #f97316;
    border-radius: 9999px; animation: boot-spin 0.75s linear infinite;
  }
  #app-boot-loader .boot-label {
    position: relative; z-index: 2;
    font-family: 'Bahnschrift', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 0.8125rem; font-weight: 500; letter-spacing: 0.1em; color: #a1a1aa;
  }
  @keyframes boot-spin { to { transform: rotate(360deg); } }
`;

export function buildBootLoaderInnerHtml(): string {
  return `<div id="app-boot-loader" aria-live="polite" aria-busy="true">
    ${BOOT_SPLASH_AUTH_BG_HTML}
    ${ENABLE_BRANDED_LOADING_SCREEN ? BOOT_SPLASH_PHOTOS_HTML : ''}
    ${ENABLE_BRANDED_LOADING_SCREEN ? BOOT_SPLASH_BRAND_CENTER_HTML : ''}
    <div class="boot-spinner" aria-hidden="true"></div>
    <span class="boot-label">Loading…</span>
  </div>`;
}

export function buildBootSplashHtml(): string {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
${BOOT_SYNC_SCRIPT}
<style>
  ${CORE_BOOT_SHELL_CSS}
  ${BOOT_SPLASH_AUTH_BG_CSS}
  ${ENABLE_BRANDED_LOADING_SCREEN ? BOOT_SPLASH_BRAND_CSS : ''}
</style>
</head>
<body>
  ${buildBootLoaderInnerHtml()}
</body>
</html>`;
}

export function buildAppIndexHtml(): string {
  return `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlazeAudit</title>
    ${BOOT_SYNC_SCRIPT}
    <style>
      ${CORE_BOOT_SHELL_CSS}
      ${BOOT_SPLASH_AUTH_BG_CSS}
      ${ENABLE_BRANDED_LOADING_SCREEN ? BOOT_SPLASH_BRAND_CSS : ''}
    </style>
  </head>
  <body>
    ${buildBootLoaderInnerHtml()}
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
`;
}
