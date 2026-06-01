// frontend/components/DnaBanca.tsx
"use client";

import { Fingerprint, Crosshair, Tag, AlertTriangle } from "lucide-react";

type Armadilha = { microtema?: string; armadilha: string };
type Dna = {
  estilo_cobranca?: string;
  palavras_gatilho?: string[];
  armadilhas?: Armadilha[];
};

type Accent = "blue" | "purple" | "amber";

const ACCENTS: Record<Accent, { strip: string; iconBg: string; chip: string; dot: string }> = {
  blue:   { strip: "bg-blue-500",   iconBg: "bg-blue-500",   chip: "bg-blue-50 text-blue-700 border-blue-200",       dot: "text-blue-500"   },
  purple: { strip: "bg-purple-600", iconBg: "bg-purple-600", chip: "bg-purple-50 text-purple-700 border-purple-200", dot: "text-purple-500" },
  amber:  { strip: "bg-amber-500",  iconBg: "bg-amber-500",  chip: "bg-amber-50 text-amber-700 border-amber-200",     dot: "text-amber-500"  },
};

export function DnaBanca({ dna, banca, accent = "blue" }: {
  dna?: Dna | null;
  banca?: string;
  accent?: Accent;
}) {
  if (!dna) return null;
  const temConteudo =
    !!dna.estilo_cobranca ||
    (dna.armadilhas?.length ?? 0) > 0 ||
    (dna.palavras_gatilho?.length ?? 0) > 0;
  if (!temConteudo) return null;

  const a = ACCENTS[accent] ?? ACCENTS.blue;
  const bancaLabel = banca && banca.toLowerCase() !== "livre" ? banca : "";

  return (
    <section className="py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Fingerprint size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">DNA DA BANCA</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
            Como {bancaLabel || "a banca"} cobra este conteúdo
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all">
        <div className={`h-1 ${a.strip}`} />
        <div className="p-5 md:p-6 space-y-6">

          {/* Estilo de cobrança */}
          {dna.estilo_cobranca && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Crosshair size={11} className={a.dot} /> Estilo de cobrança
              </p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{dna.estilo_cobranca}</p>
            </div>
          )}

          {/* Palavras-gatilho */}
          {(dna.palavras_gatilho?.length ?? 0) > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Tag size={11} className={a.dot} /> Palavras-gatilho
              </p>
              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-3">
                A banca usa esses termos para criar afirmações extremas ou restritivas. Muitas vezes
                basta uma delas — inserida, trocada ou retirada — para tornar a alternativa errada,
                ainda que ela pareça correta à primeira leitura. Ao ver uma dessas palavras, redobre a
                atenção e confirme se a regra realmente é absoluta.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dna.palavras_gatilho!.map((p, i) => (
                  <span key={i} className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${a.chip}`}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Armadilhas favoritas */}
          {(dna.armadilhas?.length ?? 0) > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle size={11} className={a.dot} /> Armadilhas favoritas
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {dna.armadilhas!.map((arm, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    {arm.microtema && (
                      <p className="text-[11px] font-black text-slate-700 mb-1 leading-snug">{arm.microtema}</p>
                    )}
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{arm.armadilha}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
