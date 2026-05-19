"use client";
import { useState, useRef } from "react";

interface Layer { pct: string; label: string; c1: string; c2: string; gold?: true }

// Layers: index 0 = narrow tip (top), index 5 = wide base (bottom)
const LAYERS: Layer[] = [
  { pct: "10%",  label: "",             c1: "#1e2d4e", c2: "#111c35" },
  { pct: "20%",  label: "Ouvindo",      c1: "#1c3470", c2: "#0f1e4a" },
  { pct: "30%",  label: "Vendo",        c1: "#1e3a8a", c2: "#122364" },
  { pct: "50%",  label: "Discutindo",   c1: "#2452cc", c2: "#1540a8" },
  { pct: "75%",  label: "Praticando",   c1: "#3b82f6", c2: "#1d4ed8" },
  { pct: "95%",  label: "Ensinando",    c1: "#fde68a", c2: "#d97706", gold: true },
];

const N   = LAYERS.length;
const VW  = 480, VH  = 348;
const APX = 218, APY = 16;           // front-face apex
const BX1 = 22,  BX2 = 414, BY = 302; // base corners
const PH  = BY - APY;                 // pixel height

function edgeAt(y: number) {
  const t = (y - APY) / PH;
  return { l: APX - (APX - BX1) * t, r: APX + (BX2 - APX) * t };
}

const YS = Array.from({ length: N + 1 }, (_, i) => APY + (i / N) * PH);

const KEYFRAMES = `
  @keyframes gp-gold-pulse {
    0%,100% { opacity: .10; }
    50%      { opacity: .28; }
  }
  @keyframes gp-shimmer {
    0%   { transform: translateX(-120%); }
    100% { transform: translateX( 420%); }
  }
`;

export function GlasserPyramidAnimation() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({
      x: (e.clientX - r.left - r.width  / 2) / (r.width  / 2),
      y: (e.clientY - r.top  - r.height / 2) / (r.height / 2),
    });
  };

  const tiltX = 5 + (-mouse.y * 9);
  const tiltY = mouse.x * 9;
  const tr    = hover ? "transform 0.08s ease-out" : "transform 0.85s ease-out";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        ref={ref}
        onMouseMove={e => { setHover(true); onMove(e); }}
        onMouseLeave={() => { setHover(false); setMouse({ x: 0, y: 0 }); }}
        style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none", cursor: "default" }}
      >
        <div style={{
          width: "100%", maxWidth: "390px",
          transform: `perspective(820px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: tr, willChange: "transform",
        }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: "block", overflow: "visible" }}>
            <defs>
              {/* Per-section front-face gradients (left → right) */}
              {LAYERS.map((lay, i) =>
                lay.gold ? (
                  <linearGradient key={i} id={`fg-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#fff0b3" />
                    <stop offset="30%"  stopColor="#fbbf24" />
                    <stop offset="68%"  stopColor="#d97706" />
                    <stop offset="100%" stopColor="#92400e" />
                  </linearGradient>
                ) : (
                  <linearGradient key={i} id={`fg-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor={lay.c1} />
                    <stop offset="100%" stopColor={lay.c2} />
                  </linearGradient>
                )
              )}


              {/* Highlight overlay: top-left bright → bottom-right dark */}
              <linearGradient id="hl" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="white" stopOpacity="0.15" />
                <stop offset="42%"  stopColor="white" stopOpacity="0.02" />
                <stop offset="100%" stopColor="black" stopOpacity="0.22" />
              </linearGradient>

              {/* Shimmer gradient for gold sweep */}
              <linearGradient id="shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="white" stopOpacity="0" />
                <stop offset="50%"  stopColor="white" stopOpacity="0.20" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              {/* Drop-shadow filter for the whole pyramid */}
              <filter id="py-shadow" x="-25%" y="-15%" width="170%" height="155%">
                <feDropShadow dx="5" dy="14" stdDeviation="18" floodColor="#000" floodOpacity="0.38" />
              </filter>

              {/* Gold ambient glow */}
              <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="9" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Ground shadow ── */}
            <ellipse
              cx={APX} cy={BY + 22}
              rx="210" ry="18"
              fill="rgba(0,0,0,0.26)"
            />

            {/* ── Invisible full-pyramid shape just for the drop-shadow ── */}
            <polygon
              points={`${APX},${APY} ${BX1},${BY} ${BX2},${BY}`}
              fill="rgba(0,0,0,0.01)" filter="url(#py-shadow)"
            />

            {/* ══ FRONT FACE sections ══ */}
            {LAYERS.map((lay, i) => {
              const y0 = YS[i], y1 = YS[i + 1];
              const { l: l0, r: r0 } = edgeAt(y0);
              const { l: l1, r: r1 } = edgeAt(y1);
              const pts  = `${l0},${y0} ${r0},${y0} ${r1},${y1} ${l1},${y1}`;
              const midW = (r0 + r1) / 2 - (l0 + l1) / 2;
              const cx   = (l0 + l1 + r0 + r1) / 4;
              const cy   = (y0 + y1) / 2 + 0.5;

              return (
                <g key={`ff-${i}`}>
                  {/* Base fill */}
                  <polygon points={pts} fill={`url(#fg-${i})`} />

                  {/* Highlight overlay */}
                  <polygon points={pts} fill="url(#hl)" />

                  {/* Gold pulsing aura — bottom section only */}
                  {lay.gold && (
                    <polygon points={pts} fill="#fbbf24"
                      style={{ animation: "gp-gold-pulse 2.8s ease-in-out infinite" }}
                    />
                  )}

                  {/* Section divider (top edge) */}
                  {i > 0 && (
                    <line x1={l0} y1={y0} x2={r0} y2={y0}
                      stroke="rgba(255,255,255,0.11)" strokeWidth="0.8" />
                  )}

                  {/* Left-edge highlight (light source from upper-left) */}
                  <line x1={l0} y1={y0} x2={l1} y2={y1}
                    stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" />

                  {/* Gold shimmer sweep */}
                  {lay.gold && (
                    <>
                      <clipPath id="gold-clip">
                        <polygon points={pts} />
                      </clipPath>
                      <rect
                        x={l1 - (r1 - l1) * 0.3} y={y0}
                        width={(r1 - l1) * 0.3} height={y1 - y0}
                        fill="url(#shimmer-grad)"
                        clipPath="url(#gold-clip)"
                        style={{ animation: "gp-shimmer 3.5s linear 0.8s infinite" }}
                      />
                    </>
                  )}

                  {/* Label */}
                  {midW > 55 && (
                    <text
                      x={cx} y={cy}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={lay.gold ? "14" : i >= 3 ? "10.5" : i === 1 ? "9" : "9"}
                      fontWeight="900"
                      fill={lay.gold ? "#fef9e7" : i <= 1 ? "#93c5fd" : "#bfdbfe"}
                      letterSpacing={lay.gold ? "2.5" : "1.4"}
                      style={{ fontFamily: "system-ui,sans-serif", textTransform: "uppercase" }}
                    >
                      {lay.pct}{lay.label ? ` · ${lay.label}` : ""}
                    </text>
                  )}

                  {/* Gold outer glow (behind label) */}
                  {lay.gold && (
                    <polygon points={pts} fill="rgba(251,191,36,0.18)"
                      filter="url(#gold-glow)" style={{ pointerEvents: "none" }}
                    />
                  )}
                </g>
              );
            })}

            {/* Left outer edge highlight */}
            <line x1={APX} y1={APY} x2={BX1} y2={BY}
              stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

            {/* Apex dot */}
            <circle cx={APX} cy={APY} r="2.5" fill="rgba(255,255,255,0.30)" />

            {/* Base edge */}
            <line x1={BX1} y1={BY} x2={BX2} y2={BY}
              stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
          </svg>
        </div>

        <p style={{
          fontSize: "7.5px", fontWeight: 900,
          letterSpacing: "0.32em", textTransform: "uppercase",
          color: "#94a3b8", marginTop: "8px", userSelect: "none",
        }}>
          Pirâmide de Glasser
        </p>
      </div>
    </>
  );
}
