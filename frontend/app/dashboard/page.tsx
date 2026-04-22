// frontend/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, Mic, LogOut, Sparkles, ChevronRight, HelpCircle, 
  Zap, Brain, Target, LineChart 
} from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { JORNADAS_ESTUDO } from "@/data/materias";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  // Estados de Seleção
  const [jornadaAtiva, setJornadaAtiva] = useState<'concurso' | 'enem' | 'livre'>('concurso');
  const [materiaSel, setMateriaSel] = useState("");
  const [temaSel, setTemaSel] = useState("");
  const [textoLivre, setTextoLivre] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setCarregandoAuth(false);
    });
    return () => unsub();
  }, []);

  const jornadaAtual = useMemo(() => JORNADAS_ESTUDO.find(j => j.id === jornadaAtiva), [jornadaAtiva]);
  const materiaAtual = useMemo(() => jornadaAtual?.materias.find(m => m.nome === materiaSel), [jornadaAtual, materiaSel]);

  const handleLoginGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error: any) { alert(`Erro: ${error.message}`); }
  };

  const iniciarAuditoria = () => {
    const temaFinal = jornadaAtiva === 'livre' ? textoLivre : temaSel;
    if (!temaFinal) return;
    router.push(`/dashboard/auditorio?jornada=${jornadaAtiva}&materia=${encodeURIComponent(materiaSel || 'Livre')}&tema=${encodeURIComponent(temaFinal)}`);
  };

  if (carregandoAuth) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 flex flex-col overflow-hidden relative">
      
      {/* CAMADA DE ANIMAÇÃO DE FUNDO: MALHA DIGITAL */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#CBD5E1" />
            </pattern>
          </defs>
          <motion.rect 
            width="100%" 
            height="100%" 
            fill="url(#dotPattern)"
            animate={{ x: [0, 32, 0], y: [0, 16, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px]" 
        />
      </div>

      {/* NAVBAR */}
      <nav className="w-full px-8 py-5 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-slate-200 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10">
            <BrainCircuit className="text-white" size={18} />
          </div>
          <span className="text-base font-bold tracking-tight">Aprendizado Ativo</span>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
            <HelpCircle size={14} /> Como funciona
          </button>
          {user && (
            <button onClick={() => signOut(auth)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all">
              Sair
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 py-12">
        <AnimatePresence mode="wait">
          {!user ? (
            /* HERO (USUÁRIO DESLOGADO) */
            <motion.div key="hero" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center space-y-12 max-w-5xl">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Active Learning Protocol</span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Ensine para <span className="text-blue-600">aprender.</span>
                </h1>
              </div>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4"
              >
                {[
                  { icon: <Zap className="text-amber-500" size={18}/>, text: "95% da retenção acontece quando você explica o conteúdo — é o nível máximo de aprendizado." },
                  { icon: <Brain className="text-blue-500" size={18}/>, text: "Ao ensinar, seu cérebro cria conexões neurais profundas e duradouras." },
                  { icon: <Target className="text-red-500" size={18}/>, text: "Explique para uma IA treinada e receba um diagnóstico imediato do seu domínio." },
                  { icon: <LineChart className="text-emerald-500" size={18}/>, text: "Estude, explique novamente e evolua até ficar à frente de 99% dos concorrentes." },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 20, rotateX: 15 },
                      visible: { opacity: 1, y: 0, rotateX: 0 }
                    }}
                    whileHover={{ scale: 1.04, rotateY: 4, rotateX: -4, z: 40, boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.08)" }}
                    className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl shadow-slate-300/30 flex flex-col items-center text-center space-y-3 cursor-default transition-all duration-300"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">{card.icon}</div>
                    <p className="text-[12px] font-medium leading-relaxed text-slate-300">{card.text}</p>
                  </motion.div>
                ))}
              </motion.div>
              
              <button onClick={handleLoginGoogle} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-3 mx-auto">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-200" alt="G" />
                Fixar Conteúdo Agora
              </button>
            </motion.div>
          ) : (
            /* DASHBOARD LOGADO COM CARDS ESCUROS */
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-slate-900 leading-snug">
                  Olá, {user.displayName?.split(' ')[0]}. <br />
                  O que vamos <span className="text-blue-600">fixar</span> hoje?
                </h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
                  Selecione o tema e inicie sua aula. Nossa IA avaliará sua precisão técnica.
                </p>
                <div className="flex gap-4 pt-4">
                   <div className="bg-slate-900 px-5 py-4 rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-800 flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Status</span>
                      <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> IA Online</span>
                   </div>
                   <div className="bg-slate-900 px-5 py-4 rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-800 flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Método</span>
                      <span className="text-sm font-bold text-white">Ativo</span>
                   </div>
                </div>
              </div>

              {/* Box de Seleção Dark Mode */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-400/20 space-y-8 relative overflow-hidden"
              >
                {/* Aura interna sutil para dar volume ao card escuro */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                
                <div className="flex p-1.5 bg-slate-950 rounded-xl border border-slate-800/60 relative z-10">
                  {['concurso', 'enem', 'livre'].map((j) => (
                    <button key={j} onClick={() => {setJornadaAtiva(j as any); setMateriaSel(""); setTemaSel("");}} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${jornadaAtiva === j ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                      {j}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 relative z-10">
                  {jornadaAtiva === 'livre' ? (
                    <textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)} placeholder="Sobre o que você quer falar?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 outline-none focus:border-blue-500 text-sm font-bold text-white placeholder-slate-600 h-32 resize-none" />
                  ) : (
                    <>
                      <select value={materiaSel} onChange={(e) => {setMateriaSel(e.target.value); setTemaSel("");}} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-white text-sm font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer">
                        <option value="" disabled className="text-slate-500">Escolha a Disciplina</option>
                        {jornadaAtual?.materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                      </select>
                      {materiaSel && (
                        <motion.select initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} value={temaSel} onChange={(e) => setTemaSel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-white text-sm font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer">
                          <option value="" disabled className="text-slate-500">Escolha o Tema</option>
                          {materiaAtual?.temas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                        </motion.select>
                      )}
                    </>
                  )}
                </div>

                <button 
                  onClick={iniciarAuditoria}
                  disabled={jornadaAtiva === 'livre' ? !textoLivre.trim() : (!materiaSel || !temaSel)}
                  className="w-full bg-slate-950 text-white py-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 transition-all shadow-xl active:scale-95 group relative z-10"
                >
                  <Mic size={16} /> Entrar no Auditório <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full py-6 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] z-10">
        High Fidelity AI Auditor • 2026
      </footer>
    </div>
  );
}