import { useId } from 'react';

/** Decorative wash shared by login and dark loading screens. */
export function AuthBackground() {
  const uid = useId().replace(/:/g, '');
  const line = `ba-auth-line-${uid}`;
  const line2 = `ba-auth-line-2-${uid}`;

  return (
    <div className="ba-auth-bg" aria-hidden>
      <div className="ba-auth-bg__base" />
      <div className="ba-auth-bg__glow ba-auth-bg__glow--a" />
      <div className="ba-auth-bg__glow ba-auth-bg__glow--b" />
      <div className="ba-auth-bg__glow ba-auth-bg__glow--c" />
      <svg className="ba-auth-bg__lines" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={line} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(249 115 22)" stopOpacity="0" />
            <stop offset="35%" stopColor="rgb(249 115 22)" stopOpacity="0.55" />
            <stop offset="70%" stopColor="rgb(56 189 248)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={line2} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(234 88 12)" stopOpacity="0" />
            <stop offset="40%" stopColor="rgb(251 146 60)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g
          className="ba-auth-bg__sweep ba-auth-bg__sweep--1"
          fill="none"
          stroke={`url(#${line})`}
          strokeWidth="1.25"
        >
          <path d="M-80 620 C 180 520, 320 480, 520 500 S 880 620, 1280 420" />
          <path d="M-40 680 C 220 560, 400 540, 600 560 S 960 680, 1320 480" />
          <path d="M-120 540 C 140 460, 360 420, 560 440 S 900 520, 1300 340" />
        </g>
        <g
          className="ba-auth-bg__sweep ba-auth-bg__sweep--2"
          fill="none"
          stroke={`url(#${line2})`}
          strokeWidth="1"
        >
          <path d="M-60 200 C 200 280, 380 300, 560 260 S 920 120, 1280 180" />
          <path d="M-100 260 C 160 340, 420 360, 640 300 S 980 160, 1340 220" />
          <path d="M 100 120 C 360 80, 520 140, 720 100 S 1040 40, 1400 90" />
        </g>
        <g className="ba-auth-bg__grid" fill="none" strokeWidth="0.75">
          <path d="M100 0 V800 M250 0 V800 M400 0 V800 M550 0 V800 M700 0 V800 M850 0 V800 M1000 0 V800" />
          <path d="M0 120 H1200 M0 260 H1200 M0 400 H1200 M0 540 H1200 M0 680 H1200" />
        </g>
        <circle
          className="ba-auth-bg__pulse ba-auth-bg__pulse--flame"
          cx="780"
          cy="360"
          r="120"
          fill="none"
          strokeWidth="1"
        />
        <circle
          className="ba-auth-bg__pulse ba-auth-bg__pulse--sky ba-auth-bg__pulse--delay"
          cx="780"
          cy="360"
          r="180"
          fill="none"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
