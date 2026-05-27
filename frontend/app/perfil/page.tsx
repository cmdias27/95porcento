// frontend/app/perfil/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Lock, Zap, Crown,
  AlertTriangle, ChevronRight,
  Check, X, Edit2, BookOpen,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  updateProfile, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPerfilUsuario, verificarRenovacaoSemanal,
  formatarDataRenovacao, LIMITE_SESSOES_GRATUITAS,
  type PerfilUsuario,
} from "@/lib/premium";
import { AppHeader } from "@/components/AppHeader";

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------
type Tela = "perfil" | "senha";


// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function PerfilPage() {
  const router = useRouter();

  // Auth
  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  // Perfil premium
  const [perfil, setPerfil]       = useState<PerfilUsuario | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  // Edição de nome
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome]         = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [erroNome, setErroNome]         = useState("");

  // Troca de senha
  const [tela, setTela]                 = useState<Tela>("perfil");
  const [senhaAtual, setSenhaAtual]     = useState("");
  const [novaSenha, setNovaSenha]       = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha]       = useState("");
  const [okSenha, setOkSenha]           = useState(false);

  // Modal premium placeholder
  const [modalPremium, setModalPremium] = useState(false);

  // Configurações de estudo
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // ---------------------------------------------------------------------------
  // Auth listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/"); return; }
      setUser(u);
      setNovoNome(u.displayName || "");
      setLoading(false);
      // Carregar perfil premium
      try {
        const p = await verificarRenovacaoSemanal(u.uid);
        setPerfil(p);
      } catch {
        // fallback seguro
        setPerfil({
          premium: false, premium_expiracao: null, plano: "free",
          sessoes_semanais_usadas: 0,
          ultima_renovacao_sessoes: new Date().toISOString(),
          jornada: "concurso", nivel_padrao: "Intermediario",
          onboarding_completo: true, preferencia_input: "texto",
        });
      } finally {
        setCarregandoPerfil(false);
      }
    });
    return () => unsub();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Ações
  // ---------------------------------------------------------------------------
  const salvarConfigEstudo = async (campo: "jornada" | "nivel_padrao", valor: string) => {
    if (!user) return;
    setSalvandoConfig(true);
    try {
      await setDoc(doc(db, "usuarios", user.uid), { [campo]: valor }, { merge: true });
      setPerfil(prev => prev ? { ...prev, [campo]: valor } : prev);
    } catch {
      // falha silenciosa — valor local já está atualizado via setPerfil
    } finally {
      setSalvandoConfig(false);
    }
  };

  const salvarNome = async () => {
    if (!novoNome.trim() || !user) return;
    setSalvandoNome(true);
    setErroNome("");
    try {
      await updateProfile(user, { displayName: novoNome.trim() });
      setEditandoNome(false);
    } catch {
      setErroNome("Não foi possível salvar o nome.");
    } finally {
      setSalvandoNome(false);
    }
  };

  const salvarSenha = async () => {
    setErroSenha("");
    if (!novaSenha || novaSenha !== confirmSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setErroSenha("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (!user?.email) {
      setErroSenha("Usuário sem e-mail associado.");
      return;
    }
    setSalvandoSenha(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, novaSenha);
      setOkSenha(true);
      setSenhaAtual(""); setNovaSenha(""); setConfirmSenha("");
    } catch (e: any) {
      if (e.code === "auth/wrong-password") {
        setErroSenha("Senha atual incorreta.");
      } else {
        setErroSenha("Erro ao atualizar a senha. Tente novamente.");
      }
    } finally {
      setSalvandoSenha(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Guards
  // ---------------------------------------------------------------------------
  if (loading) return (
    <div className="h-[100dvh] bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === "google.com") ?? false;

  const sessoesRestantes = perfil
    ? Math.max(0, LIMITE_SESSOES_GRATUITAS - perfil.sessoes_semanais_usadas)
    : LIMITE_SESSOES_GRATUITAS;

  const isPremium = perfil?.premium ?? false;

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans flex flex-col antialiased">

      {/* MODAL PREMIUM PLACEHOLDER */}
      <AnimatePresence>
        {modalPremium && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setModalPremium(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white border-2 border-black rounded-3xl p-8 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <button onClick={() => setModalPremium(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-black transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
                  <Crown size={20} className="text-amber-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight">Premium</h2>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed mb-6">
                O Sistema Premium será liberado em breve. Você será notificado quando estiver disponível.
              </p>
              <button onClick={() => setModalPremium(false)}
                className="w-full bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AppHeader variant="default" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 md:px-6 py-4 md:py-8 flex flex-col gap-6 md:gap-8">

        {/* ── SEÇÃO 1: DADOS DA CONTA ── */}
        <AnimatePresence mode="wait">
          {tela === "perfil" ? (
            <motion.section key="perfil-tela"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="bg-white border-2 border-black rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-slate-100">
                <User size={16} className="text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Dados da Conta</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="avatar"
                      className="w-16 h-16 rounded-2xl border-2 border-black object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border-2 border-black bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl font-black text-slate-400">
                        {(user?.displayName || user?.email || "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  {/* Nome */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nome</p>
                    {editandoNome ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && salvarNome()}
                          className="flex-1 border-2 border-black rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-600"
                          autoFocus
                        />
                        <button onClick={salvarNome} disabled={salvandoNome}
                          className="p-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-40">
                          <Check size={14} />
                        </button>
                        <button onClick={() => { setEditandoNome(false); setNovoNome(user?.displayName || ""); }}
                          className="p-2 text-slate-400 hover:text-black border-2 border-slate-200 rounded-lg transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black text-black">{user?.displayName || "—"}</p>
                        <button onClick={() => setEditandoNome(true)}
                          className="text-slate-300 hover:text-blue-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                    {erroNome && <p className="text-xs text-red-500 font-bold mt-1">{erroNome}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                      <Mail size={10} /> E-mail
                    </p>
                    <p className="text-sm font-bold text-slate-600">{user?.email || "—"}</p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {isGoogleUser ? (
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 py-1">
                        <svg width="11" height="11" viewBox="0 0 48 48" className="shrink-0">
                          <path fill="#4285F4" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                          <path fill="#34A853" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.5 16.3 44 24 44z"/>
                          <path fill="#FBBC05" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                          <path fill="#EA4335" d="M24 4C16.3 4 9.7 8.4 6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4z"/>
                        </svg>
                        Esta conta utiliza login Google.
                      </p>
                    ) : (
                      <button onClick={() => setTela("senha")}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-black border-2 border-slate-200 hover:border-black px-3 py-2 rounded-lg transition-all">
                        <Lock size={11} /> Alterar Senha
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            /* ── TELA DE ALTERAÇÃO DE SENHA ── */
            <motion.section key="senha-tela"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="bg-white border-2 border-black rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100">
                <button onClick={() => { setTela("perfil"); setErroSenha(""); setOkSenha(false); }}
                  className="text-slate-400 hover:text-black transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <Lock size={16} className="text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Alterar Senha</h2>
              </div>

              {isGoogleUser ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">
                    Esta conta utiliza login Google. Para alterar sua senha, acesse as configurações da sua conta Google.
                  </p>
                </div>
              ) : okSenha ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <Check size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-sm font-bold text-emerald-800">Senha atualizada com sucesso!</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm">
                  {[
                    { label: "Senha Atual",     val: senhaAtual,  set: setSenhaAtual  },
                    { label: "Nova Senha",       val: novaSenha,   set: setNovaSenha   },
                    { label: "Confirmar Senha",  val: confirmSenha,set: setConfirmSenha},
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                      <input type="password" value={val} onChange={(e) => set(e.target.value)}
                        className="w-full border-2 border-slate-200 focus:border-black rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors" />
                    </div>
                  ))}
                  {erroSenha && (
                    <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                      <AlertTriangle size={11} /> {erroSenha}
                    </p>
                  )}
                  <button onClick={salvarSenha} disabled={salvandoSenha}
                    className="w-full bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-40 mt-2">
                    {salvandoSenha ? "Salvando..." : "Salvar Nova Senha"}
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── SEÇÃO 2: CONFIGURAÇÕES DE ESTUDO ── */}
        <section className="bg-white border-2 border-black rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-slate-100">
            <BookOpen size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Configurações de Estudo</h2>
            {salvandoConfig && (
              <div className="ml-auto w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Jornada */}
          <div className="mb-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Jornada de Estudo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: "concurso", label: "Concurso", desc: "Público Federal / Estadual / Municipal" },
                { value: "oab",      label: "OAB",      desc: "Exame da Ordem dos Advogados" },
                { value: "enem",     label: "ENEM",     desc: "Exame Nacional do Ensino Médio" },
              ].map(j => {
                const ativo = (perfil?.jornada ?? "concurso") === j.value;
                return (
                  <button
                    key={j.value}
                    onClick={() => salvarConfigEstudo("jornada", j.value)}
                    className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                      ativo
                        ? "border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(37,99,235,0.5)]"
                        : "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <span className={`text-xs font-black uppercase tracking-widest mb-1 ${ativo ? "text-blue-300" : "text-slate-400"}`}>
                      {j.label}
                    </span>
                    <span className={`text-[10px] font-bold leading-tight ${ativo ? "text-slate-300" : "text-slate-500"}`}>
                      {j.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nível padrão */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Nível de Dificuldade Padrão</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "Inicial",       label: "Inicial",       desc: "Conceitos diretos e literais" },
                { value: "Intermediario", label: "Intermediário",  desc: "Aplicação e casos práticos" },
                { value: "Avancado",      label: "Avançado",       desc: "Jurisprudência e pegadinhas" },
                { value: "Elite",         label: "Elite",          desc: "Máxima dificuldade" },
              ].map(n => {
                const ativo = (perfil?.nivel_padrao ?? "Intermediario") === n.value;
                return (
                  <button
                    key={n.value}
                    onClick={() => salvarConfigEstudo("nivel_padrao", n.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      ativo
                        ? "border-blue-600 bg-blue-50 shadow-[2px_2px_0px_0px_rgba(37,99,235,0.3)]"
                        : "border-slate-200 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${ativo ? "text-blue-700" : "text-slate-700"}`}>
                      {n.label}
                    </span>
                    <span className={`text-[9px] font-bold leading-tight ${ativo ? "text-blue-500" : "text-slate-400"}`}>
                      {n.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 3: STATUS DA CONTA ── */}
        <section className="bg-white border-2 border-black rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-2">
              <Crown size={16} className={isPremium ? "text-amber-500" : "text-slate-400"} />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Status da Conta</h2>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
              isPremium
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              {isPremium ? "Premium" : "Gratuito"}
            </span>
          </div>

          {carregandoPerfil ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Sessões usadas */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Sessões Usadas</p>
                <p className="text-3xl font-black text-black">
                  {isPremium ? "∞" : perfil?.sessoes_semanais_usadas ?? 0}
                  {!isPremium && (
                    <span className="text-base font-bold text-slate-400">
                      /{LIMITE_SESSOES_GRATUITAS}
                    </span>
                  )}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Esta semana</p>
              </div>

              {/* Sessões restantes */}
              <div className={`border rounded-2xl p-4 ${
                isPremium ? "bg-emerald-50 border-emerald-200" :
                sessoesRestantes === 0 ? "bg-red-50 border-red-200" :
                sessoesRestantes <= 2  ? "bg-amber-50 border-amber-200" :
                "bg-emerald-50 border-emerald-200"
              }`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Restantes</p>
                <p className={`text-3xl font-black ${
                  isPremium ? "text-emerald-600" :
                  sessoesRestantes === 0 ? "text-red-600" :
                  sessoesRestantes <= 2 ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {isPremium ? "∞" : sessoesRestantes}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  {isPremium ? "Ilimitado" : "Sessões livres"}
                </p>
              </div>

              {/* Renovação */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  {isPremium ? "Plano Expira" : "Renovação"}
                </p>
                <p className="text-sm font-black text-black leading-tight">
                  {isPremium && perfil?.premium_expiracao
                    ? new Date(perfil.premium_expiracao).toLocaleDateString("pt-BR")
                    : perfil
                      ? formatarDataRenovacao(perfil.ultima_renovacao_sessoes)
                      : "—"
                  }
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  {isPremium ? "Data de expiração" : "Reset semanal"}
                </p>
              </div>
            </div>
          )}

          {/* Barra de progresso de sessões (gratuito) */}
          {!isPremium && perfil && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Uso Semanal</p>
                <p className="text-[9px] font-black text-slate-500">
                  {perfil.sessoes_semanais_usadas}/{LIMITE_SESSOES_GRATUITAS}
                </p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    sessoesRestantes === 0 ? "bg-red-500" :
                    sessoesRestantes <= 2  ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${(perfil.sessoes_semanais_usadas / LIMITE_SESSOES_GRATUITAS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Botão Premium */}
          {!isPremium && (
            <button onClick={() => setModalPremium(true)}
              className="w-full bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-[3px_3px_0px_0px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(37,99,235,0.45)] active:translate-y-0 active:shadow-none">
              <Zap size={14} /> Desbloquear Premium
              <ChevronRight size={14} />
            </button>
          )}
        </section>


      </main>

      <footer className="w-full py-4 text-center shrink-0 border-t border-slate-200">
        <p className="text-[8px] font-black uppercase text-slate-300 tracking-[0.4em]">
          95porcento AI Protocol • 2026
        </p>
      </footer>
    </div>
  );
}
