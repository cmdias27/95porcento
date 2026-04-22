// frontend/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, Mic, ChevronRight, HelpCircle, 
  Zap, Brain, Target, LineChart, Mail, Lock, Loader2, X
} from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { JORNADAS_ESTUDO, Jornada, Materia } from "@/data/materias";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  // Estados dos Modais e Autenticação
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isLoginModo, setIsLoginModo] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authErro, setAuthErro] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Estados de Seleção do Dashboard
  const [jornadaAtiva, setJornadaAtiva] = useState<'concurso' | 'enem' | 'livre'>('concurso');
  const [materiaSel, setMateriaSel] = useState("");
  const [temaSel, setTemaSel] = useState("");
  const [textoLivre, setTextoLivre] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setCarregandoAuth(false);
      if (user) {
        setShowAuthModal(false);
        setShowHowItWorks(false);
      }
    });
    return () => unsub();
  }, []);

  const jornadaAtual = useMemo(() => JORNADAS_ESTUDO.find(j => j.nome.toLowerCase() === jornadaAtiva.toLowerCase()), [jornadaAtiva]);
  const materiaAtual = useMemo(() => jornadaAtual?.materias.find(m => m.nome === materiaSel), [jornadaAtual, materiaSel]);

  // Funções de Autenticação
  const handleLoginGoogle = async () => {
    try { 
      await signInWithPopup(auth, googleProvider); 
    } catch (error: any) { 
      setAuthErro("Erro ao acessar com Google. Tente novamente."); 
    }
  };

  const traduzirErroFirebase = (codigo: string) => {
    switch (codigo) {
      case 'auth/invalid-credential': return "Email ou senha incorretos.";
      case 'auth/email-already-in-use': return "Este email já está cadastrado.";
      case 'auth/weak-password': return "A senha deve ter pelo menos 6 caracteres.";
      case 'auth/invalid-email': return "Digite um formato de e-mail válido.";
      default: return "Ocorreu um erro na autenticação.";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErro("");
    setAuthLoading(true);

    try {
      if (isLoginModo) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        await createUserWithEmailAndPassword(auth, email, senha);
      }
    } catch (error: any) {
      setAuthErro(traduzirErroFirebase(error.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const iniciarAuditoria = () => {
    const temaFinal = jornadaAtiva === 'livre' ? textoLivre : temaSel;
    if (!temaFinal) return;
    router.push(`/dashboard/auditorio?jornada=${jornadaAtiva}&materia=${encodeURIComponent(materiaSel || 'Livre')}&tema=${encodeURIComponent(temaFinal)}`);
  };

  const fecharModalAuth = () => {
    setShowAuthModal(false);
    setAuthErro("");
    setEmail("");
    setSenha("");
  };

  if (carregandoAuth) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-black font-sans selection:bg-blue-200 flex flex-col overflow-x-hidden relative">
      
      {/* CAMADA DE ANIMAÇÃO DE FUNDO */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#94A3B8" />
            </pattern>
          </defs>
          <motion.rect 
            width="100%" height="100%" fill="url(#dotPattern)"
            animate={{ x: [0, 32, 0], y: [0, 16, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      {/* NAVBAR */}
      <nav className="w-full px-8 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-black z-20">
        <div className="flex items-center gap-3">
          <span 
            className="text-3xl font-black tracking-tighter text-black" 
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            95<span className="text-blue-600">%</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowHowItWorks(true)}
            className="text-xs font-bold text-slate-600 hover:text-black transition-colors flex items-center gap-1.5 uppercase tracking-wider"
          >
            <HelpCircle size={14} /> Como funciona
          </button>
          {user && (
            <button onClick={() => signOut(auth)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 transition-all">
              Sair
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 py-12">
        <AnimatePresence mode="wait">
          {!user ? (
            /* =========================================
               HERO (DESLOGADO)
               ========================================= */
            <motion.div key="hero" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center space-y-12 max-w-5xl w-full">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  Ensine para <span className="text-blue-600">aprender.</span>
                </h1>
              </div>

              <motion.div 
                initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4"
              >
                {[
                  { icon: <Zap className="text-amber-600" size={18}/>, text: "95% da retenção de conhecimento acontece quando você explica o conteúdo." },
                  { icon: <Brain className="text-blue-600" size={18}/>, text: "Ao ensinar, seu cérebro forma conexões neurais muito mais profundas e duradouras do que na simples revisão." },
                  { icon: <Target className="text-red-600" size={18}/>, text: "Explique para uma Inteligência Artificial treinada com teoria profunda e questões reais." },
                  { icon: <LineChart className="text-emerald-600" size={18}/>, text: "Relatório detalhado comparando seu conhecimento com o exigido atualmente pelas bancas." },
                ].map((card, i) => (
                  <motion.div
                    key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="bg-slate-200 p-6 rounded-2xl border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex flex-col items-center text-center space-y-3"
                  >
                    <div className="p-2.5 bg-white rounded-xl border border-black">{card.icon}</div>
                    <p className="text-[12px] font-bold leading-relaxed text-black">{card.text}</p>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* BOTÃO ÚNICO E DESTAQUE */}
              <div className="pt-4">
                <motion.button 
                  whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)" }}
                  whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={() => setShowAuthModal(true)} 
                  className="bg-black text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 mx-auto"
                >
                  <Zap size={18} className="text-amber-400 fill-amber-400" />
                  Fixar Conteúdo Agora
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* =========================================
               DASHBOARD LOGADO (COCKPIT DE ESTUDO)
               ========================================= */
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-black leading-snug">
                  Olá, {user.displayName ? user.displayName.split(' ')[0] : 'Estudante'}. <br />
                  O que vamos <span className="text-blue-600">fixar</span> hoje?
                </h2>
                <p className="text-sm text-slate-600 font-bold leading-relaxed max-w-sm">
                  Selecione o tema e inicie sua aula. Nossa IA avaliará sua precisão técnica.
                </p>
                <div className="flex gap-4 pt-4">
                   <div className="bg-slate-200 px-5 py-4 rounded-2xl border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] flex-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 tracking-widest">Status</span>
                      <span className="text-sm font-black text-black flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-black" /> IA Online</span>
                   </div>
                   <div className="bg-slate-200 px-5 py-4 rounded-2xl border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] flex-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 tracking-widest">Método</span>
                      <span className="text-sm font-black text-black">Ativo</span>
                   </div>
                </div>
              </div>

              {/* Box de Seleção */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-200 border border-black rounded-[2.5rem] p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden">
                <div className="flex p-1.5 bg-slate-300 rounded-xl border border-black relative z-10">
                  {['concurso', 'enem', 'livre'].map((j) => (
                    <button key={j} onClick={() => {setJornadaAtiva(j as any); setMateriaSel(""); setTemaSel("");}} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${jornadaAtiva === j ? 'bg-black text-white border border-black shadow-sm' : 'text-slate-600 hover:text-black'}`}>
                      {j}
                    </button>
                  ))}
                </div>
                <div className="space-y-4 relative z-10">
                  {jornadaAtiva === 'livre' ? (
                    <textarea value={textoLivre} onChange={(e) => setTextoLivre(e.target.value)} placeholder="Sobre o que você quer falar?" className="w-full bg-white border border-black rounded-xl p-5 outline-none focus:ring-4 focus:ring-blue-600/30 text-sm font-bold text-black placeholder-slate-400 h-32 resize-none" />
                  ) : (
                    <>
                      <select value={materiaSel} onChange={(e) => {setMateriaSel(e.target.value); setTemaSel("");}} className="w-full bg-white border border-black rounded-xl p-5 text-black text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/30 appearance-none cursor-pointer">
                        <option value="" disabled className="text-slate-400">Escolha a Disciplina</option>
                        {jornadaAtual?.materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                      </select>
                      {materiaSel && (
                        <motion.select initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} value={temaSel} onChange={(e) => setTemaSel(e.target.value)} className="w-full bg-white border border-black rounded-xl p-5 text-black text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/30 appearance-none cursor-pointer">
                          <option value="" disabled className="text-slate-400">Escolha o Tema</option>
                          {materiaAtual?.temas.map(t => <option key={t} value={t}>{t}</option>)}
                        </motion.select>
                      )}
                    </>
                  )}
                </div>
                <button 
                  onClick={iniciarAuditoria} disabled={jornadaAtiva === 'livre' ? !textoLivre.trim() : (!materiaSel || !temaSel)}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:border disabled:border-slate-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none transition-all active:scale-95 group relative z-10"
                >
                  <Mic size={16} /> Entrar no Auditório <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* RODAPÉ ATUALIZADO */}
      <footer className="w-full py-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] z-10">
        95porcento • Active Learning Protocol
      </footer>

      {/* =========================================
          MODAL COMO FUNCIONA
          ========================================= */}
      <AnimatePresence>
        {showHowItWorks && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-2xl bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header do Modal */}
              <div className="p-6 border-b-4 border-black bg-blue-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <BrainCircuit size={24} />
                  <h2 className="text-xl font-black uppercase tracking-tight">O Protocolo de Estudo</h2>
                </div>
                <button onClick={() => setShowHowItWorks(false)} className="bg-white text-black border-2 border-black p-1 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo com Scroll */}
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-10">
                
                {/* Passo 1 */}
                <section className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-400 border-2 border-black rounded-full flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">1</div>
                  <div>
                    <h3 className="text-lg font-black uppercase mb-2">A Técnica de Feynman</h3>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed">
                      Estudos comprovam que retemos até <strong className="text-black">95% do conteúdo</strong> quando o explicamos. O primeiro passo é escolher um tema e dar uma "aula" para a nossa IA. Você pode falar ou digitar.
                    </p>
                  </div>
                </section>

                {/* Passo 2 */}
                <section className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-400 border-2 border-black rounded-full flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">2</div>
                  <div>
                    <h3 className="text-lg font-black uppercase mb-2">Auditoria em Tempo Real</h3>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed">
                      Nossa IA atua como um <strong className="text-black">Examinador de Banca</strong>, identificando inconsistências conceituais, erros técnicos e omissões de tópicos essenciais logo após sua explicação.
                    </p>
                  </div>
                </section>

                {/* Passo 3 */}
                <section className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">3</div>
                  <div>
                    <h3 className="text-lg font-black uppercase mb-2">Predição de Desempenho</h3>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed">
                      Cruzamos sua explicação com nosso banco de questões reais. O relatório final indica o seu <strong className="text-black">Score de Fixação</strong> e estimará quantas questões você acertaria em prova hoje.
                    </p>
                  </div>
                </section>

                {/* CTA final */}
                {!user && (
                  <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Pronto para começar?</p>
                    <button 
                      onClick={() => { setShowHowItWorks(false); setShowAuthModal(true); }}
                      className="mt-4 bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                    >
                      Criar Conta Gratuita
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================
          MODAL DE AUTENTICAÇÃO
          ========================================= */}
      <AnimatePresence>
        {showAuthModal && !user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white p-8 rounded-[2rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left relative"
            >
               <button onClick={fecharModalAuth} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-full transition-colors">
                 <X size={20} />
               </button>

               <h2 className="text-2xl font-black mb-6 pr-8">
                 {isLoginModo ? "Acesse sua conta" : "Crie sua conta"}
               </h2>

               {authErro && (
                 <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg text-center">
                   {authErro}
                 </div>
               )}

               <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">E-mail</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-black rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/30 transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-black rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/30 transition-all"
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button disabled={authLoading} type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-2">
                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : (isLoginModo ? "Entrar" : "Cadastrar")}
                  </button>
               </form>

               <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Ou</span>
                  <div className="flex-1 h-px bg-slate-200" />
               </div>

               <button onClick={handleLoginGoogle} type="button" className="w-full bg-white text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 active:shadow-none active:translate-y-[4px]">
                 <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                 Entrar com Google
               </button>

               <p className="mt-6 text-center text-xs font-bold text-slate-500">
                 {isLoginModo ? "Não tem uma conta?" : "Já possui conta?"}{" "}
                 <button onClick={() => { setIsLoginModo(!isLoginModo); setAuthErro(""); }} className="text-blue-600 hover:underline">
                   {isLoginModo ? "Cadastre-se" : "Faça Login"}
                 </button>
               </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}