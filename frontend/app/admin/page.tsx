// frontend/app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, Zap, DollarSign, RefreshCw,
  ArrowLeft, TrendingUp, BarChart2, BookOpen, Clock,
  Mic, Timer, RotateCcw, Repeat2, AlertOctagon, FileText,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { apiFetch } from "@/lib/apiFetch";

// ── Tipos ───────────────────────────────────────────────────────────────────
interface AdminStats {
  usuarios: {
    total: number; hoje: number; ultimos_7_dias: number; ultimos_30_dias: number;
    premium: number; free: number; por_jornada: Record<string, number>;
  };
  sessoes: {
    total: number; hoje: number; ultimos_7_dias: number; ultimos_30_dias: number;
    por_modo: Record<string, number>; por_jornada: Record<string, number>;
    top_materias: { materia: string; count: number }[];
    top_temas: { tema: string; count: number }[];
  };
  simulador: { total: number; hoje: number; ultimos_7_dias: number };
  tokens: {
    total_input: number; total_output: number;
    custo_total_usd: number; custo_hoje_usd: number;
  };
  atividade_recente: {
    tipo: string; jornada: string; materia: string;
    tema: string; modo: string; timestamp: string;
  }[];
  engajamento: {
    taxa_abandono_pct: number;
    duracao_media_segundos: number;
    taxa_audio_pct: number;
    taxa_retorno_dia_seguinte_pct: number;
    taxa_segunda_sessao_pct: number;
    tempo_medio_primeira_exp_s: number;
    abandono_por_etapa: Record<string, number>;
    top_relatorios: { tema: string; count: number }[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function fmtNum(n: number) { return n.toLocaleString("pt-BR"); }
function fmtUSD(n: number) { return `$${n.toFixed(4)}`; }
function fmtTS(ts: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const MODO_LABEL: Record<string, string> = {
  livre: "Livre", guiado: "Guiado", simulado: "Simulado", simulador: "Simulador",
};
const JORNADA_LABEL: Record<string, string> = {
  concurso: "Concurso", oab: "OAB", enem: "ENEM",
};
const TIPO_LABEL: Record<string, { label: string; cor: string }> = {
  sessao_explicacao: { label: "Auditório", cor: "bg-blue-100 text-blue-700" },
  simulado_gerado:   { label: "Simulador", cor: "bg-red-100 text-red-700" },
};

// ── Mini bar chart ────────────────────────────────────────────────────────────
function BarRow({ label, value, max, cor }: { label: string; value: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-700 w-8 text-right">{fmtNum(value)}</span>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, cor,
}: { icon: any; label: string; value: string; sub?: string; cor: string }) {
  return (
    <div className={`bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cor}`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-2xl font-black text-black leading-none">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [uid, setUid]           = useState<string | null>(null);
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ultimaAtual, setUltimaAtual] = useState<string>("");
  const [erro, setErro]         = useState("");

  // ── Auth + verificação de role ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/"); return; }
      setUid(u.uid);
      const ADMIN_EMAILS = ["cassio.mattos@gmail.com"];
      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        const isAdmin = (snap.exists() && snap.data().role === "admin")
          || ADMIN_EMAILS.includes(u.email ?? "");
        if (isAdmin) {
          setAutorizado(true);
        } else {
          setAutorizado(false);
          router.replace("/dashboard");
        }
      } catch {
        if (ADMIN_EMAILS.includes(u.email ?? "")) {
          setAutorizado(true);
        } else {
          setAutorizado(false);
          router.replace("/dashboard");
        }
      }
    });
    return () => unsub();
  }, [router]);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!uid) return;
    setCarregando(true);
    setErro("");
    try {
      const res = await apiFetch(`${API}/api/admin/stats`);
      if (res.status === 403) {
        const frontendUid = auth.currentUser?.uid ?? "desconhecido";
        setErro(`Acesso negado (403). UID do usuário: ${frontendUid}`);
        return;
      }
      if (!res.ok) {
        let detalhe = "";
        try { const j = await res.json(); detalhe = j.erro || j.error || ""; } catch {}
        throw new Error(`HTTP ${res.status}${detalhe ? ": " + detalhe : ""}`);
      }
      const data = await res.json();
      setStats(data);
      setUltimaAtual(new Date().toLocaleTimeString("pt-BR"));
    } catch (e: any) {
      const isNetwork = e instanceof TypeError && e.message.includes("fetch");
      setErro(
        isNetwork
          ? `Erro de rede: o backend não está acessível em ${API}. Verifique se está rodando.`
          : `Erro ao carregar estatísticas: ${e.message}`
      );
    } finally {
      setCarregando(false);
    }
  }, [uid]);

  useEffect(() => {
    if (autorizado && uid) fetchStats();
  }, [autorizado, uid, fetchStats]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (autorizado === null) return (
    <div className="h-[100dvh] bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const s = stats;

  // Dados auxiliares para barras
  const maxModo     = s ? Math.max(...Object.values(s.sessoes.por_modo), 1) : 1;
  const maxJornada  = s ? Math.max(...Object.values(s.sessoes.por_jornada), 1) : 1;
  const maxJUser    = s ? Math.max(...Object.values(s.usuarios.por_jornada), 1) : 1;
  const maxMateria  = s ? (s.sessoes.top_materias[0]?.count || 1) : 1;
  const maxEtapa    = s ? Math.max(...Object.values(s.engajamento?.abandono_por_etapa ?? {}), 1) : 1;
  const maxRelat    = s ? (s.engajamento?.top_relatorios[0]?.count || 1) : 1;

  function fmtDur(s: number) {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 antialiased">

      {/* NAVBAR */}
      <nav className="w-full px-6 py-3.5 flex items-center justify-between bg-white border-b-2 border-black sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={13} /> Dashboard
          </button>
          <span className="text-slate-200 text-xs">|</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
            <BarChart2 size={12} className="text-blue-600" /> Painel Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          {ultimaAtual && (
            <span className="text-[9px] font-bold text-slate-400 hidden md:block">
              Atualizado às {ultimaAtual}
            </span>
          )}
          <button onClick={fetchStats} disabled={carregando}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest
              text-slate-500 hover:text-black border-2 border-slate-200 hover:border-black
              px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
            <RefreshCw size={11} className={carregando ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </nav>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8">

        {erro && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-sm font-bold text-red-700">
            {erro}
          </div>
        )}

        {!s && !erro && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {s && (
          <>
            {/* ── KPIs PRINCIPAIS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={Users}     label="Total Usuários"       value={fmtNum(s.usuarios.total)}   sub={`${s.usuarios.premium} premium · ${s.usuarios.free} free`}  cor="bg-blue-600" />
              <KpiCard icon={Activity}  label="Sessões de Auditório" value={fmtNum(s.sessoes.total)}    sub={`${s.sessoes.hoje} hoje · ${s.sessoes.ultimos_7_dias} esta semana`} cor="bg-slate-800" />
              <KpiCard icon={Zap}       label="Simulados Gerados"    value={fmtNum(s.simulador.total)}  sub={`${s.simulador.hoje} hoje · ${s.simulador.ultimos_7_dias} esta semana`} cor="bg-red-500" />
              <KpiCard icon={DollarSign} label="Custo Estimado Total" value={fmtUSD(s.tokens.custo_total_usd)} sub={`${fmtUSD(s.tokens.custo_hoje_usd)} hoje (aprox.)`} cor="bg-emerald-600" />
            </div>

            {/* ── LINHA 2: Usuários + Sessões ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Bloco Usuários */}
              <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                  <Users size={15} className="text-blue-600" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Usuários</h2>
                </div>

                {/* Período */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Hoje",    val: s.usuarios.hoje },
                    { label: "7 dias",  val: s.usuarios.ultimos_7_dias },
                    { label: "30 dias", val: s.usuarios.ultimos_30_dias },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                      <p className="text-2xl font-black text-black">{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Por Jornada */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Por Jornada</p>
                  <div className="space-y-2">
                    {Object.entries(s.usuarios.por_jornada).map(([j, c]) => (
                      <BarRow key={j} label={JORNADA_LABEL[j] || j} value={c} max={maxJUser} cor="bg-blue-500" />
                    ))}
                  </div>
                </div>

                {/* Premium */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Conversão Free → Premium</p>
                    <p className="text-[9px] font-black text-slate-600">
                      {s.usuarios.total > 0 ? Math.round(s.usuarios.premium / s.usuarios.total * 100) : 0}%
                    </p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${s.usuarios.total > 0 ? (s.usuarios.premium / s.usuarios.total * 100) : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Bloco Sessões */}
              <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                  <Activity size={15} className="text-slate-700" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Sessões de Auditório</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Hoje",    val: s.sessoes.hoje },
                    { label: "7 dias",  val: s.sessoes.ultimos_7_dias },
                    { label: "30 dias", val: s.sessoes.ultimos_30_dias },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                      <p className="text-2xl font-black text-black">{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Por Modo */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Por Modo</p>
                  <div className="space-y-2">
                    {Object.entries(s.sessoes.por_modo).map(([m, c]) => (
                      <BarRow key={m} label={MODO_LABEL[m] || m} value={c} max={maxModo} cor="bg-slate-700" />
                    ))}
                  </div>
                </div>

                {/* Por Jornada */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3">Por Jornada</p>
                  <div className="space-y-2">
                    {Object.entries(s.sessoes.por_jornada).map(([j, c]) => (
                      <BarRow key={j} label={JORNADA_LABEL[j] || j} value={c} max={maxJornada} cor="bg-blue-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── LINHA 3: Top Matérias + Tokens + Simulador ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top Matérias */}
              <div className="lg:col-span-1 bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                  <BookOpen size={15} className="text-emerald-600" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600">Top Matérias</h2>
                </div>
                {s.sessoes.top_materias.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">Sem dados ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {s.sessoes.top_materias.slice(0, 8).map(({ materia, count }) => (
                      <BarRow key={materia} label={materia} value={count} max={maxMateria} cor="bg-emerald-500" />
                    ))}
                  </div>
                )}
              </div>

              {/* Simulador + Tokens */}
              <div className="lg:col-span-2 space-y-6">

                {/* Simulador */}
                <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100 mb-4">
                    <Zap size={15} className="text-red-500" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-red-500">Simulador de Questões</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Total Gerado",  val: s.simulador.total },
                      { label: "Hoje",           val: s.simulador.hoje },
                      { label: "7 dias",         val: s.simulador.ultimos_7_dias },
                    ].map(item => (
                      <div key={item.label} className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-1">{item.label}</p>
                        <p className="text-2xl font-black text-red-700">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tokens e Custo */}
                <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100 mb-4">
                    <DollarSign size={15} className="text-emerald-600" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600">
                      Tokens & Custo Estimado
                    </h2>
                    <span className="ml-auto text-[8px] font-bold text-slate-400">gpt-4o-mini · aprox.</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Input Tokens",  val: fmtNum(s.tokens.total_input),  cor: "text-slate-700" },
                      { label: "Output Tokens", val: fmtNum(s.tokens.total_output), cor: "text-slate-700" },
                      { label: "Custo Total",   val: fmtUSD(s.tokens.custo_total_usd), cor: "text-emerald-700" },
                      { label: "Custo Hoje",    val: fmtUSD(s.tokens.custo_hoje_usd),  cor: "text-emerald-700" },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                        <p className={`text-base font-black ${item.cor}`}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── FEED DE ATIVIDADE RECENTE ── */}
            <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100 mb-5">
                <Clock size={15} className="text-slate-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-600">Atividade Recente</h2>
                <span className="ml-auto text-[8px] font-bold text-slate-400">últimas {s.atividade_recente.length} ações</span>
              </div>

              {s.atividade_recente.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-8">
                  Nenhuma atividade registrada ainda. As sessões futuras aparecerão aqui.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Tipo", "Jornada", "Matéria", "Tema", "Modo", "Data/Hora"].map(h => (
                          <th key={h} className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-left pb-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.atividade_recente.map((ev, i) => {
                        const tipo = TIPO_LABEL[ev.tipo] ?? { label: ev.tipo, cor: "bg-slate-100 text-slate-600" };
                        return (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tipo.cor}`}>
                                {tipo.label}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 font-bold text-slate-600">{JORNADA_LABEL[ev.jornada] || ev.jornada || "—"}</td>
                            <td className="py-2.5 pr-4 font-bold text-slate-700 max-w-[140px] truncate">{ev.materia || "—"}</td>
                            <td className="py-2.5 pr-4 font-bold text-slate-500 max-w-[160px] truncate">{ev.tema || "—"}</td>
                            <td className="py-2.5 pr-4">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {MODO_LABEL[ev.modo] || ev.modo || "—"}
                              </span>
                            </td>
                            <td className="py-2.5 font-bold text-slate-400 whitespace-nowrap">{fmtTS(ev.timestamp)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── ENGAJAMENTO & COMPORTAMENTO ── */}
            {s.engajamento && (
              <>
                {/* KPIs de engajamento */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={15} className="text-purple-600" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-600">Engajamento & Comportamento</h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard icon={AlertOctagon} label="Taxa de Abandono"         value={`${s.engajamento.taxa_abandono_pct}%`}              sub="dos que iniciam"                  cor="bg-orange-500" />
                    <KpiCard icon={Timer}        label="Duração Média"            value={fmtDur(s.engajamento.duracao_media_segundos)}       sub="por sessão concluída"             cor="bg-purple-600" />
                    <KpiCard icon={Mic}          label="Uso de Áudio"             value={`${s.engajamento.taxa_audio_pct}%`}                 sub="das sessões concluídas"           cor="bg-blue-600"   />
                    <KpiCard icon={RotateCcw}    label="Retorno Dia Seguinte"     value={`${s.engajamento.taxa_retorno_dia_seguinte_pct}%`}  sub="voltam no dia +1"                 cor="bg-emerald-600"/>
                    <KpiCard icon={Repeat2}      label="2ª Sessão"               value={`${s.engajamento.taxa_segunda_sessao_pct}%`}        sub="fazem ao menos 2"                 cor="bg-teal-600"   />
                    <KpiCard icon={Clock}        label="Tempo à 1ª Explicação"   value={fmtDur(s.engajamento.tempo_medio_primeira_exp_s)}   sub="média até 1º envio"               cor="bg-slate-700"  />
                  </div>
                </div>

                {/* Abandono por etapa + Top relatórios */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Abandono por etapa */}
                  <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                      <AlertOctagon size={15} className="text-orange-500" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-orange-500">Abandono por Etapa</h2>
                    </div>
                    {Object.keys(s.engajamento.abandono_por_etapa).length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">Sem dados ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(s.engajamento.abandono_por_etapa)
                          .sort((a, b) => b[1] - a[1])
                          .map(([etapa, count]) => (
                            <BarRow key={etapa} label={etapa} value={count} max={maxEtapa} cor="bg-orange-400" />
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Top relatórios acessados */}
                  <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                      <FileText size={15} className="text-indigo-600" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600">Relatórios Mais Acessados</h2>
                    </div>
                    {s.engajamento.top_relatorios.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">Sem dados ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {s.engajamento.top_relatorios.map(({ tema, count }) => (
                          <BarRow key={tema} label={tema} value={count} max={maxRelat} cor="bg-indigo-500" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
