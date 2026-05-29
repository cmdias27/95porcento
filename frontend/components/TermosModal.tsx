"use client";

import { useRef, useState } from "react";
import { X, ScrollText, CheckCircle2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { SECOES_LEGAIS as SECOES } from "@/data/legal";

// ─── Componente ───────────────────────────────────────────────

type Props = {
  onClose: () => void;
  onAccept: () => void;
};

export function TermosModal({ onClose, onAccept }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [leuTudo, setLeuTudo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [secaoAtiva, setSecaoAtiva] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const p = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    setProgresso(Math.min(p, 1));
    if (p >= 0.97) setLeuTudo(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="bg-white w-full sm:max-w-2xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col border-2 border-black"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black flex-shrink-0">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-blue-600" />
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Documentos Legais
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 bg-slate-100 flex-shrink-0">
          <motion.div
            className="h-full bg-blue-600 rounded-full origin-left"
            animate={{ scaleX: progresso }}
            transition={{ duration: 0.1 }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {/* Tabs das seções */}
        <div className="flex gap-1 px-4 pt-3 pb-1 flex-shrink-0 overflow-x-auto scrollbar-none">
          {SECOES.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setSecaoAtiva(i);
                scrollRef.current?.scrollTo({ top: 0 });
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                secaoAtiva === i
                  ? "bg-black text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {i + 1}. {s.titulo.split(" ")[0]}
              {s.titulo.split(" ")[1] ? " " + s.titulo.split(" ")[1] : ""}
            </button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
        >
          {SECOES.map((s, i) => (
            <div key={i} className={secaoAtiva === i ? "block" : "hidden"}>
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 pb-2 border-b border-slate-200">
                {s.titulo}
              </h3>
              <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                {s.corpo}
              </pre>
            </div>
          ))}

          {/* Aviso de rolar até o final (última aba) */}
          {secaoAtiva === SECOES.length - 1 && !leuTudo && (
            <div className="mt-6 flex flex-col items-center gap-1 text-slate-400 animate-bounce">
              <ChevronDown size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Role até o final para aceitar</span>
            </div>
          )}
        </div>

        {/* Navegação entre abas */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => { setSecaoAtiva(Math.max(0, secaoAtiva - 1)); scrollRef.current?.scrollTo({ top: 0 }); }}
            disabled={secaoAtiva === 0}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black disabled:opacity-30 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-[9px] text-slate-400 font-bold">
            {secaoAtiva + 1} / {SECOES.length}
          </span>
          {secaoAtiva < SECOES.length - 1 ? (
            <button
              onClick={() => { setSecaoAtiva(secaoAtiva + 1); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
            >
              Próximo →
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>

        {/* Rodapé de aceite */}
        <div className="px-6 pb-6 pt-3 border-t-2 border-black flex-shrink-0 space-y-3">
          {!leuTudo && secaoAtiva === SECOES.length - 1 && (
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center">
              Role até o final da última seção para habilitar o botão
            </p>
          )}
          {secaoAtiva < SECOES.length - 1 && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Leia todas as {SECOES.length} seções antes de aceitar
            </p>
          )}
          <button
            onClick={onAccept}
            disabled={!leuTudo || secaoAtiva < SECOES.length - 1}
            className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]"
          >
            <CheckCircle2 size={14} /> Li e aceito todos os documentos
          </button>
        </div>
      </motion.div>
    </div>
  );
}
