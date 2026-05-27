"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowRight, BookOpen, Brain, Calendar, Check, ChevronRight,
  FileText, Loader2, Mic, Pencil, Play, Target, Zap,
} from "lucide-react";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { AppHeader } from "@/components/AppHeader";
import { JORNADAS_ESTUDO } from "@/data/materias";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowState = "auth" | "chat" | "extraindo" | "confirmando" | "modo";
type ModoSessao = "livre" | "guiado" | "simulado";

type SessaoRecente = {
  id: string; materia: string; tema: string;
  modo: ModoSessao; url: string; ts: number;
};

const MODOS: { value: ModoSessao; label: string; desc: string; icon: typeof Mic; color: string; bg: string; border: string }[] = [
  { value: "livre",    label: "Livre",    icon: Mic,    desc: "Você explica livremente. A IA analisa seu raciocínio.",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  { value: "guiado",   label: "Guiado",   icon: Target, desc: "A IA conduz com perguntas progressivas por fases.",        color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { value: "simulado", label: "Simulado", icon: Brain,  desc: "Cenário hipotético apresentado como em prova real.",       color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200"  },
];

const MODO_URLS: Record<ModoSessao, string> = {
  livre:    "/dashboard/auditorio",
  guiado:   "/dashboard/modos/guiado",
  simulado: "/dashboard/modos/simulado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const MODO_LABEL: Record<ModoSessao, string> = { livre: "Livre", guiado: "Guiado", simulado: "Simulado" };
const MODO_DOT:   Record<ModoSessao, string> = { livre: "bg-blue-500", guiado: "bg-emerald-500", simulado: "bg-violet-500" };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router  = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [flow,     setFlow]     = useState<FlowState>("auth");
  const [nome,     setNome]     = useState("Estudante");
  const [jornada,  setJornada]  = useState("concurso");
  const [nivel,    setNivel]    = useState("Intermediario");
  const [banca,    setBanca]    = useState("Livre");

  const [texto,    setTexto]    = useState("");
  const [materia,  setMateria]  = useState("");
  const [tema,     setTema]     = useState("");
  const [editando, setEditando] = useState(false);

  const [modo,     setModo]     = useState<ModoSessao>("guiado");
  const [recentes, setRecentes] = useState<SessaoRecente[]>([]);

  const [historico,            setHistorico]            = useState<string[]>([]);
  const [temHistorico,         setTemHistorico]         = useState(false);
  const [carregandoHistorico,  setCarregandoHistorico]  = useState(false);
  const [personalizada,        setPersonalizada]        = useState(false);

  const [emailVerificado,  setEmailVerificado]  = useState(true);
  const [isGoogleUser,     setIsGoogleUser]     = useState(false);

  const reenviarVerificacao = async () => {
    const u = auth.currentUser;
    if (u) { try { await sendEmailVerification(u); } catch {} }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/"); return; }
      setEmailVerificado(u.emailVerified);
      setIsGoogleUser((u.providerData || []).some(p => p.providerId === "google.com"));
      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (!snap.exists() || !snap.data().onboarding_completo) {
          router.replace("/onboarding"); return;
        }
        const d = snap.data();
        setNome(d.nome || u.displayName?.split(" ")[0] || "Estudante");
        setJornada(d.jornada || "concurso");
        setNivel(d.nivel_padrao || "Intermediario");
        setBanca(d.banca_padrao || "Livre");

        // Busca sessões recentes (últimas 6 de qualquer modo)
        const [livres, guiados, simulados] = await Promise.all([
          getDocs(query(collection(db, "relatorios"),           where("user_id", "==", u.uid))),
          getDocs(query(collection(db, "relatorios_guiados"),   where("user_id", "==", u.uid))),
          getDocs(query(collection(db, "relatorios_simulados"), where("user_id", "==", u.uid))),
        ]);
        const todas: SessaoRecente[] = [
          ...livres.docs.map(x => ({ id: x.id, materia: x.data().materia || "", tema: x.data().tema || "", modo: "livre" as ModoSessao, url: `/dashboard/relatorio/${x.id}`, ts: new Date(x.data().timestamp || 0).getTime() })),
          ...guiados.docs.map(x => ({ id: x.id, materia: x.data().materia || "", tema: x.data().tema || "", modo: "guiado" as ModoSessao, url: `/dashboard/relatorio-guiado/${x.id}`, ts: new Date(x.data().timestamp || 0).getTime() })),
          ...simulados.docs.map(x => ({ id: x.id, materia: x.data().materia || "", tema: x.data().tema || "", modo: "simulado" as ModoSessao, url: `/dashboard/relatorio-simulado/${x.id}`, ts: new Date(x.data().timestamp || 0).getTime() })),
        ];
        todas.sort((a, b) => b.ts - a.ts);
        setRecentes(todas.slice(0, 18));

        // Verifica pending_topic do sessionStorage (vindo da landing page)
        const pending = typeof window !== "undefined" ? sessionStorage.getItem("pending_topic") : null;
        if (pending) {
          sessionStorage.removeItem("pending_topic");
          setTexto(pending);
          setFlow("extraindo");
          extrairAssunto(pending, d.jornada || "concurso");
          return;
        }
        setFlow("chat");
      } catch {
        setFlow("chat");
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verifica histórico do tema ao entrar no fluxo "modo"
  useEffect(() => {
    if (flow !== "modo") { setTemHistorico(false); setHistorico([]); setPersonalizada(false); return; }
    const user = auth.currentUser;
    if (!user || !materia || !tema) return;

    const matching = recentes.filter(r =>
      r.materia.toLowerCase() === materia.toLowerCase() &&
      r.tema.toLowerCase() === tema.toLowerCase()
    );

    if (matching.length === 0) { setTemHistorico(false); setHistorico([]); return; }

    setCarregandoHistorico(true);
    Promise.all(
      matching.slice(0, 3).map(async (s) => {
        const col = s.modo === "guiado" ? "relatorios_guiados"
          : s.modo === "simulado" ? "relatorios_simulados"
          : "relatorios";
        try {
          const snap = await getDoc(doc(db, col, s.id));
          return snap.exists() ? snap.data() : null;
        } catch { return null; }
      })
    ).then(docs => {
      const pontos: string[] = [];
      docs.filter(Boolean).forEach(d => {
        (d!.erros_cometidos || []).forEach((e: any) => {
          const txt = typeof e === "string" ? e : (e.conceito || e.topico || e.titulo || "");
          if (txt) pontos.push(txt);
        });
        (d!.temas_nao_abordados || []).forEach((t: any) => {
          const txt = typeof t === "string" ? t : (t.tema || t.conceito || t.topico || "");
          if (txt) pontos.push(txt);
        });
      });
      setHistorico([...new Set(pontos)].slice(0, 10));
      setTemHistorico(true);
    }).catch(() => {
      setTemHistorico(true);
    }).finally(() => {
      setCarregandoHistorico(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, materia, tema]);

  const extrairAssunto = async (t: string, j: string) => {
    setFlow("extraindo");
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/extrair-assunto`, {
        method: "POST",
        body: JSON.stringify({ texto: t, jornada: j }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMateria(data.materia || "");
      setTema(data.tema || "");
      setFlow("confirmando");
    } catch {
      // Fallback: pede para o usuário preencher manualmente
      setEditando(true);
      setFlow("confirmando");
    }
  };

  const handleEnviar = () => {
    if (!texto.trim()) return;
    extrairAssunto(texto.trim(), jornada);
  };

  const iniciarSessao = () => {
    const base: Record<string, string> = { jornada, materia, tema, banca, faixa_salarial: nivel };
    if (personalizada) {
      base.personalizado = "1";
      if (historico.length > 0) base.prioridades = historico.join("|");
    }
    router.push(`${MODO_URLS[modo]}?${new URLSearchParams(base)}`);
  };

  const jornadaObj = useMemo(() => JORNADAS_ESTUDO.find(j => j.nome.toLowerCase() === jornada), [jornada]);
  const materiaObj = useMemo(() => jornadaObj?.materias.find(m => m.nome === materia), [jornadaObj, materia]);

  const temasEstudados = useMemo(() => {
    const map = new Map<string, { materia: string; tema: string; sessoes: SessaoRecente[] }>();
    recentes.forEach(r => {
      const key = `${r.materia.toLowerCase()}||${r.tema.toLowerCase()}`;
      const g = map.get(key);
      if (g) g.sessoes.push(r);
      else map.set(key, { materia: r.materia, tema: r.tema, sessoes: [r] });
    });
    return Array.from(map.values());
  }, [recentes]);


  // ─── AUTH LOADING ──────────────────────────────────────────────────────────
  if (flow === "auth") return (
    <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col transition-colors duration-300 ${flow === "chat" ? "bg-[#0A0F1E]" : "bg-[#F8FAFC]"}`}>
      <AppHeader variant="default" />

      {!emailVerificado && !isGoogleUser && (
        <div className="mx-4 md:mx-6 mt-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 shrink-0">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <p className="text-[11px] font-bold text-amber-700 flex-1">Verifique seu e-mail para ativar todos os recursos.</p>
          <button onClick={reenviarVerificacao}
            className="text-[10px] font-black text-amber-600 hover:text-amber-800 whitespace-nowrap transition-colors">
            Reenviar →
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">

          {/* ─── CHAT: dark hero + white card ────────────────────────────── */}
          {flow === "chat" && (
            <motion.div key="chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="flex-1 min-h-0 flex flex-col overflow-hidden">

              {/* Dark hero section — compact */}
              <div className="shrink-0 flex flex-col justify-end px-5 pb-6 pt-10 max-w-2xl mx-auto w-full">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Olá, {nome.split(" ")[0]}.
                </h1>
                <p className="text-sm font-bold text-slate-500 mt-1">O que vamos estudar hoje?</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { label: jornada === "concurso" ? "Concurso Público" : jornada === "oab" ? "OAB" : "ENEM" },
                    { label: nivel },
                    ...(banca && banca !== "Livre" ? [{ label: banca }] : []),
                  ].map(({ label }) => (
                    <span key={label} className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                      {label}
                    </span>
                  ))}
                  <button onClick={() => router.push("/perfil")}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 transition-colors flex items-center gap-1">
                    <Pencil size={10} /> Editar perfil
                  </button>
                </div>
              </div>

              {/* White card — fills remaining space */}
              <div className="bg-white rounded-t-[2rem] shadow-[0_-8px_40px_rgba(0,0,0,0.4)] flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-5 pt-6 pb-8 space-y-4">

                  {/* Chat input */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:border-blue-500 transition-colors">
                    <textarea
                      ref={inputRef}
                      value={texto}
                      onChange={e => setTexto(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                      placeholder="Sobre o que você quer estudar? (ex: princípios constitucionais, frações, concordância verbal...)"
                      rows={3}
                      className="w-full resize-none p-5 outline-none font-medium text-slate-800 placeholder-slate-400 text-sm leading-relaxed bg-transparent"
                    />
                    <div className="flex items-center justify-between px-4 pb-3 gap-3">
                      <p className="text-[10px] font-bold text-slate-400">Enter para enviar · Shift+Enter para nova linha</p>
                      <button onClick={handleEnviar} disabled={!texto.trim()}
                        className="flex items-center gap-2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:hover:bg-black shrink-0">
                        Continuar <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Topic evolution cards */}
                  {temasEstudados.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <BookOpen size={11} /> Meus Temas
                      </p>
                      {temasEstudados.slice(0, 6).map(({ materia: m, tema: t, sessoes }) => {
                        const count = sessoes.length;
                        const progW = count >= 5 ? "w-full" : count === 4 ? "w-4/5" : count === 3 ? "w-3/5" : count === 2 ? "w-2/5" : "w-1/5";
                        const progC = count >= 4 ? "bg-emerald-500" : count >= 3 ? "bg-lime-400" : count >= 2 ? "bg-yellow-400" : "bg-slate-300";
                        const desc = count === 1
                          ? "Primeira sessão feita. Repita o tema para identificar suas lacunas e acompanhar a evolução."
                          : count === 2
                          ? "2 sessões concluídas. Você está construindo consistência neste tema."
                          : count === 3
                          ? "3 sessões. Progresso sólido! Continue praticando para consolidar."
                          : `${count} sessões. Domínio crescente. Continue assim!`;
                        return (
                          <div key={`${m}||${t}`} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition-colors">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{m}</p>
                              <p className="text-sm font-black text-slate-800 mt-0.5 leading-tight">{t}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progC} ${progW} transition-all`} />
                              </div>
                              <span className="text-[9px] font-black text-slate-400 shrink-0">
                                {count} {count === 1 ? "sessão" : "sessões"}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 leading-snug">{desc}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setMateria(m); setTema(t); setFlow("modo"); }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                                <Play size={10} /> Nova Sessão
                              </button>
                              <button
                                onClick={() => router.push("/dashboard/historico")}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                                <FileText size={10} /> Histórico
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}

          {/* ─── EXTRAINDO ───────────────────────────────────────────────── */}
          {flow === "extraindo" && (
            <motion.div key="extraindo"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-100">
                <Loader2 size={28} className="text-blue-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-black text-black text-lg mb-1">Identificando o assunto...</p>
                <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed">"{texto}"</p>
              </div>
            </motion.div>
          )}

          {/* ─── CONFIRMANDO ─────────────────────────────────────────────── */}
          {flow === "confirmando" && (
            <motion.div key="confirmando"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto px-4 pt-8 pb-10 max-w-2xl mx-auto w-full">
              <div className="space-y-6">

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Assunto identificado</p>
                <h2 className="text-xl font-black text-black">É isso que você quer estudar?</h2>
              </div>

              {!editando ? (
                <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Matéria</p>
                    <p className="text-xl font-black text-black">{materia || "—"}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tema</p>
                    <p className="text-lg font-black text-slate-700">{tema || "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Matéria</label>
                    <select value={materia} onChange={e => { setMateria(e.target.value); setTema(""); }}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                      <option value="">Selecione a matéria</option>
                      {jornadaObj?.materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                    </select>
                  </div>
                  {materia && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tema</label>
                      <select value={tema} onChange={e => setTema(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                        <option value="">Selecione o tema</option>
                        {materiaObj?.temas.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setEditando(false); setFlow("chat"); }}
                  className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-2 border-slate-200 rounded-xl hover:border-black hover:text-black transition-all">
                  Voltar
                </button>
                <button onClick={() => setEditando(v => !v)}
                  className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 border-2 border-slate-200 rounded-xl hover:border-slate-400 transition-all">
                  <Pencil size={11} /> {editando ? "Usar sugestão da IA" : "Editar manualmente"}
                </button>
                <button
                  onClick={() => { setEditando(false); setFlow("modo"); }}
                  disabled={!materia || !tema}
                  className="ml-auto flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-black text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-30 disabled:hover:bg-black">
                  Confirmar <Check size={13} />
                </button>
              </div>

              </div>
            </motion.div>
          )}

          {/* ─── MODO ────────────────────────────────────────────────────── */}
          {flow === "modo" && (
            <motion.div key="modo"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto px-4 pt-8 pb-10 max-w-2xl mx-auto w-full">
              <div className="space-y-6">

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{materia}</span>
                  <ChevronRight size={10} className="text-slate-300" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">{tema}</span>
                </div>
                <h2 className="text-xl font-black text-black">Como quer estudar?</h2>
                {carregandoHistorico && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400">Verificando histórico...</p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {MODOS.map(m => {
                  const Icon  = m.icon;
                  const ativo = modo === m.value;
                  return (
                    <motion.button key={m.value} onClick={() => setModo(m.value)}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        ativo
                          ? `${m.border} ${m.bg} ring-4 ring-offset-2 ring-slate-200`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.bg} ${m.color}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-base ${ativo ? m.color : "text-slate-800"}`}>{m.label}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 leading-snug">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${ativo ? "bg-black border-black" : "border-slate-300"}`}>
                        {ativo && <Check size={10} className="text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Sessão Personalizada — toggle sempre visível */}
              <div className={`rounded-2xl border-2 p-4 transition-all ${
                personalizada ? "border-orange-300 bg-orange-50" : "border-dashed border-slate-200 bg-white"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <BookOpen size={13} className={personalizada ? "text-orange-600" : "text-slate-400"} />
                      <p className={`font-black text-sm ${personalizada ? "text-orange-700" : "text-slate-600"}`}>
                        Sessão Personalizada
                      </p>
                    </div>
                    <p className="text-[11px] font-medium leading-snug text-slate-400 pl-[18px]">
                      {carregandoHistorico
                        ? "Verificando histórico..."
                        : !temHistorico
                        ? "Faça sua primeira explicação para habilitar a sessão personalizada."
                        : "Ajusta o roteiro com foco nas suas dificuldades anteriores neste tema."}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    disabled={!temHistorico || carregandoHistorico}
                    onClick={() => setPersonalizada(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                      personalizada ? "bg-orange-500" : "bg-slate-200"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                      personalizada ? "translate-x-[22px]" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                {/* Atenção Especial */}
                {personalizada && historico.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 pt-3 border-t border-orange-200 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5">
                      <Zap size={11} /> Atenção Especial
                    </p>
                    <ul className="space-y-1">
                      {historico.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight size={12} className="text-orange-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] font-bold text-orange-800 leading-snug">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setFlow("confirmando")}
                  className="flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-2 border-slate-200 rounded-xl hover:border-black hover:text-black transition-all">
                  Voltar
                </button>
                <button onClick={iniciarSessao}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors">
                  Iniciar Sessão <ArrowRight size={14} />
                </button>
              </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
    </div>
  );
}
