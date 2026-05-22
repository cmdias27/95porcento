"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { JORNADAS_ESTUDO } from "@/data/materias";

// ─── Logo simples (só texto) ───────────────────────────────────
function Marca() {
  return (
    <span className="font-black text-xl leading-none tracking-tighter select-none">
      <span className="text-white">95</span>
      <span className="text-blue-400">%</span>
    </span>
  );
}

// ─── Tipos ─────────────────────────────────────────────────────
type Etapa = "jornada" | "assunto";

const JORNADAS = [
  { value: "concurso", label: "Concurso Público", sub: "Federal, Estadual, Municipal" },
  { value: "oab",      label: "OAB",              sub: "1ª e 2ª fase"               },
  { value: "enem",     label: "ENEM",             sub: "Redação e objetivas"         },
] as const;

// ─── Página ─────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [etapa, setEtapa]             = useState<Etapa>("jornada");
  const [jornada, setJornada]         = useState("");
  const [usarTexto, setUsarTexto]     = useState(true);
  const [textoLivre, setTextoLivre]   = useState("");
  const [materia, setMateria]         = useState("");
  const [tema, setTema]               = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
      else setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  const jornadaObj = useMemo(
    () => JORNADAS_ESTUDO.find(j => j.nome.toLowerCase() === jornada),
    [jornada],
  );
  const materiaObj = useMemo(
    () => jornadaObj?.materias.find(m => m.nome === materia),
    [jornadaObj, materia],
  );

  const podeAvancarAssunto = usarTexto
    ? textoLivre.trim().length > 0
    : materia !== "" && tema !== "";

  const selecionarJornada = (j: string) => {
    setJornada(j);
    setEtapa("assunto");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const avancarAssunto = () => {
    if (!podeAvancarAssunto) return;
    if (usarTexto) {
      sessionStorage.setItem("pending_topic", textoLivre.trim());
    } else {
      sessionStorage.setItem("pending_topic", `${materia} — ${tema}`);
      sessionStorage.setItem("pending_materia", materia);
      sessionStorage.setItem("pending_tema", tema);
    }
    sessionStorage.setItem("pending_jornada", jornada);
    router.push("/login");
  };

  // ── Loading ──────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="h-[100dvh] bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#080808]">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-5 md:px-10 h-14 shrink-0">
        <Marca />
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/login")}
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white px-4 py-2 transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-[11px] font-black uppercase tracking-widest bg-white text-black px-4 py-2.5 rounded-xl hover:bg-blue-500 hover:text-white transition-colors"
          >
            Criar conta
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col justify-end px-5 md:px-16 pb-10 md:pb-14 pt-6 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
            Estudo Ativo com IA
          </p>

          <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-black text-white leading-[1.06] tracking-tight">
            Você está realmente<br />
            preparado para<br />
            <span className="text-blue-400">a sua prova?</span>
          </h1>

          <div className="space-y-2 pt-1">
            <p className="text-xl md:text-2xl font-black text-slate-300">
              Então prove.
            </p>
            <p className="text-[clamp(0.875rem,1.6vw,1.1rem)] font-medium text-slate-500 max-w-lg leading-relaxed">
              Explique um assunto para a nossa IA. Suas conexões neurais serão
              ativadas. O conteúdo não sairá mais da sua cabeça.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Card de fluxo (fundo branco) ──────────────────────── */}
      <motion.section
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-t-[2rem] md:rounded-t-[2.5rem] w-full shadow-[0_-8px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="max-w-3xl mx-auto px-5 md:px-12 pt-8 pb-10 md:pt-10 md:pb-14">

          <p className="text-xl md:text-2xl font-black text-black mb-7">
            Olá! O que quer fixar hoje?
          </p>

          <AnimatePresence mode="wait">

            {/* ───── ETAPA 1: JORNADA ───── */}
            {etapa === "jornada" && (
              <motion.div key="jornada"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Qual é o seu objetivo?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {JORNADAS.map(j => (
                    <button key={j.value} onClick={() => selecionarJornada(j.value)}
                      className="group py-5 px-5 rounded-2xl border-2 border-slate-200 text-left hover:border-black hover:bg-black transition-all duration-200"
                    >
                      <p className="font-black text-slate-800 group-hover:text-white transition-colors">
                        {j.label}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-400 mt-1">
                        {j.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ───── ETAPA 2: ASSUNTO ───── */}
            {etapa === "assunto" && (
              <motion.div key="assunto"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setEtapa("jornada")}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
                    ← Voltar
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {JORNADAS.find(j => j.value === jornada)?.label}
                  </span>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Qual assunto quer estudar?
                </p>

                {/* Toggle: digitar ou selecionar */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                  {[{ v: true, l: "Digitar" }, { v: false, l: "Selecionar" }].map(({ v, l }) => (
                    <button key={l} onClick={() => setUsarTexto(v)}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all ${
                        usarTexto === v ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black"
                      }`}
                    >{l}</button>
                  ))}
                </div>

                {usarTexto ? (
                  <textarea
                    ref={textareaRef}
                    value={textoLivre}
                    onChange={e => setTextoLivre(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); avancarAssunto(); } }}
                    placeholder="ex: princípios da administração pública..."
                    rows={3}
                    className="w-full resize-none border-2 border-slate-200 rounded-xl p-4 outline-none font-medium text-slate-800 placeholder-slate-300 text-sm leading-relaxed focus:border-black transition-colors"
                  />
                ) : (
                  <div className="space-y-3">
                    <select value={materia}
                      onChange={e => { setMateria(e.target.value); setTema(""); }}
                      className="w-full border-2 border-slate-200 rounded-xl p-4 outline-none font-bold text-slate-700 bg-white focus:border-black transition-colors">
                      <option value="">Selecione a matéria</option>
                      {jornadaObj?.materias.map(m => (
                        <option key={m.id} value={m.nome}>{m.nome}</option>
                      ))}
                    </select>
                    {materia && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <select value={tema} onChange={e => setTema(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl p-4 outline-none font-bold text-slate-700 bg-white focus:border-black transition-colors">
                          <option value="">Selecione o tema</option>
                          {materiaObj?.temas.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </div>
                )}

                <button onClick={avancarAssunto} disabled={!podeAvancarAssunto}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-25 flex items-center justify-center gap-2">
                  Continuar <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.section>

    </div>
  );
}
