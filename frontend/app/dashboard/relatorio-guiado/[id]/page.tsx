// frontend/app/dashboard/relatorio-guiado/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Brain, CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  Activity, BookOpen, Eye, EyeOff, Sparkles, Lightbulb,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { apiFetch } from "@/lib/apiFetch";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";

// ─── helpers ──────────────────────────────────────────────────────────────────

function stripEmbeddedAlternatives(enunciado: string): string {
  const match = enunciado.match(/[\s\n]A\)\s/);
  if (match?.index !== undefined && /[B-E]\)/.test(enunciado.slice(match.index))) {
    return enunciado.slice(0, match.index).trim();
  }
  return enunciado;
}

// ─── constants ────────────────────────────────────────────────────────────────

const FASE_LABEL: Record<number, string> = {
  1: "Conceito",
  2: "Comparação",
  3: "Aplicação",
  4: "Análise Crítica",
};

const STATUS_CFG: Record<string, { label: string; cor: string; strip: string; badge: string }> = {
  Acerto:      { label: "Acerto",      cor: "emerald", strip: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Parcial:     { label: "Parcial",     cor: "amber",   strip: "bg-amber-400",   badge: "bg-amber-100 text-amber-700 border-amber-200"   },
  Erro:        { label: "Erro",        cor: "red",     strip: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-200"         },
  Superficial: { label: "Superficial", cor: "orange",  strip: "bg-orange-400",  badge: "bg-orange-100 text-orange-700 border-orange-200" },
  Pulada:      { label: "Pulada",      cor: "slate",   strip: "bg-slate-300",   badge: "bg-slate-100 text-slate-600 border-slate-200"   },
};

const NIVEL_CLASSES: Record<string, string> = {
  Alta:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  Média: "bg-amber-100   text-amber-700   border-amber-200",
  Baixa: "bg-red-100     text-red-700     border-red-200",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function AnimatedArrows() {
  return (
    <div className="flex flex-col items-center py-5 gap-0.5">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.div key={i}
          animate={{ y: [0, 7, 0], opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      ))}
    </div>
  );
}

function ScoreKpi({ label, value, color, icon: Icon }: {
  label: string; value: string | number; color: string; icon: any;
}) {
  const map: Record<string, string> = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red:     "bg-red-50 border-red-200 text-red-700",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
    purple:  "bg-purple-50 border-purple-200 text-purple-700",
  };
  const iconMap: Record<string, string> = {
    blue: "text-blue-500", emerald: "text-emerald-500",
    red: "text-red-500", amber: "text-amber-500", purple: "text-purple-500",
  };
  return (
    <div className={`border rounded-2xl px-4 py-3.5 flex items-center gap-3 ${map[color]}`}>
      <Icon size={18} className={iconMap[color]} />
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-xl font-black leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function QuestaoCard({ questao, gabaritosRevelados, toggle, autoral = false, bancaLabel = "" }: {
  questao: any; gabaritosRevelados: Set<string>; toggle: (id: string) => void;
  autoral?: boolean; bancaLabel?: string;
}) {
  if (!questao) return null;
  const revealed = gabaritosRevelados.has(questao.id);
  return (
    <div className={`mt-3 border-2 rounded-xl overflow-hidden ${autoral ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${autoral ? "border-purple-200 bg-purple-100" : "border-slate-200 bg-slate-100"}`}>
        {autoral ? <Sparkles size={12} className="text-purple-500" /> : <BookOpen size={12} className="text-slate-400" />}
        <span className={`text-[9px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-slate-500"}`}>
          {autoral ? "Questão Autoral" : "Questão de Prova"}
        </span>
        {autoral && bancaLabel && bancaLabel.toLowerCase() !== "livre" && (
          <span className="ml-auto text-[9px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">Estilo {bancaLabel}</span>
        )}
        {!autoral && questao.banca && <span className="ml-auto text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.banca}</span>}
        {!autoral && questao.ano   && <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.ano}</span>}
      </div>
      <div className="p-4">
        {questao.texto_auxiliar && questao.texto_auxiliar.trim().toLowerCase() !== "sem texto auxiliar" && (
          <div className="text-xs font-medium text-slate-600 leading-relaxed mb-3 bg-slate-100 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap">
            {questao.texto_auxiliar}
          </div>
        )}
        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-3">
          {autoral ? stripEmbeddedAlternatives(questao.enunciado) : questao.enunciado}
        </p>
        {questao.alternativas && (
          <ul className="space-y-1.5 mb-3">
            {Object.entries(questao.alternativas).sort(([a], [b]) => a.localeCompare(b)).map(([letra, texto]) => (
              <li key={letra} className={`text-xs flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                revealed && questao.gabarito === letra
                  ? autoral ? "bg-purple-50 border-purple-300 font-bold text-purple-900" : "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                  : "border-slate-100 text-slate-600"
              }`}>
                <span className="font-black shrink-0 w-4">{letra})</span>
                <span>{String(texto)}</span>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => toggle(questao.id)}
          className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors ${autoral ? "text-purple-600 hover:text-purple-800" : "text-blue-600 hover:text-blue-800"}`}>
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
          {revealed ? "Ocultar Gabarito" : "Ver Gabarito"}
        </button>
        {revealed && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-emerald-600"}`}>Gabarito:</span>
              <span className={`text-sm font-black px-2 py-0.5 rounded border ${autoral ? "text-purple-700 bg-purple-50 border-purple-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}>{questao.gabarito}</span>
            </div>
            {questao.comentario && (
              <p className="text-xs font-medium text-slate-600 leading-relaxed">{questao.comentario}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function RelatorioGuiado() {
  const params      = useParams();
  const router      = useRouter();
  const relatorioId = params.id as string;

  const [relatorio,          setRelatorio]          = useState<any>(null);
  const [carregando,         setCarregando]         = useState(true);
  const [enriquecendo,       setEnriquecendo]       = useState(true);
  const [gabaritosRevelados, setGabaritosRevelados] = useState<Set<string>>(new Set());
  const [questoesAbertas,    setQuestoesAbertas]    = useState<Record<string, boolean>>({});
  const [respostasAbertas,   setRespostasAbertas]   = useState(false);

  const toggleGabarito = (id: string) => setGabaritosRevelados(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleQuestoes = (key: string) =>
    setQuestoesAbertas(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!relatorioId) return;
    getDoc(doc(db, "relatorios_guiados", relatorioId))
      .then(snap => {
        if (snap.exists()) setRelatorio({ id: snap.id, ...snap.data() });
        else router.push("/dashboard");
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [relatorioId, router]);

  useEffect(() => {
    if (!relatorio) return;
    if (relatorio.enriquecido) { setEnriquecendo(false); return; }
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${API}/api/enriquecer-relatorio`, {
      method: "POST",
      body: JSON.stringify({ relatorio_id: relatorioId, modo: "guiado" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.avaliacoes) {
          setRelatorio((prev: any) => ({
            ...prev,
            avaliacoes: data.avaliacoes,
            omissoes:   data.omissoes ?? prev.omissoes,
            enriquecido: true,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setEnriquecendo(false));
  }, [relatorio?.enriquecido, relatorioId]);

  useEffect(() => {
    if (!relatorio || !relatorioId) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${API}/api/evento`, {
      method: "POST",
      body: JSON.stringify({
        tipo: "relatorio_visualizado", relatorio_id: relatorioId,
        tema: relatorio.tema ?? "", materia: relatorio.materia ?? "", jornada: relatorio.jornada ?? "",
      }),
    }).catch(() => {});
  }, [relatorio, relatorioId]);

  const avaliacoes: any[] = relatorio?.avaliacoes ?? [];
  const resumo            = relatorio?.resumo_geral ?? {};
  const omissoes: any[]   = relatorio?.omissoes ?? [];
  const score             = relatorio?.score_cognitivo ?? 0;

  // Group avaliacoes into cycles of 4
  const ciclos: any[][] = useMemo(() => {
    const groups: any[][] = [];
    for (let i = 0; i < avaliacoes.length; i += 4) {
      groups.push(avaliacoes.slice(i, i + 4));
    }
    return groups;
  }, [avaliacoes]);

  const nAcertos   = useMemo(() => avaliacoes.filter(av => av.status === "Acerto").length, [avaliacoes]);
  const nMelhorar  = useMemo(() => avaliacoes.filter(av => ["Parcial", "Erro", "Superficial"].includes(av.status)).length, [avaliacoes]);
  const nPuladas   = useMemo(() => avaliacoes.filter(av => av.status === "Pulada").length, [avaliacoes]);

  if (carregando || !relatorio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">

      {/* ── HEADER ── */}
      <AppHeader
        variant="report"
        title={relatorio.tema}
        subtitle={`${relatorio.materia} · Modo Guiado`}
      />

      {/* ── HERO DARK ── */}
      <div className="bg-[#0A0F1E] px-4 md:px-8 pt-8 pb-0">
        <div className="max-w-7xl mx-auto">

          {/* Carregando questões */}
          {enriquecendo && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl px-5 py-3 mb-6"
            >
              <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest text-purple-400">
                Buscando questões de prova relacionadas...
              </p>
            </motion.div>
          )}

          {/* Score KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <ScoreKpi label="Score"       value={`${score.toFixed ? score.toFixed(1) : score}/10`} color="purple"  icon={Brain} />
            <ScoreKpi label="Acertos"     value={nAcertos}           color="emerald" icon={CheckCircle2} />
            <ScoreKpi label="A Melhorar"  value={nMelhorar}          color="amber"   icon={AlertTriangle} />
            <ScoreKpi label="Omissões"    value={omissoes.length}    color="red"     icon={Lightbulb} />
          </div>

          {/* Análise da sessão */}
          {resumo.desempenho && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain size={15} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Análise da Sessão</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed">{resumo.desempenho}</p>
              {(resumo.profundidade_media || resumo.clareza || resumo.retencao_percebida) && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                  {[
                    { label: "Profundidade", val: resumo.profundidade_media },
                    { label: "Clareza",      val: resumo.clareza },
                    { label: "Retenção",     val: resumo.retencao_percebida },
                  ].map(item => item.val && (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}:</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${NIVEL_CLASSES[item.val] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Hero text */}
          <div className="text-center py-8">
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-3"
            >
              {ciclos.length} ciclo{ciclos.length !== 1 ? "s" : ""} · {avaliacoes.length} perguntas
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-3"
            >
              AVALIE SEU PROGRESSO
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-sm font-bold text-slate-400"
            >
              {nAcertos} acertos · {nMelhorar} pontos a melhorar · {omissoes.length} omissões
            </motion.p>
          </div>

        </div>
      </div>

      {/* Hero → content transition */}
      <div className="bg-gradient-to-b from-[#0A0F1E] to-[#F8FAFC] px-4">
        <AnimatedArrows />
      </div>

      {/* ── CONTEÚDO ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16">

        {/* ── SEÇÃO: AVALIAÇÃO POR CICLO ── */}
        {ciclos.length > 0 && (
          <section className="py-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <Activity size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">AVALIAÇÃO POR CICLO</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  {ciclos.length} ciclo{ciclos.length !== 1 ? "s" : ""} · 4 perguntas cada
                </p>
              </div>
            </div>

            <div className="space-y-12">
              {ciclos.map((ciclo, cicloIdx) => {
                const cicloNum   = cicloIdx + 1;
                const acertosC   = ciclo.filter((av: any) => av.status === "Acerto").length;
                const melhorarC  = ciclo.filter((av: any) => ["Parcial", "Erro", "Superficial"].includes(av.status)).length;

                return (
                  <div key={cicloIdx}>
                    {/* Cycle header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                        {cicloNum}
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-500">Ciclo {cicloNum}</p>
                        <h3 className="text-base font-black text-slate-900 leading-snug">{ciclo[0]?.assunto || "Avaliação de Progresso"}</h3>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {acertosC > 0 && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                            {acertosC} acerto{acertosC > 1 ? "s" : ""}
                          </span>
                        )}
                        {melhorarC > 0 && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                            {melhorarC} a melhorar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4-column grid of question cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {ciclo.map((av: any, avIdx: number) => {
                        const cfg     = STATUS_CFG[av.status] ?? STATUS_CFG["Parcial"];
                        const cardKey = `av-${cicloIdx}-${avIdx}`;
                        const qAberta = !!questoesAbertas[cardKey];
                        const temQ    = av.questao_vinculada || av.questao_autoral;

                        return (
                          <motion.div
                            key={av.id ?? cardKey}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: cicloIdx * 0.08 + avIdx * 0.05 }}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            {/* Status accent strip */}
                            <div className={`h-1 ${cfg.strip}`} />

                            <div className="p-4 flex flex-col gap-3 flex-1">
                              {/* Badges */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  Fase {av.fase}
                                </span>
                                <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  {FASE_LABEL[av.fase] ?? "—"}
                                </span>
                                <span className={`ml-auto text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                  {cfg.label}
                                </span>
                              </div>

                              {/* Pergunta */}
                              <p className="text-sm font-semibold text-slate-700 leading-snug italic">
                                {av.pergunta || av.assunto}
                              </p>

                              {/* Feedback (truncado) */}
                              {av.feedback && (
                                <p className="text-[11px] font-medium text-slate-500 leading-snug line-clamp-3">{av.feedback}</p>
                              )}

                              {/* Ponto forte + fraco */}
                              <div className="space-y-2">
                                {av.ponto_forte && (
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-1">
                                      <CheckCircle2 size={9} /> Ponto forte
                                    </p>
                                    <p className="text-[11px] font-medium text-emerald-900 leading-snug">{av.ponto_forte}</p>
                                  </div>
                                )}
                                {av.ponto_fraco && (
                                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-1">
                                      <AlertTriangle size={9} /> A melhorar
                                    </p>
                                    <p className="text-[11px] font-medium text-red-900 leading-snug">{av.ponto_fraco}</p>
                                  </div>
                                )}
                              </div>

                              {/* Spacer */}
                              <div className="flex-1" />

                              {/* Questões button */}
                              {(temQ || enriquecendo) && (
                                <button
                                  onClick={() => toggleQuestoes(cardKey)}
                                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                    qAberta
                                      ? "bg-purple-600 text-white border-purple-600"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-700"
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5"><BookOpen size={10} /> Questões</span>
                                  <ChevronDown size={12} className={`transition-transform ${qAberta ? "rotate-180" : ""}`} />
                                </button>
                              )}

                              {/* Accordion */}
                              <AnimatePresence initial={false}>
                                {qAberta && (
                                  <motion.div
                                    key="q"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    {enriquecendo ? (
                                      <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 mt-2">
                                        <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                        <p className="text-[10px] font-bold text-slate-400">Carregando questões...</p>
                                      </div>
                                    ) : (
                                      <>
                                        <QuestaoCard questao={av.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                                        <QuestaoCard questao={av.questao_autoral}   gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                                      </>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Arrows between cycles */}
                    {cicloIdx < ciclos.length - 1 && <AnimatedArrows />}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SEÇÃO: CONCEITOS OMITIDOS ── */}
        {omissoes.length > 0 && (
          <>
            <AnimatedArrows />
            <section className="py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">CONCEITOS OMITIDOS</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                    {omissoes.length} conceito{omissoes.length > 1 ? "s" : ""} não abordado{omissoes.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {omissoes.map((o: any, i: number) => {
                  const key     = `om-${i}`;
                  const qAberta = !!questoesAbertas[key];
                  const temQ    = o.questao_vinculada || o.questao_autoral;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="h-1 bg-blue-500" />
                      <div className="p-5 flex flex-col gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                            <Lightbulb size={9} /> Você esqueceu
                          </span>
                          <span className="ml-auto text-[9px] font-black text-slate-300">#{i + 1}</span>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">Conceito omitido</p>
                          <p className="text-sm font-black text-slate-800 leading-snug">{o.conceito || o.tema}</p>
                        </div>

                        {o.importancia && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Por que importa</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{o.importancia}</p>
                          </div>
                        )}

                        <div className="flex-1" />

                        {(temQ || enriquecendo) && (
                          <button
                            onClick={() => toggleQuestoes(key)}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                              qAberta
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-700"
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><BookOpen size={11} /> Questões</span>
                            <ChevronDown size={13} className={`transition-transform ${qAberta ? "rotate-180" : ""}`} />
                          </button>
                        )}

                        <AnimatePresence initial={false}>
                          {qAberta && (
                            <motion.div
                              key="q"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              {enriquecendo ? (
                                <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4">
                                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                  <p className="text-xs font-bold text-slate-400">Carregando questões...</p>
                                </div>
                              ) : (
                                <>
                                  <QuestaoCard questao={o.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                                  <QuestaoCard questao={o.questao_autoral}   gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ── CTA ── */}
        <section className="py-10">
          <AnimatedArrows />
          <div className="bg-[#0A0F1E] rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-2">Próximo passo</p>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                Continue sua jornada.<br />
                <span className="text-slate-400">Uma nova sessão te espera.</span>
              </h3>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-colors whitespace-nowrap"
              >
                Nova Sessão <ChevronRight size={16} />
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-center font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                Ir para o Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ── SUAS RESPOSTAS (colapsível) ── */}
        {avaliacoes.some((av: any) => av.resposta_aluno || av.pergunta) && (
          <section className="py-4 border-t border-slate-200">
            <button
              onClick={() => setRespostasAbertas(v => !v)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors mb-4"
            >
              <Sparkles size={14} />
              Suas Respostas
              <ChevronDown size={14} className={`transition-transform ${respostasAbertas ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {respostasAbertas && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-8 opacity-70">
                    {avaliacoes.map((av: any, i: number) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{av.assunto}</p>
                        {av.pergunta && (
                          <p className="text-[10px] font-bold text-slate-400 italic mb-2 leading-snug">"{av.pergunta}"</p>
                        )}
                        {av.resposta_aluno
                          ? <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{av.resposta_aluno}</p>
                          : <p className="text-xs font-bold text-slate-400 italic">{av.pulada ? "Pulada" : "Sem resposta."}</p>
                        }
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
      `}</style>
    </div>
  );
}
