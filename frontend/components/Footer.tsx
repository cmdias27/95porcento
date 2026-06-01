// frontend/components/Footer.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, MessageSquarePlus, ArrowRight } from "lucide-react";
import { SECOES_LEGAIS } from "@/data/legal";
import { Marca } from "@/components/Marca";

// Índices das seções legais em data/legal.ts
const SECAO = { termos: 0, privacidade: 1, lgpd: 1 } as const;

function ColTitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
      {children}
    </p>
  );
}

const linkCls =
  "text-sm font-medium text-slate-400 hover:text-white transition-colors text-left";

export function Footer() {
  const [legalAberto, setLegalAberto] = useState<number | null>(null);

  return (
    <>
      <footer className="w-full bg-[#0A0F1E] border-t border-white/10 print:hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-12">

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10">

            {/* ── Marca + proposta ── */}
            <div className="col-span-2 lg:col-span-2">
              <Marca className="h-12 w-auto" />
              <p className="text-sm font-bold text-slate-300 mt-3">Aprenda explicando.</p>
              <p className="text-xs font-medium text-slate-500 mt-2 max-w-xs leading-relaxed">
                Você retém 95% do que ensina. Explique para a nossa IA e descubra
                exatamente o que já domina e o que falta revisar.
              </p>
            </div>

            {/* ── Navegação rápida ── */}
            <div>
              <ColTitulo>Navegação</ColTitulo>
              <nav className="flex flex-col gap-3">
                <Link href="/como-funciona" className={linkCls}>Como funciona</Link>
                <Link href="/ajuda" className={linkCls}>Ajuda</Link>
                <Link href="/contato" className={linkCls}>Contato</Link>
              </nav>
            </div>

            {/* ── Áreas de estudo ── */}
            <div>
              <ColTitulo>Áreas de estudo</ColTitulo>
              <nav className="flex flex-col gap-3">
                <Link href="/" className={linkCls}>Concursos Públicos</Link>
                <Link href="/" className={linkCls}>ENEM</Link>
                <Link href="/" className={linkCls}>OAB</Link>
              </nav>
            </div>

            {/* ── Confiança e transparência ── */}
            <div className="col-span-2 lg:col-span-1">
              <ColTitulo>Confiança</ColTitulo>
              <nav className="flex flex-col gap-3">
                <button onClick={() => setLegalAberto(SECAO.privacidade)} className={linkCls}>
                  Política de Privacidade
                </button>
                <button onClick={() => setLegalAberto(SECAO.termos)} className={linkCls}>
                  Termos de Uso
                </button>
                <button onClick={() => setLegalAberto(SECAO.lgpd)} className={linkCls}>
                  LGPD
                </button>
              </nav>
              <div className="flex items-start gap-2 mt-4 text-emerald-400/90">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold leading-snug">
                  Suas explicações são privadas e protegidas.
                </p>
              </div>
            </div>

          </div>

          {/* ── Feedback e comunidade ── */}
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <MessageSquarePlus size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Encontrou um problema ou tem sugestões?</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Seu feedback ajuda a melhorar a plataforma.
                </p>
              </div>
            </div>
            <Link
              href="/contato?assunto=Feedback"
              className="shrink-0 flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors"
            >
              Enviar feedback <ArrowRight size={13} />
            </Link>
          </div>

          {/* ── Barra inferior ── */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              © {new Date().getFullYear()} 95porcento · Aprendizado Ativo com IA
            </p>
            <p className="text-[10px] font-medium text-slate-600">
              Feito para quem estuda de verdade.
            </p>
          </div>

        </div>
      </footer>

      {/* ── Modal legal (somente leitura) ── */}
      <AnimatePresence>
        {legalAberto !== null && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22 }}
              className="bg-white w-full sm:max-w-2xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col border-2 border-black"
              style={{ maxHeight: "90dvh" }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    {SECOES_LEGAIS[legalAberto].titulo}
                  </span>
                </div>
                <button onClick={() => setLegalAberto(null)} className="text-slate-400 hover:text-black transition-colors p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Abas rápidas entre os documentos */}
              <div className="flex gap-1 px-4 pt-3 pb-1 shrink-0 overflow-x-auto scrollbar-none">
                {[
                  { i: SECAO.privacidade, l: "Privacidade" },
                  { i: SECAO.termos, l: "Termos" },
                  { i: 2, l: "Cookies" },
                  { i: 3, l: "Marketing" },
                ].map(({ i, l }) => (
                  <button key={l} onClick={() => setLegalAberto(i)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      legalAberto === i ? "bg-black text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                  {SECOES_LEGAIS[legalAberto].corpo}
                </pre>
              </div>

              <div className="px-6 py-4 border-t-2 border-black shrink-0">
                <button
                  onClick={() => setLegalAberto(null)}
                  className="w-full bg-black text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
