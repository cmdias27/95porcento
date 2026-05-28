// frontend/app/dashboard/relatorio/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Brain, CheckCircle2, ChevronRight, ChevronDown,
  BrainCircuit, BookOpen, Eye, EyeOff, Sparkles, Edit3, Mic,
  XCircle, Lightbulb, ArrowRight, Map,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { doc, getDoc } from "firebase/firestore";
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

// ─── sub-components ───────────────────────────────────────────────────────────

function AnimatedArrows() {
  return (
    <div className="flex flex-col items-center py-6 gap-0.5">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, 7, 0], opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      ))}
    </div>
  );
}

function ScoreKpi({ label, value, color, icon: Icon }: {
  label: string; value: string | number; color: string; icon: any;
}) {
  const colors: Record<string, string> = {
    blue:    "bg-blue-50   border-blue-200   text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red:     "bg-red-50    border-red-200     text-red-700",
    amber:   "bg-amber-50  border-amber-200   text-amber-700",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-500", emerald: "text-emerald-500", red: "text-red-500", amber: "text-amber-500",
  };
  return (
    <div className={`border rounded-2xl px-4 py-3.5 flex items-center gap-3 ${colors[color]}`}>
      <Icon size={18} className={iconColors[color]} />
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

export default function RelatorioFinal() {
  const params      = useParams();
  const router      = useRouter();
  const relatorioId = params.id as string;

  const [relatorio,          setRelatorio]          = useState<any>(null);
  const [carregando,         setCarregando]         = useState(true);
  const [enriquecendo,       setEnriquecendo]       = useState(true);
  const [gabaritosRevelados, setGabaritosRevelados] = useState<Set<string>>(new Set());
  const [questoesAbertas,    setQuestoesAbertas]    = useState<Record<string, boolean>>({});

  const toggleGabarito = (id: string) => setGabaritosRevelados(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleQuestoes = (key: string) =>
    setQuestoesAbertas(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!relatorioId) return;
    getDoc(doc(db, "relatorios", relatorioId))
      .then(snap => {
        if (snap.exists()) setRelatorio({ id: snap.id, ...snap.data() });
        else router.push("/");
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
      body: JSON.stringify({ relatorio_id: relatorioId, modo: "livre" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.erros_cometidos !== undefined || data.temas_nao_abordados !== undefined) {
          setRelatorio((prev: any) => ({
            ...prev,
            erros_cometidos:     data.erros_cometidos     ?? prev.erros_cometidos,
            temas_nao_abordados: data.temas_nao_abordados ?? prev.temas_nao_abordados,
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

  if (carregando || !relatorio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const erros:   any[] = relatorio.erros_cometidos     ?? [];
  const omissoes:any[] = relatorio.temas_nao_abordados ?? [];
  const acertos: any[] = relatorio.checklist_acertos   ?? [];
  const plano:   any[] = relatorio.plano_de_estudo     ?? [];
  const score          = relatorio.score_cognitivo ?? 0;
  const nAcertos       = relatorio.quantidade_acertos  ?? acertos.length;
  const nErros         = relatorio.quantidade_erros    ?? erros.length;
  const nOmissoes      = relatorio.quantidade_omissoes ?? omissoes.length;

  const motivacional = erros.length > 0
    ? `${erros.length} erro${erros.length > 1 ? "s" : ""} identificado${erros.length > 1 ? "s" : ""}. A correção começa agora.`
    : omissoes.length > 0
    ? `${omissoes.length} conceito${omissoes.length > 1 ? "s" : ""} para consolidar. O plano está pronto.`
    : "Excelente desempenho. Continue evoluindo.";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">

      {/* ── HEADER ── */}
      <AppHeader
        variant="report"
        title={relatorio.tema}
        subtitle={`${relatorio.materia} · Modo Livre`}
      />

      {/* ── HERO DARK ── */}
      <div className="bg-[#0A0F1E] px-4 md:px-8 pt-8 pb-0">
        <div className="max-w-7xl mx-auto">

          {/* Carregando questões */}
          {enriquecendo && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-3 mb-6"
            >
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest text-blue-400">
                Buscando questões de prova relacionadas...
              </p>
            </motion.div>
          )}

          {/* Score KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <ScoreKpi label="Score Cognitivo" value={`${score.toFixed ? score.toFixed(1) : score}/10`} color="blue"    icon={Brain} />
            <ScoreKpi label="Acertos"         value={nAcertos}  color="emerald" icon={CheckCircle2} />
            <ScoreKpi label="Erros"           value={nErros}    color="red"     icon={XCircle} />
            <ScoreKpi label="Omissões"        value={nOmissoes} color="amber"   icon={Lightbulb} />
          </div>

          {/* Análise do Mentor */}
          {relatorio.raciocinio_interno && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain size={15} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Análise do Mentor</span>
                {relatorio.perfil_quadrante && (
                  <span className="ml-auto text-[9px] font-black border border-blue-400/40 text-blue-300 px-2.5 py-0.5 rounded-full">
                    {relatorio.perfil_quadrante}
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed whitespace-pre-line">
                {relatorio.raciocinio_interno}
              </p>
            </motion.div>
          )}

          {/* EVOLUA AGORA */}
          <div className="text-center py-8">
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-3"
            >
              Seu relatório está pronto
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-3"
            >
              EVOLUA AGORA
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-sm font-bold text-slate-400"
            >
              {motivacional}
            </motion.p>
          </div>

        </div>
      </div>

      {/* Animated arrows (hero → content) */}
      <div className="bg-gradient-to-b from-[#0A0F1E] to-[#F8FAFC] px-4">
        <AnimatedArrows />
      </div>

      {/* ── CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-0">

        {/* ── SEÇÃO: CORREÇÃO DE ERROS ── */}
        {erros.length > 0 && (
          <section className="py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  CORREÇÃO DE ERROS
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  {erros.length} ponto{erros.length > 1 ? "s" : ""} identificado{erros.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {erros.map((item: any, i: number) => {
                const key        = `erro-${i}`;
                const qAberta    = !!questoesAbertas[key];
                const temQuestao = item.questao_vinculada || item.questao_autoral;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    {/* Top accent */}
                    <div className="h-1 bg-red-500" />

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      {/* Badge */}
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          <XCircle size={9} /> Erro identificado
                        </span>
                        <span className="ml-auto text-[9px] font-black text-slate-300">#{i + 1}</span>
                      </div>

                      {/* O que disse */}
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-2">
                          O que você disse
                        </p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                          "{item.trecho_aluno || item.erro}"
                        </p>
                      </div>

                      {/* Correção */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1">
                          <BrainCircuit size={10} /> Correção técnica
                        </p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                          {item.correcao || item.resumo}
                        </p>
                      </div>

                      {/* Botão questões */}
                      {(temQuestao || enriquecendo) && (
                        <button
                          onClick={() => toggleQuestoes(key)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            qAberta
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={11} /> Questões
                          </span>
                          <ChevronDown size={13} className={`transition-transform ${qAberta ? "rotate-180" : ""}`} />
                        </button>
                      )}

                      {/* Accordion questões */}
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
                                <QuestaoCard questao={item.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                                <QuestaoCard questao={item.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
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

            <AnimatedArrows />
          </section>
        )}

        {/* ── SEÇÃO: CONCEITOS OMITIDOS ── */}
        {omissoes.length > 0 && (
          <section className="py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  CONCEITOS OMITIDOS
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  {omissoes.length} conceito{omissoes.length > 1 ? "s" : ""} não abordado{omissoes.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {omissoes.map((o: any, i: number) => {
                const key     = `omissao-${i}`;
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
                    {/* Top accent — blue */}
                    <div className="h-1 bg-blue-500" />

                    <div className="p-5 flex flex-col gap-4 flex-1">
                      {/* Badge */}
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          <Lightbulb size={9} /> Você esqueceu
                        </span>
                        <span className="ml-auto text-[9px] font-black text-slate-300">#{i + 1}</span>
                      </div>

                      {/* Conceito */}
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">
                          Conceito omitido
                        </p>
                        <p className="text-sm font-black text-slate-800 leading-snug">
                          {o.tema || o.conceito}
                        </p>
                      </div>

                      {/* Resumo */}
                      {(o.resumo || o.importancia) && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Por que importa
                          </p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">
                            {o.resumo || o.importancia}
                          </p>
                        </div>
                      )}

                      {/* Botão questões */}
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
                                <QuestaoCard questao={o.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
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

            <AnimatedArrows />
          </section>
        )}

        {/* ── SEÇÃO: FIXAÇÃO DE ACERTOS ── */}
        {acertos.length > 0 && (
          <section className="py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  FIXAÇÃO DE ACERTOS
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  {acertos.length} ponto{acertos.length > 1 ? "s" : ""} dominado{acertos.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {acertos.map((item: string | any, i: number) => {
                const texto = typeof item === "string" ? item : (item.topico || item.conceito || item.titulo || JSON.stringify(item));
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 hover:shadow-sm hover:border-emerald-300 transition-all"
                  >
                    <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-900 leading-snug">{texto}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-1.5">
                        Dominado ✓
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatedArrows />
          </section>
        )}

        {/* ── SEÇÃO: PLANO DE ESTUDOS ── */}
        {plano.length > 0 && (
          <section className="py-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Map size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  PLANO DE ESTUDOS
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  Siga esta sequência
                </p>
              </div>
            </div>

            {/* Roadmap flow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {plano.map((item: any, i: number) => {
                const prioridade = i === 0 ? "Urgente" : i <= 1 ? "Alta" : i <= 3 ? "Média" : "Normal";
                const corStrip   = i === 0 ? "bg-red-500" : i <= 1 ? "bg-orange-400" : i <= 3 ? "bg-violet-500" : "bg-slate-300";
                const corBadge   = i === 0
                  ? "bg-red-100 text-red-700"
                  : i <= 1 ? "bg-orange-100 text-orange-700"
                  : i <= 3 ? "bg-violet-100 text-violet-700"
                  : "bg-slate-100 text-slate-500";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-violet-300 transition-all flex flex-col"
                  >
                    <div className={`h-1 ${corStrip}`} />
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                          {i + 1}
                        </div>
                        {i < plano.length - 1 && (
                          <ArrowRight size={12} className="text-slate-300 hidden lg:block" />
                        )}
                      </div>
                      <p className="text-[11px] font-black text-slate-800 leading-tight flex-1">{item.titulo}</p>
                      <span className={`self-start text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${corBadge}`}>
                        {prioridade}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CTA PRÓXIMA SESSÃO ── */}
        <section className="py-10">
          <div className="bg-[#0A0F1E] rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Próximo passo</p>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                Continue sua jornada.<br />
                <span className="text-slate-400">Uma nova sessão te espera.</span>
              </h3>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-colors whitespace-nowrap"
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

        {/* ── ANOTAÇÕES ── */}
        {(relatorio.anotacoes_manuais || relatorio.texto_transcrito) && (
          <section className="py-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-6 opacity-60">
              <Sparkles size={14} className="text-slate-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Suas Anotações</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-70">
              {relatorio.anotacoes_manuais && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                    <Edit3 size={12} /> Rascunho
                  </p>
                  <div className="bg-[#FFFDE7] p-4 rounded-xl border border-[#FFF59D] text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {relatorio.anotacoes_manuais}
                  </div>
                </div>
              )}
              {relatorio.texto_transcrito && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                    <Mic size={12} /> Transcrição
                  </p>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 italic leading-relaxed whitespace-pre-wrap h-40 overflow-y-auto custom-scrollbar">
                    {relatorio.texto_transcrito}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
