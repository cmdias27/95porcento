// frontend/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Lock, LogIn, ArrowLeft, User, Eye, EyeOff, FileText, Cookie, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/Logo";
import { TermosModal } from "@/components/TermosModal";

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

// ─── Roteamento pós-auth ─────────────────────
async function rotearAposAuth(uid: string, router: ReturnType<typeof useRouter>) {
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists() && snap.data().onboarding_completo) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  } catch {
    router.push("/onboarding");
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

  // Consentimentos
  const [aceitouTermos,    setAceitouTermos]    = useState(false);
  const [aceitouCookies,   setAceitouCookies]   = useState(false);
  const [aceitouMarketing, setAceitouMarketing] = useState(false);
  const [modalAberto,      setModalAberto]      = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState("");

  const limpar = () => {
    setErro("");
    setEmail(""); setSenha(""); setNome(""); setConfirmarSenha("");
    setAceitouTermos(false); setAceitouCookies(false); setAceitouMarketing(false);
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
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      await rotearAposAuth(cred.user.uid, router);
    } catch (err: any) {
      setErro(erroFirebase(err.code));
    } finally {
      setCarregando(false);
    }
  };

  // ── Cadastro ──
  const cadastrar = async () => {
    setErro("");
    if (!nome.trim())             { setErro("Informe seu nome."); return; }
    if (!email)                   { setErro("Informe seu e-mail."); return; }
    if (senha.length < 6)         { setErro("A senha deve ter ao menos 6 caracteres."); return; }
    if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
    if (!aceitouTermos)           { setErro("Você deve ler e aceitar os Termos de Uso e Privacidade."); return; }
    if (!aceitouCookies)          { setErro("Você deve aceitar o uso de cookies para continuar."); return; }
    setCarregando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(cred.user, { displayName: nome.trim() });
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome: nome.trim(),
        email: cred.user.email,
        uid: cred.user.uid,
        criadoEm: serverTimestamp(),
        premium: true,
        consentimentos: {
          termos: true,
          cookies: true,
          marketing: aceitouMarketing,
          dataConsentimento: serverTimestamp(),
          versaoTermos: "1.0",
        },
      });
      await rotearAposAuth(cred.user.uid, router);
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
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "usuarios", result.user.uid), {
        nome: result.user.displayName || "",
        email: result.user.email || "",
        uid: result.user.uid,
        ultimoAcesso: serverTimestamp(),
        premium: true,
      }, { merge: true });
      await rotearAposAuth(result.user.uid, router);
    } catch (err: any) {
      setErro(erroFirebase(err.code));
    } finally {
      setCarregando(false);
    }
  };

  // Pirâmide de Glasser — topo (90%) → base (10%)
  const piramideLayers = [
    { label: "ENSINAR",    sub: "Explicar para outros", pct: "90%", fill: "#059669", top: true  },
    { label: "DISCUTIR",   sub: "Grupos de estudo",     pct: "70%", fill: "#0d9488", top: false },
    { label: "VER E OUVIR",sub: "Audiovisual",          pct: "50%", fill: "#0369a1", top: false },
    { label: "VER",        sub: "Demonstrações",         pct: "30%", fill: "#1d4ed8", top: false },
    { label: "OUVIR",      sub: "Palestras/Áudios",     pct: "20%", fill: "#1e40af", top: false },
    { label: "LER",        sub: "Livros/Artigos",        pct: "10%", fill: "#1e3a5f", top: false },
  ];
  // Geometria: viewBox 500×360, pirâmide centrada em x=250
  // Camada 0 (topo): meia-largura=40 → largura=80px
  // Cada camada cresce +25px de cada lado → camada 5 (base): meia=165 → largura=330px
  const CX_PYR = 250, LH = 60, MIN_HALF = 40, SLOPE = 25;

  return (
    <>
    <div className="min-h-[100dvh] font-sans flex">

      {/* ── Painel esquerdo: pirâmide SVG ── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden px-10 py-10 gap-7">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />

        <div className="relative z-10 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-emerald-400 mb-3">Pirâmide de Glasser</p>
          <h2 className="text-3xl font-black text-white leading-tight">
            Quem ensina retém<br />
            <span className="text-emerald-400">90% do conteúdo.</span>
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            O 95porcento coloca a IA como seu aluno.<br />
            Você explica. A IA audita. Você aprende de verdade.
          </p>
        </div>

        {/* SVG Pyramid — viewBox 500×360, pirâmide centrada em x=250
            Coluna esquerda (0–55): % labels
            Pirâmide (55–445): trapézios
            Margem direita (445–500): espaço
        */}
        <div className="relative z-10 w-full max-w-md">
          <svg viewBox="0 0 500 360" className="w-full drop-shadow-2xl">
            <defs>
              <filter id="topGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {piramideLayers.map((layer, i) => {
              const yT = i * LH, yB = yT + LH, cy = yT + LH / 2;
              const halfT = MIN_HALF + i * SLOPE;
              const halfB = MIN_HALF + (i + 1) * SLOPE;
              const xLT = CX_PYR - halfT, xRT = CX_PYR + halfT;
              const xLB = CX_PYR - halfB, xRB = CX_PYR + halfB;
              const points = `${xLT},${yT} ${xRT},${yT} ${xRB},${yB} ${xLB},${yB}`;
              // ponto médio da borda esquerda (para conectar o traço)
              const xEdge = (xLT + xLB) / 2;

              return (
                <g key={i}>
                  {/* Camada */}
                  <polygon points={points} fill={layer.fill} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  {/* Destaque extra no topo */}
                  {layer.top && (
                    <polygon points={points} fill="rgba(52,211,153,0.18)" filter="url(#topGlow)" />
                  )}

                  {/* Traço pontilhado: % → borda esquerda */}
                  <line
                    x1="50" y1={cy}
                    x2={xEdge - 3} y2={cy}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                  />

                  {/* % — coluna esquerda, fora do trapézio */}
                  <text
                    x="48" y={cy + 5}
                    textAnchor="end"
                    fontSize="12" fontWeight="900"
                    fill={layer.top ? "#34d399" : "rgba(255,255,255,0.45)"}
                    fontFamily="system-ui, sans-serif"
                  >
                    {layer.pct}
                  </text>

                  {/* Nome do método — centralizado no trapézio */}
                  <text
                    x={CX_PYR} y={cy - 5}
                    textAnchor="middle"
                    fontSize="12" fontWeight="900"
                    fill="white"
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.8"
                    filter={layer.top ? "url(#topGlow)" : undefined}
                  >
                    {layer.label}
                  </text>

                  {/* Descrição curta */}
                  <text
                    x={CX_PYR} y={cy + 11}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.4)"
                    fontFamily="system-ui, sans-serif"
                  >
                    {layer.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="relative z-10 text-[10px] text-slate-500 font-medium">
          Teoria: William Glasser • Psicologia Cognitiva
        </p>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative bg-[#F8FAFC] min-h-[100dvh] lg:min-h-0"
        style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

        {/* Voltar */}
        <button onClick={() => router.push("/")}
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors min-h-[40px]">
          <ArrowLeft size={13} /> Voltar
        </button>

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="w-24 h-24 md:w-40 md:h-40 relative">
              <LogoMark size={160} className="!w-full !h-full" />
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

            <div className="p-5 md:p-8">

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

                    {/* ── Consentimentos ── */}
                    <div className="space-y-2.5 border-t-2 border-slate-100 pt-4">

                      {/* Termos obrigatório */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => aceitouTermos ? setAceitouTermos(false) : setModalAberto(true)}
                          className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${aceitouTermos ? "bg-black border-black" : "border-slate-300 hover:border-black"}`}
                        >
                          {aceitouTermos && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                        </button>
                        <span className="text-[11px] font-medium text-slate-600 leading-tight">
                          Li e aceito os{" "}
                          <button
                            type="button"
                            onClick={() => setModalAberto(true)}
                            className="text-blue-600 font-black underline underline-offset-2 hover:text-blue-800"
                          >
                            Termos de Uso, Política de Privacidade e Cookies
                          </button>
                          {" "}<span className="text-red-500 font-black">*</span>
                        </span>
                      </div>

                      {/* Cookies obrigatório */}
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => setAceitouCookies(v => !v)}
                      >
                        <div className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${aceitouCookies ? "bg-black border-black" : "border-slate-300 hover:border-black"}`}>
                          {aceitouCookies && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 leading-tight select-none">
                          Aceito o uso de cookies essenciais e analíticos para melhorar minha experiência{" "}
                          <span className="text-red-500 font-black">*</span>
                        </span>
                      </div>

                      {/* Marketing opcional */}
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => setAceitouMarketing(v => !v)}
                      >
                        <div className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${aceitouMarketing ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"}`}>
                          {aceitouMarketing && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 leading-tight select-none">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">(Opcional)</span>{" "}
                          Autorizo o uso do meu nome em campanhas publicitárias e materiais de marketing do 95porcento
                        </span>
                      </div>

                      <p className="text-[9px] text-slate-400 font-medium">
                        <span className="text-red-500 font-black">*</span> Campos obrigatórios para criar a conta
                      </p>
                    </div>

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

        </div>
      </div>
    </div>

    {/* Modal de Termos */}
    <AnimatePresence>
      {modalAberto && (
        <TermosModal
          onClose={() => setModalAberto(false)}
          onAccept={() => {
            setAceitouTermos(true);
            setAceitouCookies(true);
            setModalAberto(false);
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
}
