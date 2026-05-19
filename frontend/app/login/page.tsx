// frontend/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import Image from "next/image";
import { Mail, Lock, LogIn, ArrowLeft, User, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/Logo";

// ─── Input com ícone ────────────────────────
function Campo({
  label, type, value, onChange, placeholder, icon: Icon, extra,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  extra?: React.ReactNode;
}) {
  const [visivel, setVisivel] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-0.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type={isPassword && visivel ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-2xl py-3.5 pl-11 pr-10 outline-none font-bold text-sm text-slate-800 placeholder-slate-400 transition-colors"
        />
        {isPassword && (
          <button type="button" onClick={() => setVisivel(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors">
            {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {extra}
    </div>
  );
}

// ─── Mensagem de erro do Firebase ───────────
function erroFirebase(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/weak-password":
      return "A senha deve ter ao menos 6 caracteres.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos.";
    case "auth/popup-closed-by-user":
      return "Login com Google cancelado.";
    default:
      return "Ocorreu um erro. Tente novamente.";
  }
}

// ─── Página ─────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");

  // Campos compartilhados
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");

  // Campos de cadastro
  const [nome, setNome]                 = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState("");

  const limpar = () => {
    setErro("");
    setEmail(""); setSenha(""); setNome(""); setConfirmarSenha("");
  };

  const trocarModo = (novo: "entrar" | "cadastrar") => {
    limpar();
    setModo(novo);
  };

  // ── Login com e-mail ──
  const entrar = async () => {
    setErro("");
    if (!email || !senha) { setErro("Preencha todos os campos."); return; }
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/dashboard/modos");
    } catch (err: any) {
      setErro(erroFirebase(err.code));
    } finally {
      setCarregando(false);
    }
  };

  // ── Cadastro ──
  const cadastrar = async () => {
    setErro("");
    if (!nome.trim())       { setErro("Informe seu nome."); return; }
    if (!email)             { setErro("Informe seu e-mail."); return; }
    if (senha.length < 6)   { setErro("A senha deve ter ao menos 6 caracteres."); return; }
    if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
    setCarregando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(cred.user, { displayName: nome.trim() });
      router.push("/dashboard/modos");
    } catch (err: any) {
      setErro(erroFirebase(err.code));
    } finally {
      setCarregando(false);
    }
  };

  // ── Google ──
  const entrarGoogle = async () => {
    setErro("");
    setCarregando(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard/modos");
    } catch (err: any) {
      setErro(erroFirebase(err.code));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-[100dvh] font-sans flex">

      {/* ── Painel esquerdo: pirâmide (só desktop) ── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-xl">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Aprenda com<br />
              <span className="text-blue-400">90% de retenção</span>
            </h2>
            <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
              Baseado na Pirâmide do Aprendizado de Glasser,<br />
              o 95porcento usa IA para que você aprenda ensinando.
            </p>
          </div>

          <Image
            src="/piramide_login.png"
            alt="Pirâmide do Aprendizado"
            width={560}
            height={305}
            className="w-full rounded-2xl shadow-2xl"
            priority
          />

          <div className="flex gap-8 text-center">
            <div>
              <div className="text-2xl font-black text-white">90%</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">retenção ao ensinar</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div>
              <div className="text-2xl font-black text-white">5×</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">mais eficiente</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div>
              <div className="text-2xl font-black text-white">IA</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">como seu aluno</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-[#F8FAFC]"
        style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

        {/* Voltar */}
        <button onClick={() => router.push("/")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
          <ArrowLeft size={13} /> Voltar
        </button>

        <div className="w-full max-w-md">

          {/* Logo + título */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <LogoMark size={80} />
            <div className="text-center">
              <span className="text-xl font-black tracking-tight text-slate-900">
                <span className="text-blue-600">95</span>porcento
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-0.5">
                Protocolo de Aprendizagem
              </p>
            </div>
          </div>

          {/* Card principal */}
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b-2 border-black">
              {(["entrar", "cadastrar"] as const).map(m => (
                <button key={m} onClick={() => trocarModo(m)}
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-colors ${
                    modo === m ? "bg-black text-white" : "text-slate-400 hover:text-black"
                  }`}>
                  {m === "entrar" ? "Entrar" : "Criar Conta"}
                </button>
              ))}
            </div>

            <div className="p-8">

              {/* Erro */}
              <AnimatePresence>
                {erro && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold mb-5 text-center">
                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulário */}
              <AnimatePresence mode="wait">
                {modo === "entrar" ? (
                  <motion.form key="entrar"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}
                    onSubmit={e => { e.preventDefault(); entrar(); }} className="space-y-4">

                    <Campo label="E-mail" type="email" value={email}
                      onChange={setEmail} placeholder="seu@email.com" icon={Mail} />

                    <Campo label="Senha" type="password" value={senha}
                      onChange={setSenha} placeholder="••••••••" icon={Lock} />

                    <button type="submit" disabled={carregando}
                      className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 mt-2 shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]">
                      {carregando
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><LogIn size={14} /> Entrar</>}
                    </button>
                  </motion.form>

                ) : (
                  <motion.form key="cadastrar"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                    onSubmit={e => { e.preventDefault(); cadastrar(); }} className="space-y-4">

                    <Campo label="Nome completo" type="text" value={nome}
                      onChange={setNome} placeholder="Seu nome" icon={User} />

                    <Campo label="E-mail" type="email" value={email}
                      onChange={setEmail} placeholder="seu@email.com" icon={Mail} />

                    <Campo label="Senha" type="password" value={senha}
                      onChange={setSenha} placeholder="Mínimo 6 caracteres" icon={Lock} />

                    <Campo label="Confirmar senha" type="password" value={confirmarSenha}
                      onChange={setConfirmarSenha} placeholder="Repita a senha" icon={Lock} />

                    <button type="submit" disabled={carregando}
                      className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 mt-2 shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]">
                      {carregando
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : "Criar minha conta"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Divisor */}
              <div className="relative flex items-center py-6">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ou</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Google */}
              <button onClick={entrarGoogle} disabled={carregando}
                className="w-full bg-white border-2 border-slate-200 hover:border-black py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.5 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C37.1 39 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                </svg>
                Continuar com Google
              </button>

            </div>
          </div>

          <p className="text-center text-[9px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
            95porcento AI Protocol • 2026
          </p>
        </div>
      </div>
    </div>
  );
}
