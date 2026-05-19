// components/Logo.tsx
import Image from "next/image";

type LogoMarkProps = {
  size?: number;
  inverse?: boolean; // mantido por compatibilidade, não usado
  className?: string;
};

export function LogoMark({ size = 32, className }: LogoMarkProps) {
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
  inverse?: boolean; // mantido por compatibilidade, não usado
  className?: string;
  textClassName?: string; // mantido por compatibilidade, não usado
};

const HEIGHT_MAP = { sm: 28, md: 36, lg: 44 };

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
