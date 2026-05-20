"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, ChevronDown, FileText,
  Calendar, Play, BookOpen, Brain, TrendingUp, Zap,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppHeader } from "@/components/AppHeader";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModoSessao = "livre" | "guiado" | "simulado";

type SessaoHistorico = {
  id: string;
  materia: string;
  tema: string;
  timestamp: string;
  modo: ModoSessao;
  url: string;
  data: Record<string, any>;
};

type MateriaGroup = {
  materia: string;
  sessoes: SessaoHistorico[];
  scoreMedia: number | null;
  ultimaData: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractScore(data: Record<string, any>): number | null {
  if (!data) return null;
  if (typeof data.score_cognitivo === "number") return data.score_cognitivo;
  if (typeof data.resumo_geral?.score_cognitivo === "number") return data.resumo_geral.score_cognitivo;
  if (typeof data.resultado?.score_cognitivo === "number") return data.resultado.score_cognitivo;
  return null;
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function scoreStyle(score: number | null) {
  if (score === null)
    return { text: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200", bar: "bg-slate-200", ring: "ring-slate-200", label: "Sem dados" };
  if (score >= 8)
    return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", bar: "bg-emerald-500", ring: "ring-emerald-300", label: "Dominando" };
  if (score >= 6)
    return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", bar: "bg-amber-400", ring: "ring-amber-300", label: "Em progresso" };
  return { text: "text-red-700", bg: "bg-red-50", border: "border-red-300", bar: "bg-red-400", ring: "ring-red-300", label: "Precisa reforço" };
}

const MODO_CONFIG: Record<ModoSessao, { label: string; color: string; dot: string }> = {
  livre:    { label: "Livre",    color: "text-blue-600 bg-blue-50 border-blue-200",    dot: "bg-blue-500"   },
  guiado:   { label: "Guiado",   color: "text-purple-600 bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  simulado: { label: "Simulado", color: "text-amber-600 bg-amber-50 border-amber-200",  dot: "bg-amber-500"  },
};

// ── Score Ring (SVG) ──────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number | null }) {
  const st = scoreStyle(score);
  const pct = score !== null ? (score / 10) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={score === null ? "#cbd5e1" : score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#f87171"}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black leading-none ${st.text}`}>
          {score !== null ? score : "—"}
        </span>
        <span className="text-[9px] font-bold text-slate-400">/10</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessoes, setSessoes] = useState<SessaoHistorico[]>([]);
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/"); return; }
      setUser(currentUser);

      try {
        const userSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
        if (!userSnap.exists()) { router.replace("/onboarding"); return; }
        const userData = userSnap.data();
        if (!userData.onboarding_completo) { router.replace("/onboarding"); return; }

        const [livresSnap, guiadosSnap, simuladosSnap] = await Promise.all([
          getDocs(query(collection(db, "relatorios"),          where("user_id", "==", currentUser.uid))),
          getDocs(query(collection(db, "relatorios_guiados"),  where("user_id", "==", currentUser.uid))),
          getDocs(query(collection(db, "relatorios_simulados"),where("user_id", "==", currentUser.uid))),
        ]);

        const toSessao = (
          docs: typeof livresSnap.docs,
          modo: ModoSessao,
          baseUrl: string,
        ): SessaoHistorico[] => docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            materia: data.materia || "Sem matéria",
            tema: data.tema || "Sem tema",
            timestamp: data.timestamp || data.created_at || data.data || "",
            modo,
            url: `${baseUrl}/${d.id}`,
            data,
          };
        });

        const historico = [
          ...toSessao(livresSnap.docs,    "livre",    "/dashboard/relatorio"),
          ...toSessao(guiadosSnap.docs,   "guiado",   "/dashboard/relatorio-guiado"),
          ...toSessao(simuladosSnap.docs, "simulado", "/dashboard/relatorio-simulado"),
        ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

        setSessoes(historico);

        // Abre a primeira matéria automaticamente
        if (historico.length > 0) {
          setExpandedMaterias(new Set([historico[0].materia]));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Agrupa por matéria (mantém ordem cronológica decrescente)
  const materiaGroups = useMemo((): MateriaGroup[] => {
    const map = new Map<string, SessaoHistorico[]>();
    sessoes.forEach(s => {
      if (!map.has(s.materia)) map.set(s.materia, []);
      map.get(s.materia)!.push(s);
    });
    return Array.from(map.entries()).map(([materia, sess]) => {
      const scores = sess.map(s => extractScore(s.data)).filter((x): x is number => x !== null);
      const scoreMedia = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null;
      return { materia, sessoes: sess, scoreMedia, ultimaData: sess[0]?.timestamp || "" };
    });
  }, [sessoes]);

  const totalMaterias = materiaGroups.length;
  const totalSessoes  = sessoes.length;
  const allScores     = materiaGroups.map(m => m.scoreMedia).filter((x): x is number => x !== null);
  const scoreGeral    = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10
    : null;

  const toggleMateria = (materia: string) =>
    setExpandedMaterias(prev => {
      const n = new Set(prev);
      n.has(materia) ? n.delete(materia) : n.add(materia);
      return n;
    });

  const nome = user?.displayName?.split(" ")[0] || "Estudante";
  const stGeral = scoreStyle(scoreGeral);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (sessoes.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col">
        <AppHeader variant="default" />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-blue-100">
              <Mic size={36} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-black mb-2">Olá, {nome}.</h1>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              Explique um tema para a IA analisar seu raciocínio e gerar seu perfil cognitivo.
            </p>
            <button onClick={() => router.push("/dashboard/modos")}
              className="bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto">
              Começar agora <Mic size={14} />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] bg-[#F8FAFC] flex flex-col overflow-hidden">

      <AppHeader variant="default" />

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-col bg-white border-r-2 border-slate-100 overflow-y-auto shrink-0">

          {/* Greeting block */}
          <div className="p-6 pb-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Painel Cognitivo</p>
            <h1 className="text-2xl font-black text-black leading-tight">Olá, {nome}.</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {totalSessoes} {totalSessoes === 1 ? "sessão" : "sessões"} em {totalMaterias} {totalMaterias === 1 ? "matéria" : "matérias"}
            </p>
          </div>

          {/* Score ring card */}
          <div className="p-4">
            <div className={`rounded-2xl border-2 ${stGeral.border} ${stGeral.bg} p-5 flex items-center gap-4`}>
              <ScoreRing score={scoreGeral} />
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Score Cognitivo</p>
                <p className={`text-xs font-black uppercase tracking-wider ${stGeral.text}`}>{stGeral.label}</p>
                {/* Mini bars per matéria */}
                <div className="mt-2 space-y-1.5">
                  {materiaGroups.slice(0, 4).map(g => {
                    const st = scoreStyle(g.scoreMedia);
                    return (
                      <div key={g.materia} className="flex items-center gap-2">
                        <div className="w-14 h-1 bg-slate-200 rounded-full overflow-hidden shrink-0">
                          <div className={`h-full ${st.bar} rounded-full`}
                            style={{ width: g.scoreMedia !== null ? `${(g.scoreMedia / 10) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 truncate">{g.materia}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="px-4 grid grid-cols-3 gap-2">
            {[
              { icon: BookOpen,    value: totalMaterias, label: "Matérias" },
              { icon: Brain,       value: totalSessoes,  label: "Sessões"  },
              { icon: TrendingUp,  value: scoreGeral !== null ? `${scoreGeral}` : "—", label: "Score"   },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <Icon size={14} className="text-slate-400 mx-auto mb-1" />
                <p className="text-base font-black text-black leading-none">{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Legend de modos */}
          <div className="px-4 mt-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Modos de Estudo</p>
            <div className="space-y-1.5">
              {(Object.entries(MODO_CONFIG) as [ModoSessao, typeof MODO_CONFIG[ModoSessao]][]).map(([, cfg]) => (
                <div key={cfg.label} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-[10px] font-bold text-slate-500">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="p-4 mt-auto">
            <button
              onClick={() => router.push("/dashboard/modos")}
              className="w-full bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
              <Mic size={13} /> Nova Explicação
            </button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-4 pt-5 pb-3">
            <div>
              <h1 className="text-lg font-black text-black">Olá, {nome}.</h1>
              <p className="text-[10px] font-bold text-slate-400">{totalMaterias} matérias · {totalSessoes} sessões{scoreGeral !== null ? ` · Score ${scoreGeral}` : ""}</p>
            </div>
            <button onClick={() => router.push("/dashboard/modos")}
              className="bg-black text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-600 transition-colors">
              <Mic size={12} /> Nova
            </button>
          </div>

          {/* Section header */}
          <div className="px-4 md:px-6 lg:px-8 pt-4 lg:pt-6 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-600" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Suas Matérias
              </h2>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {totalMaterias} estudadas
            </span>
          </div>

          {/* Matéria cards */}
          <div className="px-3 md:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
              {materiaGroups.map((group, idx) => {
                const st        = scoreStyle(group.scoreMedia);
                const isExpanded = expandedMaterias.has(group.materia);

                return (
                  <motion.div
                    key={group.materia}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

                    {/* Card header — clicável */}
                    <button
                      onClick={() => toggleMateria(group.materia)}
                      className="w-full flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 text-left hover:bg-slate-50 transition-colors min-h-[60px]">

                      {/* Score badge */}
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border-2 ${st.border} ${st.bg}`}>
                        {group.scoreMedia !== null ? (
                          <>
                            <span className={`text-sm font-black leading-none ${st.text}`}>{group.scoreMedia}</span>
                            <span className={`text-[7px] font-bold opacity-60 ${st.text}`}>/10</span>
                          </>
                        ) : (
                          <BookOpen size={16} className="text-slate-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-black text-sm truncate">{group.materia}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-400">
                            {group.sessoes.length} {group.sessoes.length === 1 ? "sessão" : "sessões"}
                          </span>
                          {group.ultimaData && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                <Calendar size={9} />{formatDate(group.ultimaData)}
                              </span>
                            </>
                          )}
                          {group.scoreMedia !== null && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                              <span className={`text-[9px] font-black uppercase ${st.text}`}>{st.label}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score bar (desktop) */}
                      {group.scoreMedia !== null && (
                        <div className="hidden md:flex items-center gap-2 shrink-0 w-24">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${st.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${(group.scoreMedia / 10) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {/* Tema rows */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="temas"
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}>
                          <div className="border-t-2 border-slate-100">
                            {group.sessoes.map((sessao, i) => {
                              const s      = extractScore(sessao.data);
                              const ss     = scoreStyle(s);
                              const mCfg   = MODO_CONFIG[sessao.modo];
                              const isLast = i === group.sessoes.length - 1;

                              return (
                                <div key={sessao.id}
                                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 ${!isLast ? "border-b border-slate-100" : ""} hover:bg-slate-50/70 transition-colors`}>

                                  {/* Score mini badge */}
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border ${s !== null ? `${ss.bg} ${ss.border} ${ss.text}` : "bg-slate-100 border-slate-200 text-slate-300"}`}>
                                    {s !== null ? s : "—"}
                                  </div>

                                  {/* Tema info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{sessao.tema}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className={`text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${mCfg.color}`}>
                                        {mCfg.label}
                                      </span>
                                      {sessao.timestamp && (
                                        <span className="text-[9px] font-bold text-slate-400 hidden sm:inline">
                                          {formatDate(sessao.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => router.push(sessao.url)}
                                      className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 min-h-[36px] bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                                      <FileText size={10} /> Abrir
                                    </button>
                                    <button
                                      onClick={() => router.push("/dashboard/modos")}
                                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                      <Play size={10} /> Repetir
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
