// frontend/app/dashboard/relatorio/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Brain, CheckCircle2, AlertTriangle, ChevronRight, Download, Printer, Sparkles, Edit3, Target, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

const formatarTexto = (texto: any) => {
  if (!texto) return null;

  // 1. Se o backend mandou uma LISTA (Array), nós apenas mapeamos!
  if (Array.isArray(texto)) {
    return (
      <ul className="list-disc pl-5 space-y-2">
        {texto.map((item, index) => (
          <li key={index} className="text-sm text-slate-700">{item}</li>
        ))}
      </ul>
    );
  }

  // 2. Se o backend mandou um TEXTO (String), mantemos o comportamento antigo
  if (typeof texto === 'string') {
    return texto.split('\n').map((linha, index) => (
      <span key={index}>
        {linha}
        <br />
      </span>
    ));
  }

  return texto;
};

const limparTextoExportacao = (texto: string) => {
  if (!texto) return "";
  return texto.replace(/\*\*/g, '');
};

export default function RelatorioFinal() {
  const params = useParams();
  const router = useRouter();
  const relatorioId = params.id as string;
  const [relatorio, setRelatorio] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"questoes" | "erros" | "omissoes" | "acertos" | "estudar" | "explicao">("questoes");

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

  const exportarRelatorioTXT = () => {
    if (!relatorio) return;
    let c = `=== RELATÓRIO DE AUDITORIA: ${relatorio.tema?.toUpperCase()} ===\n`;
    c += `Score Fixação: ${relatorio.porcentagem_conhecimento}%\n`;
    if(relatorio.probabilidade_acerto) c += `Predição de Acertos: ${relatorio.probabilidade_acerto}/100\n`;
    c += `\nANÁLISE GERAL:\n${limparTextoExportacao(relatorio.raciocinio_interno)}\n\n`;
    
    if (relatorio.analise_banca) {
      c += `\n--- INTELIGÊNCIA DE BANCA ---\n`;
      if (typeof relatorio.analise_banca === 'object') {
         c += `MAIOR INCIDÊNCIA: ${limparTextoExportacao(relatorio.analise_banca.maior_incidencia)}\n`;
         c += `PEGADINHAS: ${limparTextoExportacao(relatorio.analise_banca.pegadinhas)}\n`;
         c += `PROJEÇÃO DE RESULTADO: De 100 questões sobre o tema, com sua explicação você acertaria ${relatorio.probabilidade_acerto}. ${limparTextoExportacao(relatorio.analise_banca.seu_resultado)}\n\n`;
      } else {
         c += `${limparTextoExportacao(relatorio.analise_banca)}\n\n`;
      }
    }

    c += `--- ERROS IDENTIFICADOS ---\n`;
    relatorio.erros_cometidos?.forEach((e: any, i: number) => {
      c += `Erro ${i+1}: ${limparTextoExportacao(e.trecho_aluno || e.erro)}\n`;
      c += `Correção: ${limparTextoExportacao(e.correcao || e.resumo)}\n\n`;
    });
    c += `--- OMISSÕES ---\n`;
    relatorio.temas_nao_abordados?.forEach((o: any) => {
      c += `- ${limparTextoExportacao(o.tema)}: ${limparTextoExportacao(o.resumo)}\n`;
    });
    c += `\n--- PONTOS FORTES (ACERTOS) ---\n`;
    relatorio.checklist_acertos?.forEach((a: string) => { c += `- ${limparTextoExportacao(a)}\n`; });
    c += `\n--- PLANO DE ESTUDO ---\n`;
    relatorio.plano_de_estudo?.forEach((p: any) => {
      c += `- ${limparTextoExportacao(p.titulo)}: ${limparTextoExportacao(p.foco)}\n`;
    });

    const blob = new Blob([c], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Auditoria_${relatorio.tema}.txt`;
    link.click();
  };

  if (carregando || !relatorio) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  const nota = relatorio.porcentagem_conhecimento || 0;
  const predicao = relatorio.probabilidade_acerto || 0;
  
  const corScore = nota < 50 ? "text-red-600 border-red-600 shadow-red-100" : nota < 70 ? "text-amber-600 border-amber-600 shadow-amber-100" : "text-emerald-600 border-emerald-600 shadow-emerald-100";
  const corPredicao = predicao < 50 ? "text-red-600 border-red-600 shadow-red-100" : predicao < 70 ? "text-amber-600 border-amber-600 shadow-amber-100" : "text-blue-600 border-blue-600 shadow-blue-100";

  const fraseResultado = `De 100 questões sobre o tema, com sua explicação você acertaria ${predicao < 50 ? 'apenas ' : ''}${predicao}.`;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <header className="w-full px-8 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-black transition-colors"><ArrowLeft size={14} /> Início</Link>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div>
            <h1 className="text-sm font-black text-black">{relatorio.tema}</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{relatorio.materia}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportarRelatorioTXT} className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase text-slate-500 hover:text-black border border-slate-200 rounded-lg transition-all"><Download size={12} /> TXT</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase text-white bg-black rounded-lg transition-all hover:bg-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"><Printer size={12} /> PDF</button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-8 py-6 flex flex-col print:max-w-none print:p-0">
        
        <section className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100 relative">
          <div className="flex gap-4 shrink-0">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`border-4 ${corScore} rounded-2xl w-24 h-24 flex flex-col items-center justify-center bg-white shadow-[6px_6px_0px_0px_currentColor]`}>
                <span className="text-[8px] font-black uppercase opacity-60 tracking-tighter">Fixação</span>
                <span className="text-3xl font-black leading-none">{nota}%</span>
              </motion.div>
              {relatorio.probabilidade_acerto && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`border-4 ${corPredicao} rounded-2xl w-28 h-24 flex flex-col items-center justify-center bg-white shadow-[6px_6px_0px_0px_currentColor]`}>
                  <span className="text-[8px] font-black uppercase opacity-60 tracking-widest text-center mb-1 leading-tight">Acertos<br/>Estimados</span>
                  <span className="text-2xl font-black leading-none">{predicao}/100</span>
                </motion.div>
              )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
               <Brain size={12} className="text-blue-600" />
               <h2 className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Análise do Auditor</h2>
            </div>
            <p className="text-sm font-medium italic text-slate-600 leading-relaxed max-w-4xl">
              "{formatarTexto(relatorio.raciocinio_interno)}"
            </p>
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 mb-8 print:hidden">
          {[
            { id: "questoes", label: "Análise de Questões", color: "hover:bg-purple-50 hover:text-purple-600 border-purple-200" },
            { id: "erros", label: "Erros", color: "hover:bg-red-50 hover:text-red-600" },
            { id: "omissoes", label: "Omissões", color: "hover:bg-amber-50 hover:text-amber-600" },
            { id: "acertos", label: "Acertos", color: "hover:bg-emerald-50 hover:text-emerald-600" },
            { id: "estudar", label: "O que Estudar", color: "hover:bg-blue-50 hover:text-blue-600" },
            { id: "explicao", label: "Minha Explicação", color: "hover:bg-slate-100 hover:text-black" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setAbaAtiva(tab.id as any)} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg border-2 ${abaAtiva === tab.id ? "bg-black text-white border-black" : `bg-white text-slate-500 border-slate-100 ${tab.color}`}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pb-32 print:hidden animate-in fade-in duration-300 w-full">
          
          {abaAtiva === "questoes" && (
             <div className="space-y-6 w-full">
                <div className="bg-blue-50/50 border-2 border-blue-200 p-6 rounded-2xl shadow-sm w-full">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3 flex items-center gap-2"><Target size={14} /> Maior Incidência</h3>
                  <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{typeof relatorio.analise_banca === 'object' ? formatarTexto(relatorio.analise_banca.maior_incidencia) : formatarTexto(relatorio.analise_banca || "Análise não gerada.")}</div>
                </div>
                <div className="bg-amber-50/50 border-2 border-amber-200 p-6 rounded-2xl shadow-sm w-full">
                  <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Pegadinhas Frequentes</h3>
                  <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{typeof relatorio.analise_banca === 'object' ? formatarTexto(relatorio.analise_banca.pegadinhas) : "Sem dados"}</div>
                </div>
                <div className="bg-purple-50/50 border-2 border-purple-200 p-6 rounded-2xl shadow-sm w-full">
                  <h3 className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-3 flex items-center gap-2"><BrainCircuit size={14} /> Seu Resultado Projetado</h3>
                  <p className="text-sm font-black text-slate-800 leading-relaxed mb-2">{fraseResultado}</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{typeof relatorio.analise_banca === 'object' ? formatarTexto(relatorio.analise_banca.seu_resultado) : ""}</p>
                </div>
             </div>
          )}

         {/* SEÇÃO ERROS: ESTRUTURA FLEXÍVEL E SEM CORTES */}
          {abaAtiva === "erros" && (
            <div className="space-y-10 w-full pb-10">
              {relatorio.erros_cometidos?.map((item: any, i: number) => (
                <div key={i} className="bg-red-50/40 border-l-4 border-red-500 p-6 sm:p-8 rounded-r-xl shadow-sm w-full">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Inconsistência {i + 1}</p>
                  
                  <p className="text-sm font-medium text-black mb-6 leading-relaxed whitespace-pre-wrap break-words">
                    {formatarTexto(item.trecho_aluno || item.erro)}
                  </p>
                  
                  {/* Só renderiza se houver correção (evita boxes vazios se a IA truncar) */}
                  {(item.correcao || item.resumo) && (
                    <div className="bg-white p-6 rounded-xl border border-red-100 w-full shadow-sm">
                      <div className="mb-4">
                          <span className="inline-block text-[9px] font-black bg-blue-600 text-white px-2.5 py-1.5 rounded uppercase tracking-widest">
                            Correção da IA
                          </span>
                      </div>
                      <p className="text-sm font-bold text-blue-900 leading-relaxed whitespace-pre-wrap break-words">
                          {formatarTexto(item.correcao || item.resumo)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "omissoes" && (
            <div className="space-y-3 w-full">
              {relatorio.temas_nao_abordados?.map((item: any, i: number) => (
                <div key={i} className="pb-4 border-b border-slate-100 last:border-0 w-full">
                  <h3 className="text-sm font-bold text-black flex items-center gap-2 mb-2"><ChevronRight size={14} className="text-amber-500 shrink-0" />{formatarTexto(item.tema)}</h3>
                  <p className="text-sm text-slate-500 pl-6 leading-relaxed whitespace-pre-wrap break-words">{formatarTexto(item.resumo)}</p>
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "acertos" && (
            <div className="space-y-3 w-full">
              {relatorio.checklist_acertos?.map((item: string, i: number) => (
                <div key={i} className="pb-4 border-b border-slate-100 last:border-0 flex items-start gap-3 w-full">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic whitespace-pre-wrap break-words flex-1 min-w-0">{formatarTexto(item)}</p>
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "estudar" && (
            <div className="space-y-3 w-full">
              {relatorio.plano_de_estudo?.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 w-full">
                   <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                   <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-black block mb-1">{formatarTexto(item.titulo)}</span>
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap break-words">{formatarTexto(item.foco)}</p>
                   </div>
                </div>
              ))}
            </div>
          )}

          {abaAtiva === "explicao" && (
            <div className="space-y-10 w-full">
               <div className="w-full">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Edit3 size={14} className="text-amber-500" /> Suas Anotações</h3>
                  <div className="bg-[#FFFDE7] p-6 rounded-xl border-2 border-[#FFF59D] text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm w-full">{relatorio.anotacoes_manuais || "Nenhuma anotação manual realizada."}</div>
               </div>
               <div className="w-full">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Sua Explicação</h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 italic leading-relaxed whitespace-pre-wrap w-full">{relatorio.texto_transcrito || "A IA não conseguiu capturar a transcrição."}</div>
               </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-100 p-4 sticky bottom-0 z-20 flex justify-center print:hidden">
        <button onClick={() => router.push('/')} className="bg-black text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none">Finalizar Revisão</button>
      </footer>
    </div>
  );
}