// frontend/app/dashboard/relatorio-simulado/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, CheckCircle2, AlertTriangle, ChevronRight,
  Activity, BookOpen, Eye, EyeOff, Sparkles,
  SkipForward, TrendingUp, Zap, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { apiFetch } from "@/lib/apiFetch";
import { motion } from "framer-motion";
import { FeedbackPopup } from "@/components/FeedbackPopup";

const STATUS_CONFIG: Record<string, { label: string; cor: string; icon: React.ReactNode }> = {
  Acerto:      { label: "Acerto",      cor: "emerald", icon: <CheckCircle2 size={14} /> },
  Parcial:     { label: "Parcial",     cor: "amber",   icon: <AlertTriangle size={14} /> },
  Erro:        { label: "Erro",        cor: "red",     icon: <AlertTriangle size={14} /> },
  Superficial: { label: "Superficial", cor: "orange",  icon: <Zap size={14} /> },
  Pulada:      { label: "Pulada",      cor: "slate",   icon: <SkipForward size={14} /> },
};

const STATUS_CLASSES: Record<string, string> = {
  emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  amber:   "text-amber-700 bg-amber-50 border-amber-200",
  red:     "text-red-700 bg-red-50 border-red-200",
  orange:  "text-orange-700 bg-orange-50 border-orange-200",
  slate:   "text-slate-600 bg-slate-50 border-slate-200",
};

const NIVEL_CLASSES: Record<string, string> = {
  Alta:  "text-emerald-700 bg-emerald-50 border-emerald-200",
  Média: "text-amber-700 bg-amber-50 border-amber-200",
  Baixa: "text-red-700 bg-red-50 border-red-200",
};

const DIAGNOSTICO_CONFIG: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: "clareza",       label: "Clareza",        icon: <MessageSquare size={14} /> },
  { key: "profundidade",  label: "Profundidade",   icon: <Brain size={14} /> },
  { key: "interpretacao", label: "Interpretação",  icon: <BookOpen size={14} /> },
  { key: "logica",        label: "Lógica",         icon: <Activity size={14} /> },
  { key: "argumentacao",  label: "Argumentação",   icon: <TrendingUp size={14} /> },
];

function QuestaoCard({ questao, gabaritosRevelados, toggle, autoral = false, bancaLabel = "" }: {
  questao: any;
  gabaritosRevelados: Set<string>;
  toggle: (id: string) => void;
  autoral?: boolean;
  bancaLabel?: string;
}) {
  if (!questao) return null;
  const revealed = gabaritosRevelados.has(questao.id);
  return (
    <div className={`mt-4 border-2 rounded-xl overflow-hidden ${autoral ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${autoral ? "border-purple-200 bg-purple-100" : "border-slate-200 bg-slate-100"}`}>
        {autoral ? <Sparkles size={13} className="text-purple-500" /> : <BookOpen size={13} className="text-slate-500" />}
        <span className={`text-[10px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-slate-500"}`}>
          {autoral ? "Questão Autoral" : "Questão de Prova"}
        </span>
        {autoral && bancaLabel && bancaLabel.toLowerCase() !== "livre" && (
          <span className="ml-auto text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">Estilo {bancaLabel}</span>
        )}
        {!autoral && questao.banca && <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.banca}</span>}
        {!autoral && questao.ano   && <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.ano}</span>}
      </div>
      <div className="p-4">
        {questao.texto_auxiliar && questao.texto_auxiliar.trim().toLowerCase() !== "sem texto auxiliar" && (
          <div className="text-sm font-medium text-slate-600 leading-relaxed mb-3 bg-slate-100 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap">
            {questao.texto_auxiliar}
          </div>
        )}
        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-4">{questao.enunciado}</p>
        {questao.alternativas && (
          <ul className="space-y-1.5 mb-4">
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
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${autoral ? "text-purple-600 hover:text-purple-800" : "text-blue-600 hover:text-blue-800"}`}>
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          {revealed ? "Ocultar Gabarito" : "Ver Gabarito"}
        </button>
        {revealed && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-emerald-600"}`}>Gabarito:</span>
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

export default function RelatorioSimulado() {
  const params = useParams();
  const router = useRouter();
  const relatorioId = params.id as string;

  const [relatorio, setRelatorio] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [enriquecendo, setEnriquecendo] = useState(false);
  const [gabaritosRevelados, setGabaritosRevelados] = useState<Set<string>>(new Set());
  const [showCenario, setShowCenario] = useState(false);

  const toggleGabarito = (id: string) => setGabaritosRevelados(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  useEffect(() => {
    const buscar = async () => {
      try {
        const docRef = doc(db, "relatorios_simulados", relatorioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setRelatorio({ id: docSnap.id, ...docSnap.data() });
        else router.push("/dashboard");
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
    };
    if (relatorioId) buscar();
  }, [relatorioId, router]);

  // Enriquecimento de questões (fase 2)
  useEffect(() => {
    if (!relatorio || relatorio.enriquecido) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    setEnriquecendo(true);
    apiFetch(`${API}/api/enriquecer-relatorio`, {
      method: "POST",
      body: JSON.stringify({ relatorio_id: relatorioId, modo: "simulado" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.avaliacoes) {
          setRelatorio((prev: any) => ({ ...prev, avaliacoes: data.avaliacoes, enriquecido: true }));
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
        tipo: "relatorio_visualizado",
        relatorio_id: relatorioId,
        tema:    relatorio.tema    ?? "",
        materia: relatorio.materia ?? "",
        jornada: relatorio.jornada ?? "",
      }),
    }).catch(() => {});
  }, [relatorio, relatorioId]);

  if (carregando || !relatorio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avaliacoes: any[]     = relatorio.avaliacoes ?? [];
  const resumo                = relatorio.resumo_geral ?? {};
  const diagnostico           = relatorio.diagnostico_cognitivo ?? {};
  const omissoes: any[]       = relatorio.omissoes ?? [];
  const cenario               = relatorio.cenario ?? {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">

      <header className="w-full px-4 md:px-8 py-4 flex items-center justify-between border-b-2 border-black bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="h-6 w-[2px] bg-black opacity-10" />
          <div>
            <h1 className="text-sm md:text-base font-black text-black truncate max-w-[200px] md:max-w-md">{relatorio.tema}</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              {relatorio.materia}
              <span className="w-1 h-1 rounded-full bg-amber-400 inline-block" />
              <span className="text-amber-600">Modo Simulado</span>
            </p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">

        {/* ── SEÇÃO 1: RESUMO ── */}
        <section>

          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 md:p-7 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <Brain size={16} className="text-amber-600" />
              <h2 className="text-xs font-black uppercase text-amber-600 tracking-widest">Análise da Simulação</h2>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed">
              {resumo.desempenho || "Sem análise disponível."}
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Profundidade", valor: resumo.profundidade_media },
                { label: "Clareza",      valor: resumo.clareza },
                { label: "Retenção",     valor: resumo.retencao_percebida },
              ].map(item => item.valor && (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}:</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${NIVEL_CLASSES[item.valor] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
                    {item.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 2: CENÁRIO ── */}
        {cenario.titulo && (
          <section>
            <div className="bg-amber-50 border-2 border-black rounded-[2rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <button
                onClick={() => setShowCenario(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 border-b-2 border-black hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-700">Cenário Trabalhado</span>
                  <span className="font-black text-sm text-black ml-2 text-left">{cenario.titulo}</span>
                </div>
                <ChevronRight size={16} className={`text-amber-600 transition-transform ${showCenario ? "rotate-90" : ""}`} />
              </button>
              {showCenario && (
                <div className="px-6 py-5">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{cenario.descricao}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 3: DIAGNÓSTICO COGNITIVO ── */}
        {Object.keys(diagnostico).length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <Brain size={24} className="text-amber-600" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">Diagnóstico Cognitivo</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {DIAGNOSTICO_CONFIG.map(({ key, label, icon }) => {
                const valor: string = diagnostico[key] ?? "";
                const classes = NIVEL_CLASSES[valor] ?? "text-slate-600 bg-slate-50 border-slate-200";
                return (
                  <motion.div key={key}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${classes}`}>
                    <div className="opacity-70">{icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-widest leading-tight">{label}</span>
                    <span className="text-sm font-black">{valor || "—"}</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 4: AVALIAÇÃO POR PERGUNTA ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <Activity size={24} className="text-amber-600" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">Avaliação por Fase</h2>
          </div>

          <div className="flex flex-col gap-4">
            {avaliacoes.map((av: any, i: number) => {
              const cfg = STATUS_CONFIG[av.status] ?? STATUS_CONFIG["Parcial"];
              const corClass = STATUS_CLASSES[cfg.cor];

              return (
                <motion.div key={av.id ?? i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">

                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-amber-50 border-b-2 border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                      Fase {av.fase} · {av.objetivo ?? "—"}
                    </span>
                    <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${corClass}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    {av.feedback && (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{av.feedback}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {av.ponto_forte && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 mb-2">
                            <CheckCircle2 size={11} /> Ponto Forte
                          </span>
                          <p className="text-xs font-medium text-emerald-900 leading-relaxed">{av.ponto_forte}</p>
                        </div>
                      )}
                      {av.ponto_fraco && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={11} /> A Melhorar
                          </span>
                          <p className="text-xs font-medium text-red-900 leading-relaxed">{av.ponto_fraco}</p>
                        </div>
                      )}
                    </div>

                    {enriquecendo ? (
                      <div className="mt-4 h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ) : (
                      <>
                        <QuestaoCard questao={av.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                        <QuestaoCard questao={av.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── SEÇÃO 5: OMISSÕES ── */}
        {omissoes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <AlertTriangle size={24} className="text-amber-500" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">Conceitos Omitidos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {omissoes.map((o: any, i: number) => (
                <div key={i} className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <h3 className="text-sm font-black text-black flex items-start gap-2 mb-2">
                    <ChevronRight size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    {o.conceito}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{o.importancia}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 6: CTA PRÓXIMA SESSÃO ── */}
        <section>
          <div className="bg-slate-900 border-2 border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Próximo Passo</p>
            <h3 className="text-xl font-black mb-4">Continue sua jornada com uma nova sessão.</h3>
            <button onClick={() => router.push("/dashboard")} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors">
              Nova Sessão <ChevronRight size={16} />
            </button>
            <button onClick={() => router.push("/dashboard")} className="w-full mt-3 py-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
              Ir para o Dashboard
            </button>
          </div>
        </section>


        {/* ── SEÇÃO 7: SUAS RESPOSTAS ── */}
        <section className="space-y-4 border-t-2 border-black pt-8 pb-12 opacity-80">
          <h2 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-slate-400" /> Suas Respostas
          </h2>
          <div className="flex flex-col gap-3">
            {avaliacoes.map((av: any, i: number) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                  Fase {av.fase} — {av.objetivo}
                </p>
                <p className="text-xs font-bold text-slate-500 italic mb-2">"{av.pergunta}"</p>
                {av.resposta_aluno
                  ? <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{av.resposta_aluno}</p>
                  : <p className="text-xs font-bold text-slate-400 italic">{av.pulada ? "Pulada" : "Sem resposta."}</p>
                }
              </div>
            ))}
          </div>
        </section>

      </main>

      <FeedbackPopup relatorioId={relatorioId} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
