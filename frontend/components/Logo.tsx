// components/Logo.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// ─── Imagem (mantida para compatibilidade) ─────────────────────
type LogoMarkProps = {
  size?: number;
  inverse?: boolean;
  className?: string;
};

export function LogoMark({ size = 96, className }: LogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="95porcento"
      width={size}
      height={size}
      className={`rounded-xl object-contain ${className ?? ""}`}
      priority
    />
  );
}

type LogoProps = {
  size?: "sm" | "md" | "lg";
  inverse?: boolean;
  className?: string;
  textClassName?: string;
};

const HEIGHT_MAP = { sm: 96, md: 144, lg: 192 };

export function Logo({ size = "md", className = "" }: LogoProps) {
  const h = HEIGHT_MAP[size];
  return (
    <Image
      src="/logo.png"
      alt="95porcento"
      width={h}
      height={h}
      className={`rounded-xl object-contain ${className}`}
      priority
    />
  );
}

// ─── Logo animada (código puro, sem imagem) ────────────────────
export function LogoAnimated({ size = 38 }: { size?: number }) {
  const fs95  = Math.round(size * 0.40);   // tamanho do "95"
  const fsPct = Math.round(size * 0.26);   // tamanho do "%"

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Anéis propagantes */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-[1.5px] border-blue-500"
          style={{ width: size, height: size }}
          animate={{ scale: [1, 2.9], opacity: [0.5, 0] }}
          transition={{
            duration: 2.4,
            delay: i * 1.2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Badge central */}
      <div
        className="relative z-10 rounded-full bg-black flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        <span
          className="font-black text-white leading-none tracking-tight"
          style={{ fontSize: fs95 }}
        >
          95
        </span>
        <span
          className="font-black text-blue-400 leading-none self-start mt-[3px]"
          style={{ fontSize: fsPct }}
        >
          %
        </span>
      </div>
    </div>
  );
}
