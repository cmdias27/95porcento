"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogoMark } from "@/components/Logo";
import { motion } from "framer-motion";
import { FileText, Mic, BookOpen, Target } from "lucide-react";

// ─── Canvas nucleus config ────────────────────────────────────

const SZ = 340;
const CX = SZ / 2;
const CY = SZ / 2;
const N_BARS = 72;
const RINGS = [80, 100, 122, 146, 170];

const BARS = Array.from({ length: N_BARS }, (_, i) => ({
  angle: (i * 2 * Math.PI) / N_BARS,
  base: 7 + 5 * Math.abs(Math.sin(i * 1.05)),
  amp: 14 + 11 * Math.abs(Math.cos(i * 0.8 + 1.2)),
  freq: 0.9 + (i % 9) * 0.16,
  phi: i * 0.295,
}));

// ─── Floating labels — uniform 210 px gap from nucleus center ─

const LABELS = [
  { text: "Conceito identificado",    ok: true,  top: "calc(50% - 115px)", left: "calc(50% - 385px)", delay: 0.6,  dir: -1 as const },
  { text: "Fundamentação ausente",    ok: false, top: "calc(50% - 115px)", left: "calc(50% + 210px)", delay: 1.0,  dir:  1 as const },
  { text: "Estrutura lógica correta", ok: true,  top: "calc(50% - 13px)",  left: "calc(50% - 385px)", delay: 1.4,  dir:  1 as const },
  { text: "Raciocínio incompleto",    ok: false, top: "calc(50% - 13px)",  left: "calc(50% + 210px)", delay: 1.8,  dir: -1 as const },
  { text: "Memória consolidada",      ok: true,  top: "calc(50% + 90px)",  left: "calc(50% - 385px)", delay: 2.2,  dir: -1 as const },
  { text: "Explicação superficial",   ok: false, top: "calc(50% + 90px)",  left: "calc(50% + 210px)", delay: 2.6,  dir:  1 as const },
];

// ─── Neural connection lines (SVG percentage coords) ──────────

const NEURAL_LINES = [
  { x2: 34, y2: 40 },
  { x2: 60, y2: 39 },
  { x2: 33, y2: 49 },
  { x2: 61, y2: 49 },
  { x2: 34, y2: 58 },
  { x2: 61, y2: 58 },
];

// ─── Particles ────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  top:  `${10 + ((i * 37 + 11) % 80)}%`,
  left: `${5  + ((i * 53 + 7)  % 90)}%`,
  size: 1.5 + (i % 3) * 0.75,
  delay: (i * 0.37) % 3,
  dur: 3.2 + (i % 4) * 0.6,
}));

// ─── Canvas component ─────────────────────────────────────────

function NucleusCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const t0 = useRef<number>(Date.now());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const t = (Date.now() - t0.current) / 1000;

    ctx.clearRect(0, 0, SZ * dpr, SZ * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    const halo = ctx.createRadialGradient(CX, CY, 60, CX, CY, 195);
    halo.addColorStop(0, "rgba(37,99,235,0.08)");
    halo.addColorStop(0.5, "rgba(124,58,237,0.04)");
    halo.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(CX, CY, 195, 0, Math.PI * 2);
    ctx.fill();

    RINGS.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(37,99,235,${0.07 - idx * 0.01})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    });

    BARS.forEach(({ angle, base, amp, freq, phi }) => {
      const h = base + amp * (0.5 + 0.5 * Math.sin(t * freq + phi));
      const r0 = RINGS[1];
      const r1 = r0 + h;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x1 = CX + r0 * cos;
      const y1 = CY + r0 * sin;
      const x2 = CX + r1 * cos;
      const y2 = CY + r1 * sin;
      const progress = (Math.sin(t * freq + phi) + 1) / 2;
      const r = Math.round(37  + 88  * progress);
      const g = Math.round(99  + 20  * progress);
      const b = Math.round(235 - 40  * progress);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.stroke();
    });

    const arcAngle = (t * 1.1) % (Math.PI * 2);
    const ARC_R = RINGS[3];
    const N_SEG = 52;
    const ARC_SPAN = Math.PI * 0.88;
    for (let i = 0; i < N_SEG; i++) {
      const a0 = arcAngle - ARC_SPAN + (i * ARC_SPAN) / N_SEG;
      const a1 = arcAngle - ARC_SPAN + ((i + 1) * ARC_SPAN) / N_SEG;
      ctx.beginPath();
      ctx.arc(CX, CY, ARC_R, a0, a1);
      ctx.strokeStyle = `rgba(37,99,235,${(i / N_SEG) * 0.55})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(CX + ARC_R * Math.cos(arcAngle), CY + ARC_R * Math.sin(arcAngle), 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(96,165,250,0.9)";
    ctx.fill();

    const orb = ctx.createRadialGradient(CX, CY, 0, CX, CY, RINGS[0]);
    orb.addColorStop(0,   "rgba(219,234,254,1)");
    orb.addColorStop(0.3, "rgba(147,197,253,0.95)");
    orb.addColorStop(0.7, "rgba(37,99,235,0.85)");
    orb.addColorStop(1,   "rgba(29,78,216,0)");
    ctx.beginPath();
    ctx.arc(CX, CY, RINGS[0], 0, Math.PI * 2);
    ctx.fillStyle = orb;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(CX, CY, RINGS[0], 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(147,197,253,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const core = ctx.createRadialGradient(CX - 10, CY - 12, 2, CX, CY, 52);
    core.addColorStop(0, "rgba(255,255,255,0.95)");
    core.addColorStop(0.4, "rgba(219,234,254,0.9)");
    core.addColorStop(1, "rgba(59,130,246,0.8)");
    ctx.beginPath();
    ctx.arc(CX, CY, 52, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();

    const spec = ctx.createRadialGradient(CX - 14, CY - 16, 0, CX - 14, CY - 16, 22);
    spec.addColorStop(0, "rgba(255,255,255,0.55)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(CX - 14, CY - 16, 22, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    ctx.restore();
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SZ * dpr;
    canvas.height = SZ * dpr;
    canvas.style.width  = `${SZ}px`;
    canvas.style.height = `${SZ}px`;
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="block" />;
}

// ─── Floating label ───────────────────────────────────────────

function FloatingLabel({ text, ok, delay, dir }: { text: string; ok: boolean; delay: number; dir: 1 | -1 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: dir * 10 }}
      animate={{ opacity: 1, y: [dir * 8, dir * -4, dir * 8] }}
      transition={{
        opacity: { delay, duration: 0.6 },
        y: { delay, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`absolute flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider whitespace-nowrap backdrop-blur-sm pointer-events-none select-none ${
        ok
          ? "bg-emerald-50/90 border-emerald-200 text-emerald-700"
          : "bg-red-50/90 border-red-200 text-red-600"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      {text}
    </motion.div>
  );
}

// ─── Floating side card shell ─────────────────────────────────

function FloatingCard({
  children,
  delay,
  amp = 10,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  amp?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -amp, 0, amp, 0] }}
      transition={{
        opacity: { delay, duration: 0.7 },
        scale:   { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        y: { delay: delay + 0.7, duration: 6.5, repeat: Infinity, ease: "easeInOut" },
      }}
      className="absolute hidden xl:block bg-white/90 backdrop-blur-sm border border-slate-200/70 rounded-2xl shadow-lg pointer-events-none select-none overflow-hidden"
      style={{ width: 174, ...style }}
    >
      {children}
    </motion.div>
  );
}

// ─── Card contents ────────────────────────────────────────────

function CardRelatorio() {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText size={12} className="text-blue-600" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Relatório gerado</span>
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Língua Portuguesa</p>
        <p className="text-[12px] font-black text-slate-800 leading-tight">Coesão e Coerência Textual</p>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Retenção", val: 78, color: "bg-blue-500" },
          { label: "Clareza",  val: 65, color: "bg-violet-500" },
          { label: "Precisão", val: 85, color: "bg-emerald-500" },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] font-bold text-slate-400">{label}</span>
              <span className="text-[9px] font-black text-slate-600">{val}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-0.5 border-t border-slate-100 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
        <span className="text-[9px] font-bold text-slate-400">Análise concluída</span>
      </div>
    </div>
  );
}

function CardLivre() {
  const barHeights = [30, 55, 80, 100, 75, 50, 85, 60, 35, 65];
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mic size={12} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Modo Livre</p>
        </div>
      </div>
      <p className="text-[11px] font-bold text-slate-600 leading-tight">
        Explique sem roteiro.<br />O sistema analisa tudo.
      </p>
      <div className="flex items-end gap-[3px] h-8">
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-blue-400 rounded-sm"
            animate={{ height: [`${h * 0.6}%`, `${h}%`, `${h * 0.7}%`] }}
            transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-[9px] font-bold text-slate-400">Gravando explicação...</span>
      </div>
    </div>
  );
}

function CardGuiado() {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={12} className="text-emerald-600" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Modo Guiado</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Pergunta 2 de 5</p>
        <p className="text-[11px] font-bold text-slate-700 leading-tight">
          "Qual a diferença entre revogação e anulação?"
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[1,2,3,4,5].map((n) => (
            <div
              key={n}
              className={`w-4 h-1 rounded-full ${n <= 2 ? "bg-emerald-400" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <span className="text-[9px] font-black text-emerald-600">→ Resp.</span>
      </div>
    </div>
  );
}

function CardSimulado() {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Target size={12} className="text-violet-600" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-violet-600">Modo Simulado</p>
      </div>
      <p className="text-[11px] font-bold text-slate-600 leading-tight">
        Resolução de problemas e foco em questões discursivas como em prova real.
      </p>
      <div className="bg-violet-50 rounded-xl p-2 border border-violet-100 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[10px] font-black text-violet-700">Simulando banca</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "Discursiva", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Problema",   color: "text-slate-500",  bg: "bg-slate-50"  },
        ].map(({ label, color, bg }) => (
          <div key={label} className={`${bg} rounded-lg px-2 py-1 text-center`}>
            <p className={`text-[9px] font-black uppercase tracking-wider ${color}`}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="h-[100dvh] bg-[#F4F6FB] flex items-center justify-center">
        <div className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden relative flex flex-col"
      style={{ background: "#F4F6FB" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial center glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800, height: 800,
          background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Bottom-right violet accent */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 480, height: 480,
          background: "radial-gradient(circle at bottom right, rgba(124,58,237,0.06) 0%, transparent 65%)",
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400 pointer-events-none"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 md:px-8 h-20 md:h-24 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        {/* Logo */}
        <LogoMark size={56} className="md:!w-[72px] md:!h-[72px]" />

        {/* Botões */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/login")}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors px-3 md:px-4 py-2 min-h-[40px]"
          >
            Entrar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/login")}
            className="text-xs font-black uppercase tracking-widest bg-black text-white px-4 md:px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm min-h-[40px]"
          >
            Começar →
          </motion.button>
        </div>
      </nav>

      {/* Stage */}
      <div className="relative flex-1 z-10">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute top-[5%] left-1/2 -translate-x-1/2 text-center pointer-events-none select-none w-full px-6"
        >
          <h1
            className="font-black text-black leading-none tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Pare de reler.
            <br />
            <span className="text-blue-600">Comece a explicar.</span>
          </h1>
        </motion.div>

        {/* Neural SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {NEURAL_LINES.map((line, i) => (
            <motion.line
              key={i}
              x1="50%" y1="50%"
              x2={`${line.x2}%`} y2={`${line.y2}%`}
              stroke="rgba(37,99,235,0.12)"
              strokeWidth="1"
              strokeDasharray="4 6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }}
            />
          ))}
        </svg>

        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-blue-400/30 pointer-events-none"
            style={{ top: "50%", left: "50%", width: SZ, height: SZ, marginTop: -SZ / 2, marginLeft: -SZ / 2 }}
            animate={{ scale: [1, 3.2], opacity: [0.35, 0] }}
            transition={{ duration: 3.5, delay: i * 1.15, repeat: Infinity, ease: "easeOut" }}
          />
        ))}

        {/* Floating diagnostic labels — hidden on small screens (use absolute px offsets that overflow) */}
        <div className="hidden md:block">
          {LABELS.map((label) => (
            <div key={label.text} className="absolute" style={{ top: label.top, left: label.left, zIndex: 10 }}>
              <FloatingLabel text={label.text} ok={label.ok} delay={label.delay} dir={label.dir} />
            </div>
          ))}
        </div>

        {/* Nucleus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
          style={{ top: "50%", left: "50%", marginTop: -SZ / 2, marginLeft: -SZ / 2, zIndex: 5 }}
        >
          <NucleusCanvas />
        </motion.div>

        {/* ── Side cards (xl only) ──────────────────────────────── */}

        {/* Left — Relatório */}
        <FloatingCard delay={1.8} amp={8} style={{ left: "2%", top: "15%" }}>
          <CardRelatorio />
        </FloatingCard>

        {/* Left — Modo Livre */}
        <FloatingCard delay={2.2} amp={12} style={{ left: "2%", top: "55%" }}>
          <CardLivre />
        </FloatingCard>

        {/* Right — Modo Guiado */}
        <FloatingCard delay={2.0} amp={10} style={{ right: "2%", top: "18%" }}>
          <CardGuiado />
        </FloatingCard>

        {/* Right — Simulado */}
        <FloatingCard delay={2.4} amp={9} style={{ right: "2%", top: "58%" }}>
          <CardSimulado />
        </FloatingCard>

        {/* Subheadline + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="absolute bottom-[5%] md:bottom-[7%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 md:gap-5 w-full max-w-xl px-4 md:px-6"
        >
          <p
            className="text-center text-slate-500 font-semibold leading-snug"
            style={{ fontSize: "clamp(0.8rem, 1.6vw, 1rem)" }}
          >
            Explicar cria conexões mais fortes. Nosso sistema acompanha
            <br className="hidden sm:block" />
            sua linha de raciocínio, detecta falhas e fortalece sua retenção.
          </p>

          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500/20 pointer-events-none"
              animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/login")}
              className="relative overflow-hidden flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest text-white shadow-xl"
              style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)" }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
              />
              Explique um assunto agora
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M6 3l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </motion.button>
          </div>

          {/* Ticker */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-full border border-slate-200 bg-white/60 backdrop-blur-sm py-2">
            {/* fade edges */}
            <div className="absolute left-0 top-0 h-full w-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.85), transparent)" }} />
            <div className="absolute right-0 top-0 h-full w-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, rgba(255,255,255,0.85), transparent)" }} />
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 2 }).flatMap((_, copy) =>
                ["CONCURSO", "EXAME DA OAB", "ENEM", "CONCURSO", "EXAME DA OAB", "ENEM"].map((item, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 flex-shrink-0 flex items-center px-4 gap-4"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </span>
                ))
              )}
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
