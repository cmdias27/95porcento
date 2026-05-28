// frontend/app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, Zap, DollarSign, RefreshCw,
  ArrowLeft, TrendingUp, BarChart2, BookOpen, Clock,
  Mic, Timer, RotateCcw, Repeat2, AlertOctagon, FileText,
  Search, Crown, Key, MessageSquare, CheckSquare, Download,
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

interface AdminUser {
  uid: string;
  nome: string;
  email: string;
  loginProvider: "email" | "google";
  emailVerified: boolean;
  accountStatus: "active" | "suspended";
  criadoEm: number;
  ultimoAcesso: number;
  premium: boolean;
  premiumExpiracao: string | null;
  role: string;
}

interface AdminFeedback {
  id: string;
  uid: string;
  nome: string;
  email: string;
  premium: boolean;
  respostas: Record<string, string>;
  faixa_preco: string | null;
  texto_livre: string | null;
  criadoEm: string;
  lido: boolean;
}

const PERGUNTAS_LABELS: Record<string, string> = {
  confuso:     "Ficou confuso?",
  inteligente: "Relatório inteligente?",
  descobriu:   "IA descobriu lacuna?",
  voltaria:    "Voltaria amanhã?",
  cansativo:   "Fluxo cansativo?",
  pagaria:     "Pagaria hoje?",
};

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

  // ── Abas ─────────────────────────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState<"stats" | "users" | "feedbacks">("stats");
  const [usuarios,           setUsuarios]           = useState<AdminUser[]>([]);
  const [buscaUsuario,       setBuscaUsuario]       = useState("");
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [erroUsuarios,       setErroUsuarios]       = useState("");
  const [acaoLoading,        setAcaoLoading]        = useState("");

  const [feedbacks,           setFeedbacks]           = useState<AdminFeedback[]>([]);
  const [carregandoFeedbacks, setCarregandoFeedbacks] = useState(false);
  const [erroFeedbacks,       setErroFeedbacks]       = useState("");

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

  const fetchUsuarios = useCallback(async () => {
    setCarregandoUsuarios(true);
    setErroUsuarios("");
    try {
      const res = await apiFetch(`${API}/api/admin/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsuarios(data.usuarios);
    } catch (e: any) {
      setErroUsuarios(`Erro: ${e.message}`);
    } finally {
      setCarregandoUsuarios(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users" && autorizado) fetchUsuarios();
  }, [activeTab, autorizado, fetchUsuarios]);

  const fetchFeedbacks = useCallback(async () => {
    setCarregandoFeedbacks(true);
    setErroFeedbacks("");
    try {
      const res = await apiFetch(`${API}/api/admin/feedbacks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFeedbacks(data.feedbacks);
    } catch (e: any) {
      setErroFeedbacks(`Erro: ${e.message}`);
    } finally {
      setCarregandoFeedbacks(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "feedbacks" && autorizado) fetchFeedbacks();
  }, [activeTab, autorizado, fetchFeedbacks]);

  const marcarLido = async (id: string) => {
    try {
      await apiFetch(`${API}/api/admin/feedbacks/${id}/lido`, { method: "POST" });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, lido: true } : f));
    } catch {}
  };

  const atualizarPremium = async (userUid: string, action: string, params: Record<string, unknown>) => {
    setAcaoLoading(userUid);
    try {
      const res = await apiFetch(`${API}/api/admin/users/${userUid}/premium`, {
        method: "POST",
        body: JSON.stringify({ action, ...params }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchUsuarios();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setAcaoLoading("");
    }
  };

  const suspenderUsuario = async (userUid: string, disabled: boolean) => {
    setAcaoLoading(userUid);
    try {
      const res = await apiFetch(`${API}/api/admin/users/${userUid}/suspend`, {
        method: "POST",
        body: JSON.stringify({ disabled }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchUsuarios();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setAcaoLoading("");
    }
  };

  const revogarSessoes = async (userUid: string) => {
    setAcaoLoading(userUid);
    try {
      const res = await apiFetch(`${API}/api/admin/users/${userUid}/revoke-sessions`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("Sessões revogadas. O usuário precisará fazer login novamente.");
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setAcaoLoading("");
    }
  };

  const resetarSenha = async (userUid: string) => {
    setAcaoLoading(userUid);
    try {
      const res = await apiFetch(`${API}/api/admin/users/${userUid}/reset-password`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.link) {
        prompt("Link de redefinição (copie e envie ao usuário):", data.link);
      } else {
        alert("E-mail de redefinição enviado.");
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setAcaoLoading("");
    }
  };

  const usuariosFiltrados = useMemo(() => {
    if (!buscaUsuario.trim()) return usuarios;
    const q = buscaUsuario.toLowerCase();
    return usuarios.filter(u =>
      u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usuarios, buscaUsuario]);

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
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(["stats", "users", "feedbacks"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black"
              }`}>
              {tab === "stats" ? "Dashboard" : tab === "users" ? "Usuários" : "Feedbacks"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {activeTab === "stats" && ultimaAtual && (
            <span className="text-[9px] font-bold text-slate-400 hidden md:block">
              Atualizado às {ultimaAtual}
            </span>
          )}
          <button
            onClick={activeTab === "stats" ? fetchStats : activeTab === "users" ? fetchUsuarios : fetchFeedbacks}
            disabled={activeTab === "stats" ? carregando : activeTab === "users" ? carregandoUsuarios : carregandoFeedbacks}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest
              text-slate-500 hover:text-black border-2 border-slate-200 hover:border-black
              px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
            <RefreshCw size={11} className={(carregando || carregandoUsuarios || carregandoFeedbacks) ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </nav>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ── ABA: USUÁRIOS ── */}
        {activeTab === "users" && (
          <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-100">
              <Users size={15} className="text-blue-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Gestão de Usuários</h2>
              <span className="ml-auto text-[9px] font-bold text-slate-400">{usuarios.length} usuários</span>
            </div>

            <div className="relative mb-4">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={buscaUsuario} onChange={e => setBuscaUsuario(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl py-2.5 pl-9 pr-4 outline-none text-xs font-bold text-slate-700 placeholder-slate-400 transition-colors" />
            </div>

            {erroUsuarios && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700 mb-4">{erroUsuarios}</div>
            )}

            {carregandoUsuarios ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[960px]">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      {["Usuário", "Login", "Email ✓", "Status", "Premium", "Criado Em", "Último Acesso", "Ações"].map(h => (
                        <th key={h} className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-left pb-3 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                      <tr key={u.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        {/* Nome + Email */}
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                              {(u.nome || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 truncate max-w-[110px]">{u.nome || "—"}</p>
                              <p className="text-[9px] font-bold text-slate-400 truncate max-w-[110px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Login */}
                        <td className="py-3 pr-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            u.loginProvider === "google" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600"
                          }`}>
                            {u.loginProvider === "google" ? "Google" : "E-mail"}
                          </span>
                        </td>
                        {/* Email verificado */}
                        <td className="py-3 pr-3">
                          <span className={`text-[10px] font-black ${u.emailVerified ? "text-emerald-600" : "text-red-500"}`}>
                            {u.emailVerified ? "✓" : "✗"}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="py-3 pr-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            u.accountStatus === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {u.accountStatus === "active" ? "Ativo" : "Suspenso"}
                          </span>
                        </td>
                        {/* Premium */}
                        <td className="py-3 pr-3">
                          <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              u.premium ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500"
                            }`}>
                              {u.premium ? "Premium" : "Free"}
                            </span>
                            {u.premium && u.premiumExpiracao && (
                              <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                                até {new Date(u.premiumExpiracao).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </td>
                        {/* Criado Em */}
                        <td className="py-3 pr-3 font-bold text-slate-500 text-[10px] whitespace-nowrap">
                          {u.criadoEm ? new Date(u.criadoEm).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        {/* Último Acesso */}
                        <td className="py-3 pr-3 font-bold text-slate-500 text-[10px] whitespace-nowrap">
                          {u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        {/* Ações */}
                        <td className="py-3">
                          {acaoLoading === u.uid ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => atualizarPremium(u.uid, "toggle", { premium: !u.premium })}
                                className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${
                                  u.premium ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                }`}>
                                <Crown size={9} className="inline mr-0.5" />
                                {u.premium ? "→ Free" : "→ Premium"}
                              </button>
                              {u.premium && [7, 30, 90].map(d => (
                                <button key={d} onClick={() => atualizarPremium(u.uid, "extend", { days: d })}
                                  className="text-[8px] font-black text-blue-600 px-1.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all">
                                  +{d}d
                                </button>
                              ))}
                              <button onClick={() => suspenderUsuario(u.uid, u.accountStatus === "active")}
                                className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${
                                  u.accountStatus === "active" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}>
                                {u.accountStatus === "active" ? "Suspender" : "Ativar"}
                              </button>
                              <button onClick={() => revogarSessoes(u.uid)}
                                className="text-[8px] font-black uppercase text-slate-500 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all">
                                Logout
                              </button>
                              {u.loginProvider === "email" && (
                                <button onClick={() => resetarSenha(u.uid)}
                                  className="text-[8px] font-black uppercase text-purple-600 px-2 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 transition-all">
                                  <Key size={9} className="inline mr-0.5" />
                                  Reset
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuariosFiltrados.length === 0 && !carregandoUsuarios && (
                  <p className="text-xs font-bold text-slate-400 text-center py-8">Nenhum usuário encontrado.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ABA: DASHBOARD (stats) ── */}
        {activeTab === "stats" && erro && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-sm font-bold text-red-700">
            {erro}
          </div>
        )}

        {activeTab === "stats" && !s && !erro && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {activeTab === "stats" && s && (
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
        {/* ── ABA: FEEDBACKS ── */}
        {activeTab === "feedbacks" && (
          <div className="bg-white border-2 border-black rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-100">
              <MessageSquare size={15} className="text-violet-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-violet-600">Feedbacks dos Usuários</h2>
              <span className="ml-auto text-[9px] font-bold text-slate-400">{feedbacks.length} respostas</span>
              <button
                disabled
                title="Em breve"
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 border-2 border-slate-100 px-3 py-1.5 rounded-lg cursor-not-allowed">
                <Download size={11} /> Exportar
              </button>
            </div>

            {erroFeedbacks && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700 mb-4">
                {erroFeedbacks}
              </div>
            )}

            {carregandoFeedbacks ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : feedbacks.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-12">
                Nenhum feedback enviado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map(fb => (
                  <div key={fb.id}
                    className={`border-2 rounded-2xl p-5 transition-colors ${
                      fb.lido ? "border-slate-100 bg-slate-50/50" : "border-violet-200 bg-violet-50/30"
                    }`}>

                    {/* Header do feedback */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                          {fb.nome ? fb.nome[0].toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{fb.nome || "—"}</p>
                          <p className="text-[10px] font-bold text-slate-400">{fb.email || fb.uid}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {fb.premium
                          ? <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Premium</span>
                          : <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Free</span>
                        }
                        <span className="text-[9px] font-bold text-slate-400">
                          {fb.criadoEm ? new Date(fb.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </span>
                        {!fb.lido && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Respostas Sim/Não */}
                    {Object.keys(fb.respostas).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(fb.respostas).map(([id, val]) => (
                          <div key={id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">
                              {PERGUNTAS_LABELS[id] || id}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              val === "Sim" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Faixa de preço */}
                    {fb.faixa_preco && (
                      <p className="text-[10px] font-bold text-slate-600 mb-2">
                        <span className="text-slate-400">Pagaria:</span> {fb.faixa_preco}
                      </p>
                    )}

                    {/* Texto livre */}
                    {fb.texto_livre && (
                      <p className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 mb-3 leading-relaxed">
                        "{fb.texto_livre}"
                      </p>
                    )}

                    {/* Ações */}
                    {!fb.lido && (
                      <button
                        onClick={() => marcarLido(fb.id)}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-black border-2 border-slate-200 hover:border-black px-3 py-1.5 rounded-lg transition-all">
                        <CheckSquare size={11} /> Marcar como lido
                      </button>
                    )}
                    {fb.lido && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                        <CheckSquare size={11} className="text-emerald-400" /> Lido
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
