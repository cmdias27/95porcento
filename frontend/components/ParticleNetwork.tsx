// frontend/components/ParticleNetwork.tsx
"use client";

import { useEffect, useRef } from "react";

// Rede de partículas interativa (estilo "sinapses") para fundo escuro.
// Portado de funcionalidades/index.html. Renderiza um <canvas> que preenche
// o elemento-pai (que deve ser position: relative).

type Particle = {
  x: number; y: number; vx: number; vy: number;
  radius: number; pulsePhase: number; pulseSpeed: number;
};

const CONFIG = {
  density:      9000,  // 1 partícula a cada N px (menor = mais)
  maxParticles: 180,
  linkDistance: 130,
  mouseRadius:  180,
  attraction:   0.04,
  friction:     0.92,
  baseSpeed:    0.35,
  pointColor:   "180, 210, 255",
  lineColor:    "120, 170, 255",
};

export function ParticleNetwork({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    let width = 0, height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    const mouse = { x: 0, y: 0, active: false };

    const novaParticula = (x: number, y: number): Particle => ({
      x, y,
      vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
      vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
      radius: 1.5 + Math.random() * 1.5,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    });

    const init = () => {
      particles = [];
      const count = Math.min(CONFIG.maxParticles, Math.floor((width * height) / CONFIG.density));
      for (let i = 0; i < count; i++) {
        particles.push(novaParticula(Math.random() * width, Math.random() * height));
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      init();
    };

    const update = (p: Particle) => {
      if (mouse.active) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.attraction;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
      p.vx += (Math.random() - 0.5) * 0.04;
      p.vy += (Math.random() - 0.5) * 0.04;
      p.vx *= CONFIG.friction;
      p.vy *= CONFIG.friction;
      if (Math.hypot(p.vx, p.vy) < 0.15) {
        p.vx += (Math.random() - 0.5) * 0.1;
        p.vy += (Math.random() - 0.5) * 0.1;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0)      { p.x = 0;      p.vx *= -1; }
      if (p.x > width)  { p.x = width;  p.vx *= -1; }
      if (p.y < 0)      { p.y = 0;      p.vy *= -1; }
      if (p.y > height) { p.y = height; p.vy *= -1; }
      p.pulsePhase += p.pulseSpeed;
    };

    const draw = (p: Particle) => {
      const pulse = 0.6 + 0.4 * Math.sin(p.pulsePhase);
      const r = p.radius * (0.8 + 0.4 * Math.sin(p.pulsePhase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.pointColor},${0.06 * pulse})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.pointColor},${0.85 * pulse})`;
      ctx.fill();
    };

    const drawLinks = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CONFIG.linkDistance) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${CONFIG.lineColor},${(1 - dist / CONFIG.linkDistance) * 0.5})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      if (mouse.active) {
        for (const p of particles) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (dist < CONFIG.mouseRadius) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${CONFIG.lineColor},${(1 - dist / CONFIG.mouseRadius) * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      drawLinks();
      for (const p of particles) { update(p); draw(p); }
      raf = requestAnimationFrame(animate);
    };

    // Posição do mouse relativa ao canvas (lida com offset e scroll)
    const pos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.active = true;
    };
    const onMove  = (e: MouseEvent) => pos(e.clientX, e.clientY);
    const onOut   = () => { mouse.active = false; };
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) pos(t.clientX, t.clientY); };
    const onTouchEnd = () => { mouse.active = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);

    resize();
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
