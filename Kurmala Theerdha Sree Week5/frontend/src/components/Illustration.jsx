import React from "react";

export default function Illustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 900 700"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BragBoard illustration"
    >
      <defs>
        <linearGradient id="blueGrad1" x1="0" x2="1">
          <stop offset="0" stopColor="#BEE0FF" />
          <stop offset="1" stopColor="#7FB6FF" />
        </linearGradient>

        <linearGradient id="blueGrad2" x1="0" x2="1">
          <stop offset="0" stopColor="#7FB6FF" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>

        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#0b3a80" floodOpacity="0.12"/>
        </filter>

        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#072f58" floodOpacity="0.08"/>
        </filter>
      </defs>

      {/* rightmost deep circle */}
      <circle cx="700" cy="350" r="320" fill="#0f47a1" />

      {/* mid-layer curve */}
      <path d="M900 120 C760 40 600 60 520 200 L520 620 L900 620 Z" fill="url(#blueGrad2)" opacity="0.95"/>

      {/* left large pale curve */}
      <path d="M240 0 H900 V700 H240 C160 700 120 600 120 500 V200 C120 120 160 0 240 0 Z" fill="url(#blueGrad1)" opacity="0.9" />

      {/* decorative bubbles */}
      <circle cx="620" cy="90" r="34" fill="#9cc7ff" opacity="0.35"/>
      <circle cx="820" cy="230" r="18" fill="#9cc7ff" opacity="0.28"/>
      <circle cx="750" cy="540" r="20" fill="#9cc7ff" opacity="0.22"/>
      <circle cx="520" cy="620" r="28" fill="#9cc7ff" opacity="0.20"/>

      {/* layered rightmost ring */}
      <g transform="translate(600, 260)" opacity="0.12">
        <circle cx="0" cy="0" r="140" stroke="#bfe0ff" strokeWidth="24" fill="none"/>
      </g>

      {/* Trophy base group */}
      <g transform="translate(520,320)" filter="url(#softShadow)">
        {/* pedestal */}
        <rect x="-60" y="160" rx="10" ry="10" width="180" height="36" fill="#ffe1a8" />
        <rect x="-40" y="124" rx="10" ry="10" width="140" height="44" fill="#ffd27a" />

        {/* trophy cup */}
        <ellipse cx="30" cy="36" rx="90" ry="40" fill="#ffd27a" />
        <path d="M-60,36 C-40,0 100,0 120,36 L120,86 C100,100 40,120 -10,120 C-60,120 -90,100 -90,86 Z" fill="#ffd27a" />
        <rect x="-20" y="86" width="100" height="14" rx="8" fill="#ffbc4d" />

        {/* handles */}
        <path d="M-80,30 C-120,30 -120,110 -80,120" fill="none" stroke="#ffd27a" strokeWidth="14" strokeLinecap="round" />
        <path d="M200,30 C240,30 240,110 200,120" fill="none" stroke="#ffd27a" strokeWidth="14" strokeLinecap="round" transform="translate(-150,0)"/>

        {/* ribbon */}
        <rect x="10" y="110" width="18" height="60" rx="6" fill="#ff9f52"/>
        <polygon points="19,170 5,190 33,190" fill="#ff9f52"/>

        {/* star badge */}
        <g transform="translate(60,-10) scale(0.9)">
          <circle cx="0" cy="0" r="34" fill="#fff" opacity="0.96"/>
          <polygon points="-6,-18 6,-18 10,-6 18,2 6,6 0,18 -6,6 -18,2 -10,-6 -6,-18"
                   fill="#ffcc4d"/>
        </g>
      </g>

      {/* small awards and ribbons */}
      <g transform="translate(420,380)" opacity="0.95">
        <rect x="-8" y="70" width="40" height="10" rx="4" fill="#cbe6ff"/>
        <rect x="20" y="84" width="12" height="36" rx="6" fill="#ffd27a"/>
        <circle cx="40" cy="42" r="18" fill="#bfe0ff"/>
      </g>

      {/* foreground semi-transparent circle decorations */}
      <g opacity="0.7">
        <circle cx="300" cy="640" r="36" fill="#bfe0ff" />
        <circle cx="160" cy="120" r="28" fill="#bfe0ff" />
      </g>

    </svg>
  );
}
