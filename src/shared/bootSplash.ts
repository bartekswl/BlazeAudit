/**
 * Inline dark login-style wash for the pre-React / Electron data-URL splash.
 * Keep in sync with `.ba-auth-bg*` in components.css and AuthBackground.tsx.
 */

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
  }
  .ba-boot-auth-bg__glow--b {
    right: -10%; top: 5%; width: 45%; height: 55%;
    background: rgb(14 165 233 / 0.16);
    animation: ba-boot-drift 18s ease-in-out infinite alternate-reverse;
  }
  .ba-boot-auth-bg__glow--c {
    left: 30%; bottom: -20%; width: 50%; height: 45%;
    background: rgb(194 65 12 / 0.18);
    animation: ba-boot-drift 16s ease-in-out infinite alternate;
  }
  .ba-boot-auth-bg__lines {
    position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.85;
  }
  .ba-boot-auth-bg__sweep--1 {
    animation: ba-boot-sweep 12s linear infinite; transform-origin: center;
  }
  .ba-boot-auth-bg__sweep--2 {
    animation: ba-boot-sweep 18s linear infinite reverse; transform-origin: center;
  }
  .ba-boot-auth-bg__grid {
    stroke: rgb(249 115 22 / 0.14); opacity: 0.45;
    animation: ba-boot-grid-pulse 6s ease-in-out infinite;
  }
  .ba-boot-auth-bg__pulse {
    animation: ba-boot-ring 5.5s ease-out infinite; transform-origin: 780px 360px;
  }
  .ba-boot-auth-bg__pulse--flame { stroke: rgb(249 115 22 / 0.22); }
  .ba-boot-auth-bg__pulse--sky { stroke: rgb(56 189 248 / 0.14); }
  .ba-boot-auth-bg__pulse--delay { animation-delay: 1.8s; }
  @keyframes ba-boot-drift {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(3%, -2%, 0) scale(1.06); }
  }
  @keyframes ba-boot-sweep {
    from { transform: translateX(-2%); opacity: 0.55; }
    50% { opacity: 0.95; }
    to { transform: translateX(2%); opacity: 0.55; }
  }
  @keyframes ba-boot-grid-pulse {
    0%, 100% { opacity: 0.28; }
    50% { opacity: 0.5; }
  }
  @keyframes ba-boot-ring {
    0% { transform: scale(0.72); opacity: 0.55; }
    70% { opacity: 0.12; }
    100% { transform: scale(1.35); opacity: 0; }
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
        <stop offset="35%" stop-color="rgb(249 115 22)" stop-opacity="0.55" />
        <stop offset="70%" stop-color="rgb(56 189 248)" stop-opacity="0.35" />
        <stop offset="100%" stop-color="rgb(56 189 248)" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="ba-boot-line-2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(234 88 12)" stop-opacity="0" />
        <stop offset="40%" stop-color="rgb(251 146 60)" stop-opacity="0.45" />
        <stop offset="100%" stop-color="rgb(14 165 233)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g class="ba-boot-auth-bg__sweep--1" fill="none" stroke="url(#ba-boot-line)" stroke-width="1.25">
      <path d="M-80 620 C 180 520, 320 480, 520 500 S 880 620, 1280 420" />
      <path d="M-40 680 C 220 560, 400 540, 600 560 S 960 680, 1320 480" />
      <path d="M-120 540 C 140 460, 360 420, 560 440 S 900 520, 1300 340" />
    </g>
    <g class="ba-boot-auth-bg__sweep--2" fill="none" stroke="url(#ba-boot-line-2)" stroke-width="1">
      <path d="M-60 200 C 200 280, 380 300, 560 260 S 920 120, 1280 180" />
      <path d="M-100 260 C 160 340, 420 360, 640 300 S 980 160, 1340 220" />
      <path d="M 100 120 C 360 80, 520 140, 720 100 S 1040 40, 1400 90" />
    </g>
    <g class="ba-boot-auth-bg__grid" fill="none" stroke-width="0.75">
      <path d="M100 0 V800 M250 0 V800 M400 0 V800 M550 0 V800 M700 0 V800 M850 0 V800 M1000 0 V800" />
      <path d="M0 120 H1200 M0 260 H1200 M0 400 H1200 M0 540 H1200 M0 680 H1200" />
    </g>
    <circle class="ba-boot-auth-bg__pulse ba-boot-auth-bg__pulse--flame" cx="780" cy="360" r="120" fill="none" stroke-width="1" />
    <circle class="ba-boot-auth-bg__pulse ba-boot-auth-bg__pulse--sky ba-boot-auth-bg__pulse--delay" cx="780" cy="360" r="180" fill="none" stroke-width="1" />
  </svg>
</div>
`;

export function buildBootSplashHtml(): string {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<style>
  html, body { height: 100%; margin: 0; }
  body { overflow: hidden; background: #0a0a0a; color: #a3a3a3; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  #app-boot-loader {
    position: relative;
    display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem;
    background: #0a0a0a; -webkit-app-region: drag; overflow: hidden;
  }
  #app-boot-loader .boot-spinner {
    position: relative; z-index: 1;
    width: 1.75rem; height: 1.75rem;
    border: 2px solid rgb(249 115 22 / 0.2); border-top-color: #f97316;
    border-radius: 9999px; animation: boot-spin 0.75s linear infinite;
  }
  #app-boot-loader .boot-label { position: relative; z-index: 1; font-size: 0.8125rem; letter-spacing: 0.04em; }
  @keyframes boot-spin { to { transform: rotate(360deg); } }
  ${BOOT_SPLASH_AUTH_BG_CSS}
</style>
</head>
<body>
  <div id="app-boot-loader" aria-live="polite" aria-busy="true">
    ${BOOT_SPLASH_AUTH_BG_HTML}
    <div class="boot-spinner" aria-hidden="true"></div>
    <span class="boot-label">Loading…</span>
  </div>
</body>
</html>`;
}
