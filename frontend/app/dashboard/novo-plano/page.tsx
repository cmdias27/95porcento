// frontend/app/dashboard/novo-plano/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronDown, Search, 
  CheckCircle2, ArrowLeft, Loader2, Edit3 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Firebase
import { db, auth } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Importando os dados locais ao invés de buscar na API
import { JORNADAS_ESTUDO, Jornada, Materia, Tema } from "@/data/materias";

export default function NovoPlano() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  // Estados do Plano
  const [nomePlano, setNomePlano] = useState("");
  const [jornadaAtiva, setJornadaAtiva] = useState<'concurso' | 'enem'>('concurso');
  const [busca, setBusca] = useState("");
  const [expansos, setExpansos] = useState<string[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Filtro instantâneo baseado nos dados locais
  const dadosFiltrados = useMemo(() => {
    const jornada = JORNADAS_ESTUDO.find(j => j.id === jornadaAtiva);
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
  }, [jornadaAtiva, busca]);

  // --- FUNÇÃO PARA SALVAR O PLANO NO FIREBASE ---
  const handleCriarPlano = async () => {
    if (!nomePlano.trim()) {
      alert("Por favor, dê um nome ao seu plano de estudos.");
      return;
    }

    setSalvando(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      // Criamos o objeto do plano salvando os IDs locais
      const novoPlano = {
        userId: user.uid,
        nome: nomePlano,
        jornada: jornadaAtiva,
        itens: selecionados, // Lista de IDs das matérias/temas (ex: "cs42")
        progressoGeral: 0,
        dataCriacao: serverTimestamp(),
        ativo: true
      };

      // Salva no Firestore
      await addDoc(collection(db, "planos"), novoPlano);
      
      // Feedback e Redirecionamento
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      alert("Erro ao salvar o plano. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  // Funções de Seleção
  const toggleExpansao = (id: string) => setExpansos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const gerenciarSelecao = (ids: string[], adicionar: boolean) => {
    if (adicionar) setSelecionados(prev => Array.from(new Set([...prev, ...ids])));
    else setSelecionados(prev => prev.filter(id => !ids.includes(id)));
  };
  
  const selecionarMateria = (materia: Materia) => {
    const todosIds = materia.temas.flatMap(t => t.subtemas.length > 0 ? t.subtemas.map(s => s.id) : [t.id]);
    const jaSelecionados = todosIds.length > 0 && todosIds.every(id => selecionados.includes(id));
    gerenciarSelecao(todosIds, !jaSelecionados);
  };
  
  const selecionarTema = (tema: Tema) => {
    const ids = tema.subtemas.length > 0 ? tema.subtemas.map(s => s.id) : [tema.id];
    const jaSelecionados = ids.length > 0 && ids.every(id => selecionados.includes(id));
    gerenciarSelecao(ids, !jaSelecionados);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 pb-32 flex flex-col font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8 pt-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
          <ArrowLeft size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Painel</span>
        </Link>
        <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-300 shadow-inner">
          <button onClick={() => {setJornadaAtiva('concurso'); setSelecionados([]);}} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${jornadaAtiva === 'concurso' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'}`}>CONCURSO</button>
          <button onClick={() => {setJornadaAtiva('enem'); setSelecionados([]);}} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${jornadaAtiva === 'enem' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'}`}>ENEM</button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        
        {/* INPUT DE NOME DO PLANO */}
        <div className="mb-10 text-center space-y-4">
          <h1 className="text-3xl font-black mb-2 text-slate-900">Novo Plano de Estudos</h1>
          <div className="relative max-w-md mx-auto">
            <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Dê um nome ao seu plano (ex: Foco PF 2026)"
              value={nomePlano}
              onChange={(e) => setNomePlano(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 text-center font-bold shadow-sm placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>

        {/* BUSCA */}
        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar matéria ou tema..." 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 shadow-sm placeholder:text-slate-400 font-medium" 
            onChange={(e) => setBusca(e.target.value)} 
          />
        </div>

        {/* LISTAGEM DOS DADOS LOCAIS */}
        <div className="space-y-4 flex-1">
          {dadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p className="font-medium">Nenhum resultado encontrado para a sua busca.</p>
            </div>
          ) : (
            dadosFiltrados.map(materia => {
              const todosSubIds = materia.temas.flatMap(t => t.subtemas.length > 0 ? t.subtemas.map(s => s.id) : [t.id]);
              const materiaCheck = todosSubIds.length > 0 && todosSubIds.every(id => selecionados.includes(id));
              
              return (
                <div key={materia.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center p-4 bg-white hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={materiaCheck} onChange={() => selecionarMateria(materia)} className="w-5 h-5 rounded border-slate-300 bg-white text-blue-600 mr-4 cursor-pointer focus:ring-blue-500" />
                    <button onClick={() => toggleExpansao(materia.id)} className="flex-1 flex items-center gap-2 font-bold text-slate-800 text-left hover:text-blue-600 transition-colors cursor-pointer">
                      {expansos.includes(materia.id) ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />} {materia.nome}
                    </button>
                  </div>
                  <AnimatePresence>
                    {expansos.includes(materia.id) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                        {materia.temas.map(tema => {
                          const temaSubIds = tema.subtemas.length > 0 ? tema.subtemas.map(s => s.id) : [tema.id];
                          const temaCheck = temaSubIds.every(id => selecionados.includes(id));
                          
                          return (
                            <div key={tema.id} className="ml-4 border-l border-slate-300 pl-6 py-1">
                              <div className="flex items-center mb-2 group">
                                <input type="checkbox" checked={temaCheck} onChange={() => selecionarTema(tema)} className="w-4 h-4 rounded border-slate-300 bg-white text-blue-500 mr-3 cursor-pointer focus:ring-blue-500" />
                                <button onClick={() => tema.subtemas.length > 0 && toggleExpansao(tema.id)} className={`text-sm font-bold flex items-center gap-1 cursor-pointer transition-colors ${tema.subtemas.length > 0 ? 'text-slate-700 hover:text-blue-600' : 'text-slate-500'}`}>
                                  {tema.subtemas.length > 0 && (expansos.includes(tema.id) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)} {tema.nome}
                                </button>
                              </div>
                              <AnimatePresence>
                                {tema.subtemas.length > 0 && expansos.includes(tema.id) && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6 mt-3">
                                    {tema.subtemas.map(sub => (
                                      <label key={sub.id} className="flex items-center gap-3 text-xs text-slate-600 hover:text-slate-900 cursor-pointer p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors">
                                        <input type="checkbox" checked={selecionados.includes(sub.id)} onChange={() => gerenciarSelecao([sub.id], !selecionados.includes(sub.id))} className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-blue-500 focus:ring-blue-500 cursor-pointer" /> {sub.nome}
                                      </label>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* BOTÃO FLUTUANTE DE CRIAR PLANO */}
      <AnimatePresence>
        {selecionados.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
            <button 
              onClick={handleCriarPlano}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-2xl font-bold shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
            >
              {salvando ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
              {salvando ? "Salvando Plano..." : `Criar Plano (${selecionados.length} tópicos)`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}