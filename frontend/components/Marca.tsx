// frontend/components/Marca.tsx
"use client";

import { useId } from "react";

// Silhueta de cérebro (vista de cima) — usada como emblema oficial da marca.
const BRAIN_PATH =
  "M60 12 C52 4 40 6 34 14 C20 12 8 24 10 40 C2 50 4 66 16 76 " +
  "C26 92 46 94 60 84 C74 94 94 92 104 76 C116 66 118 50 110 40 " +
  "C112 24 100 12 86 14 C80 6 68 4 60 12 Z";

/**
 * Emblema da marca: logo "95%" dentro de uma silhueta de cérebro branca.
 * O cérebro é sempre branco; uma borda + sombra sutis garantem visibilidade
 * tanto em fundos escuros quanto claros.
 */
export function Marca({ className = "h-10 w-auto" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const clip = `brainClip-${uid}`;
  const shadow = `brainShadow-${uid}`;

  return (
    <svg
      viewBox="0 0 120 96"
      className={`${className} select-none`}
      role="img"
      aria-label="95%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clip}>
          <path d={BRAIN_PATH} />
        </clipPath>
        <filter id={shadow} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Silhueta do cérebro (branca, com borda sutil + sombra) */}
      <path d={BRAIN_PATH} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter={`url(#${shadow})`} />

      {/* Fissura central + circunvoluções */}
      <g clipPath={`url(#${clip})`} stroke="#94a3b8" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M60 12 C65 28 55 36 60 50 C64 62 56 70 60 84" />
        <path d="M34 22 C24 26 22 34 30 38" />
        <path d="M20 46 C14 52 18 62 28 62" />
        <path d="M30 72 C36 66 44 70 42 78" />
        <path d="M86 22 C96 26 98 34 90 38" />
        <path d="M100 46 C106 52 102 62 92 62" />
        <path d="M90 72 C84 66 76 70 78 78" />
      </g>

      {/* Logo 95% sobre o cérebro */}
      <image href="/logo-removebg-preview.png" x="28" y="18" width="64" height="64" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
