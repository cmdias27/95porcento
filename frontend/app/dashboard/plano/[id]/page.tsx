// frontend/app/dashboard/plano/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Edit3, Trash2, CheckCircle2, 
  Loader2, Mic, ChevronDown, ChevronUp, ChevronRight, Search,
  RotateCcw, FileText, BarChart3, Flag
} from "lucide-react";
import Link from "next/link";

// Firebase
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

// Importando a Fonte de Verdade Local
import { JORNADAS_ESTUDO, Jornada, Materia, Tema } from "@/data/materias";

export default function PlanoDetalhes() {
  const params = useParams();
  const router = useRouter();
  const planoId = params.id as string;

  const [plano, setPlano] = useState<any>(null);
  const [relatoriosMapeados, setRelatoriosMapeados] = useState<Record<string, any>>({});
  const [carregando, setCarregando] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nomeEditado, setNomeEditado] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [expansos, setExpansos] = useState<string[]>([]);

  // Estados de Recolhimento (Visualização)
  const [materiasExpansosView, setMateriasExpansosView] = useState<string[]>([]);
  const [temasExpansosView, setTemasExpansosView] = useState<string[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const docRef = doc(db, "planos", planoId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setPlano(dados);
          setNomeEditado(dados.nome);
          setSelecionados(dados.itens || []);
        } else {
          alert("Plano não encontrado.");
          router.push("/dashboard");
          return;
        }

        // Buscar relatórios para cruzar o progresso
        const relatoriosSnap = await getDocs(collection(db, "relatorios"));
        const mapa: Record<string, any> = {};
        
        relatoriosSnap.forEach((doc) => {
          const rel = { id: doc.id, ...doc.data() } as any;
          const chave = `${rel.jornada}|${rel.materia}|${rel.tema}`;
          if (!mapa[chave] || mapa[chave].porcentagem_conhecimento < rel.porcentagem_conhecimento) {
            mapa[chave] = rel;
          }
        });
        setRelatoriosMapeados(mapa);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    };

    if (planoId) carregarDados();
  }, [planoId, router]);

  // --- LÓGICA TRADUTORA: Cruza IDs com Nomes para montar a visualização ---
  const itensAgrupados = useMemo(() => {
    if (!plano || !plano.itens) return {};
    
    const jornadaObj = JORNADAS_ESTUDO.find(j => j.id === plano.jornada);
    if (!jornadaObj) return {};

    const grupos: any = {};
    
    jornadaObj.materias.forEach(mat => {
      mat.temas.forEach(tema => {
        // Verifica se algum subtema deste tema está selecionado, ou se o próprio tema está
        const subtemasSelecionados = tema.subtemas.filter(sub => plano.itens.includes(sub.id));
        const temaSelecionado = plano.itens.includes(tema.id);

        if (subtemasSelecionados.length > 0 || temaSelecionado) {
          if (!grupos[mat.nome]) grupos[mat.nome] = { jornada: plano.jornada, temas: {} };
          // Salva os nomes dos subtemas para exibir na tela
          grupos[mat.nome].temas[tema.nome] = subtemasSelecionados.map(s => s.nome);
        }
      });
    });

    return grupos;
  }, [plano]);

  // Inicializar matérias expandidas por padrão na view
  useEffect(() => {
    if (Object.keys(itensAgrupados).length > 0 && materiasExpansosView.length === 0) {
      setMateriasExpansosView(Object.keys(itensAgrupados));
    }
  }, [itensAgrupados]);

  // Filtro de edição instantâneo (Local)
  const dadosFiltradosEdicao = useMemo(() => {
    if (!plano) return [];
    const jornada = JORNADAS_ESTUDO.find(j => j.id === plano.jornada);
    if (!jornada) return [];
    
    const termo = busca.toLowerCase();
    if (!termo) return jornada.materias;

    return jornada.materias.filter(m => 
      m.nome.toLowerCase().includes(termo) ||
      m.temas.some(t => 
        t.nome.toLowerCase().includes(termo) || 
        t.subtemas.some(s => s.nome.toLowerCase().includes(termo))
      )
    );
  }, [busca, plano]);

  // Cálculo de Progresso
  const metricasProgresso = useMemo(() => {
    let total = 0;
    let concluidos = 0;

    Object.keys(itensAgrupados).forEach(materia => {
      const jornada = itensAgrupados[materia].jornada;
      Object.keys(itensAgrupados[materia].temas).forEach(tema => {
        total++;
        if (relatoriosMapeados[`${jornada}|${materia}|${tema}`]) {
          concluidos++;
        }
      });
    });

    const porcentagem = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return { total, concluidos, porcentagem };
  }, [itensAgrupados, relatoriosMapeados]);

  // Salvar Edição
  const handleSalvarEdicao = async () => {
    if (!nomeEditado.trim() || selecionados.length === 0) {
      alert("O plano precisa de um nome e pelo menos um tópico.");
      return;
    }
    setSalvando(true);
    try {
      const docRef = doc(db, "planos", planoId);
      await updateDoc(docRef, { nome: nomeEditado, itens: selecionados });
      setPlano({ ...plano, nome: nomeEditado, itens: selecionados });
      setEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirPlano = async () => {
    if (window.confirm("Tem certeza que deseja excluir este plano para sempre?")) {
      try {
        await deleteDoc(doc(db, "planos", planoId));
        router.push("/dashboard");
      } catch (error) {
        alert("Erro ao excluir o plano.");
      }
    }
  };

  // Funções de Expansão e Checkbox (Modo Edição)
  const toggleExpansao = (id: string) => setExpansos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const gerenciarSelecao = (ids: string[], adicionar: boolean) => {
    if (adicionar) setSelecionados(prev => Array.from(new Set([...prev, ...ids])));
    else setSelecionados(prev => prev.filter(id => !ids.includes(id)));
  };
  const selecionarTema = (tema: Tema) => {
    const ids = tema.subtemas.length > 0 ? tema.subtemas.map(s => s.id) : [tema.id];
    const jaSelecionados = ids.length > 0 && ids.every(id => selecionados.includes(id));
    gerenciarSelecao(ids, !jaSelecionados);
  };

  // Funções de Expansão (Modo Visualização)
  const toggleMateriaView = (materia: string) => setMateriasExpansosView(prev => prev.includes(materia) ? prev.filter(m => m !== materia) : [...prev, materia]);
  const toggleTemaView = (temaKey: string) => setTemasExpansosView(prev => prev.includes(temaKey) ? prev.filter(t => t !== temaKey) : [...prev, temaKey]);

  if (carregando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} className="w-10 h-10 rounded-full border-2 border-blue-500/15 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 pb-32 flex flex-col font-sans transition-colors duration-300">
      
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between mb-6 pt-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Painel</span>
        </Link>
        {!editMode && (
          <button onClick={handleExcluirPlano} className="text-red-600 hover:text-red-700 flex items-center gap-2 text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm">
            <Trash2 size={14} /> Excluir
          </button>
        )}
      </header>

      <main className="max-w-7xl w-full mx-auto flex-1">
        
        {/* === MODO DE VISUALIZAÇÃO === */}
        {!editMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-blue-100 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest mb-3">
                  {plano.jornada}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">{plano.nome}</h1>
              </div>
              <button onClick={() => setEditMode(true)} className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 shadow-sm">
                <Edit3 size={16} /> Editar Trilha
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 mb-10 shadow-sm flex flex-col gap-4">
               <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl"><BarChart3 size={24} className="text-blue-600"/></div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">Progresso Geral</h3>
                      <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">
                         {metricasProgresso.concluidos} / {metricasProgresso.total} tópicos concluídos
                      </p>
                    </div>
                  </div>
                  <span className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter leading-none">{metricasProgresso.porcentagem}%</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200">
                  <motion.div initial={{width:0}} animate={{width:`${metricasProgresso.porcentagem}%`}} transition={{duration: 1.5, ease: "easeOut"}} className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {Object.keys(itensAgrupados).map((materia) => (
                <div key={materia} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  
                  <div className="flex items-start justify-between mb-4 cursor-pointer group" onClick={() => toggleMateriaView(materia)}>
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Flag size={16} className="text-blue-600" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">{materia}</h2>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                        {materiasExpansosView.includes(materia) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {materiasExpansosView.includes(materia) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="ml-5 pl-5 border-l-2 border-slate-100 space-y-4 mt-4 pb-2">
                          {Object.keys(itensAgrupados[materia].temas).map(tema => {
                            const jornada = itensAgrupados[materia].jornada;
                            const temaKey = `${materia}-${tema}`;
                            const relatorio = relatoriosMapeados[`${jornada}|${materia}|${tema}`];
                            const isAuditado = !!relatorio;
                            const isTemaExpanded = temasExpansosView.includes(temaKey);
                            
                            const subtopicos = itensAgrupados[materia].temas[tema];
                            const temSubtopicos = subtopicos.length > 0;

                            let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                            if (isAuditado) {
                               if (relatorio.porcentagem_conhecimento >= 70) badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                               else if (relatorio.porcentagem_conhecimento >= 40) badgeColor = "bg-blue-100 text-blue-700 border-blue-200";
                               else badgeColor = "bg-red-100 text-red-700 border-red-200";
                            }

                            return (
                              <div key={tema} className="relative group">
                                <div className={`absolute -left-[27px] top-[1rem] -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-white transition-colors z-10 ${isAuditado ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                                <div className={`p-3 md:p-4 rounded-xl border transition-all flex flex-col gap-3 ${isAuditado ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/80 border-slate-200'}`}>
                                  
                                  <div className={`flex items-start justify-between gap-3 ${temSubtopicos ? 'cursor-pointer group/tema' : ''}`} onClick={() => temSubtopicos && toggleTemaView(temaKey)}>
                                    <div className="flex flex-col gap-2 flex-1">
                                      <h3 className={`text-sm font-bold leading-snug ${isAuditado ? 'text-slate-800' : 'text-slate-600 group-hover/tema:text-slate-900'}`}>{tema}</h3>
                                      {isAuditado && (
                                        <span className={`self-start px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${badgeColor}`}>
                                          {relatorio.porcentagem_conhecimento}% • {relatorio.nivel_explicacao}
                                        </span>
                                      )}
                                    </div>
                                    {temSubtopicos && (
                                      <div className="text-slate-400 group-hover/tema:text-slate-600 transition-colors mt-0.5 shrink-0">
                                        <ChevronDown size={16} className={`transform transition-transform duration-200 ${isTemaExpanded ? 'rotate-180' : ''}`} />
                                      </div>
                                    )}
                                  </div>

                                  {temSubtopicos && (
                                    <AnimatePresence>
                                      {isTemaExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                          <div className="pt-2 border-t border-slate-200/60 mt-1 mb-1">
                                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                                <span className="text-slate-400 mr-1 font-semibold uppercase tracking-wider text-[9px]">Subtópicos:</span> 
                                                {subtopicos.join(" • ")}
                                              </p>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  )}

                                  <div className={`flex items-center justify-end gap-2 w-full pt-3 ${temSubtopicos ? 'border-t border-slate-200/60' : 'mt-1'}`}>
                                    {isAuditado ? (
                                      <>
                                        <Link href={`/dashboard/auditorio?jornada=${jornada}&materia=${materia}&tema=${tema}`}>
                                          <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm" title="Refazer Auditoria">
                                            <RotateCcw size={14} />
                                          </button>
                                        </Link>
                                        <Link href={`/dashboard/relatorio/${relatorio.id}`} className="flex-1">
                                          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                                            <FileText size={14} /> Relatório
                                          </button>
                                        </Link>
                                      </>
                                    ) : (
                                      <Link href={`/dashboard/auditorio?jornada=${jornada}&materia=${materia}&tema=${tema}`} className="w-full">
                                        <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm">
                                          <Mic size={14} /> Auditar Tema
                                        </button>
                                      </Link>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (

        /* === MODO DE EDIÇÃO === */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-24 max-w-3xl mx-auto">
            <div className="mb-6 space-y-4">
              <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <Edit3 size={20} /> Editando Trilha
              </h2>
              <input type="text" value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 text-lg font-semibold shadow-sm" />
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar matéria para adicionar à trilha..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm shadow-sm placeholder-slate-400" onChange={(e) => setBusca(e.target.value)} />
            </div>

            <div className="space-y-3">
              {dadosFiltradosEdicao.map((materia: Materia) => (
                <div key={materia.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => toggleExpansao(materia.id)} className="w-full p-4 flex items-center gap-2 font-bold text-slate-800 text-left hover:bg-slate-50 transition-colors cursor-pointer text-sm">
                    {expansos.includes(materia.id) ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>} {materia.nome}
                  </button>
                  <AnimatePresence>
                    {expansos.includes(materia.id) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                        {materia.temas.map(tema => {
                          const temaSubIds = tema.subtemas.length > 0 ? tema.subtemas.map(s => s.id) : [tema.id];
                          const temaCheck = temaSubIds.every(id => selecionados.includes(id));
                          return (
                            <div key={tema.id} className="ml-2 border-l border-slate-300 pl-4 py-1">
                              <div className="flex items-center mb-2">
                                <input type="checkbox" checked={temaCheck} onChange={() => selecionarTema(tema)} className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 mr-2 cursor-pointer" />
                                <span className="text-xs font-semibold text-slate-700">{tema.nome}</span>
                              </div>
                              {tema.subtemas.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-5 mt-2">
                                  {tema.subtemas.map(sub => (
                                    <label key={sub.id} className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer p-1">
                                      <input type="checkbox" checked={selecionados.includes(sub.id)} onChange={() => gerenciarSelecao([sub.id], !selecionados.includes(sub.id))} className="w-3 h-3 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500" /> {sub.nome}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
                <button onClick={() => { setEditMode(false); setSelecionados(plano.itens); setNomeEditado(plano.nome); }} className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-sm">
                  Cancelar
                </button>
                <button onClick={handleSalvarEdicao} disabled={salvando} className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md cursor-pointer text-sm">
                  {salvando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}