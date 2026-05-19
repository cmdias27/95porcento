// components/Logo.tsx
// Fonte única da logo em todo o projeto.

type LogoMarkProps = {
  size?: number;
  /** true = marca sobre fundo escuro (paths ficam brancos) */
  inverse?: boolean;
  className?: string;
};

export function LogoMark({ size = 32, inverse = false, className }: LogoMarkProps) {
  const dark  = inverse ? "#FFFFFF" : "#0F172A";
  const blue  = inverse ? "#93C5FD" : "#2563EB";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Forma esquerda — preta / branca */}
      <path
        d="M 22 82 L 50 18 L 62 42 L 40 82 Z"
        fill={dark}
      />
      {/* Forma direita — azul / azul claro */}
      <path
        d="M 50 18 L 78 82 L 64 82 L 54 58 L 62 42 Z"
        fill={blue}
      />
    </svg>
  );
}

type LogoProps = {
  size?: "sm" | "md" | "lg";
  inverse?: boolean;
  className?: string;
  textClassName?: string;
};

const SIZE_MAP = {
  sm: { mark: 24, text: "text-base"  },
  md: { mark: 32, text: "text-lg"    },
  lg: { mark: 40, text: "text-2xl"   },
};

export function Logo({
  size = "md",
  inverse = false,
  className = "",
  textClassName = "",
}: LogoProps) {
  const { mark, text } = SIZE_MAP[size];
  const wordColor = inverse ? "text-white" : "text-slate-950";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={mark} inverse={inverse} />
      <span className={`font-black tracking-tight leading-none ${text} ${wordColor} ${textClassName}`}>
        <span className={inverse ? "text-blue-300" : "text-blue-600"}>95</span>porcento
      </span>
    </div>
  );
}
