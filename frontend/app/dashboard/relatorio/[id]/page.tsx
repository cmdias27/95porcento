// frontend/app/dashboard/relatorio/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, CheckCircle2, AlertTriangle, ChevronRight,
  BrainCircuit, Activity, BookOpen, Eye, EyeOff, Sparkles,
  Edit3, Mic,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FeedbackPopup } from "@/components/FeedbackPopup";

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

export default function RelatorioFinal() {
  const params = useParams();
  const router = useRouter();
  const relatorioId = params.id as string;
  const [relatorio, setRelatorio] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [gabaritosRevelados, setGabaritosRevelados] = useState<Set<string>>(new Set());

  const toggleGabarito = (id: string) => setGabaritosRevelados(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  useEffect(() => {
    const buscarRelatorio = async () => {
      try {
        const docRef = doc(db, "relatorios", relatorioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setRelatorio({ id: docSnap.id, ...docSnap.data() });
        else router.push("/");
      } catch (error) { console.error(error); }
      finally { setCarregando(false); }
    };
    if (relatorioId) buscarRelatorio();
  }, [relatorioId, router]);

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

  const erros: any[]    = relatorio.erros_cometidos ?? [];
  const omissoes: any[] = relatorio.temas_nao_abordados ?? [];

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
              <span className="w-1 h-1 rounded-full bg-blue-400 inline-block" />
              <span className="text-blue-600">Modo Livre</span>
            </p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">

        {/* ── SEÇÃO 1: ANÁLISE DO MENTOR ── */}
        <section>
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 md:p-7 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <Brain size={16} className="text-blue-600" />
              <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest">Análise do Mentor</h2>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed whitespace-pre-line">
              {relatorio.raciocinio_interno || "Sem análise disponível."}
            </p>
            {relatorio.perfil_quadrante && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perfil:</span>
                <span className="text-[10px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full text-blue-700 bg-blue-50 border-blue-200">
                  {relatorio.perfil_quadrante}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── SEÇÃO 2: INCONSISTÊNCIAS CRÍTICAS ── */}
        {erros.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">Inconsistências Críticas</h2>
              <span className="text-[10px] font-black text-white bg-slate-700 px-2 py-0.5 rounded-full">{erros.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {erros.map((item: any, i: number) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-red-50 p-5 md:w-1/2 border-b-2 md:border-b-0 md:border-r-2 border-red-100 flex flex-col justify-center">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-2">O que você disse</span>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        "{item.trecho_aluno || item.erro}"
                      </p>
                    </div>
                    <div className="p-5 md:w-1/2 flex flex-col justify-center bg-white">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <BrainCircuit size={12} /> Correção Técnica
                      </span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.correcao || item.resumo}
                      </p>
                    </div>
                  </div>
                  {(item.questao_vinculada || item.questao_autoral) && (
                    <div className="px-5 pb-5">
                      <QuestaoCard questao={item.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                      <QuestaoCard questao={item.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 3: CONCEITOS OMITIDOS ── */}
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
                    {o.tema || o.conceito}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{o.resumo || o.importancia}</p>
                  <QuestaoCard questao={o.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                  <QuestaoCard questao={o.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 4: ACERTOS E COMO EVOLUIR ── */}
        {(relatorio.checklist_acertos?.length > 0 || relatorio.plano_de_estudo?.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">Acertos e Como Evoluir</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {relatorio.checklist_acertos?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Acertos Consolidados
                  </h3>
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                    {relatorio.checklist_acertos.map((item: string, i: number) => (
                      <div key={i} className="pb-3 mb-3 border-b border-emerald-100/50 last:border-0 last:mb-0 last:pb-0 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                        <div className="text-sm font-medium text-emerald-900 leading-relaxed">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {relatorio.plano_de_estudo?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
                    <Brain size={16} className="text-purple-500" /> Roteiro de Estudo
                  </h3>
                  <div className="space-y-3">
                    {relatorio.plano_de_estudo.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:border-purple-200 hover:shadow-md transition-all">
                        <div className="w-7 h-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                        <div>
                          <span className="text-sm font-black text-black block mb-1">{item.titulo}</span>
                          <div className="text-xs font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{item.foco}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 5: CTA PRÓXIMA SESSÃO ── */}
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

        {/* ── SEÇÃO 6: SUAS ANOTAÇÕES ── */}
        <section className="space-y-4 border-t-2 border-black pt-8 pb-12 opacity-80">
          <h2 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-slate-400" /> Suas Anotações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Edit3 size={14} /> Rascunho
              </h3>
              <div className="bg-[#FFFDE7] p-5 rounded-xl border border-[#FFF59D] text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                {relatorio.anotacoes_manuais || "Nenhuma anotação."}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Mic size={14} /> Transcrição
              </h3>
              <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 italic leading-relaxed whitespace-pre-wrap h-48 md:h-64 overflow-y-auto custom-scrollbar">
                {relatorio.texto_transcrito || "Sem transcrição."}
              </div>
            </div>
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
