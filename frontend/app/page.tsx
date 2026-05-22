"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogoAnimated } from "@/components/Logo";
import { ArrowUp, Sparkles } from "lucide-react";

const SUGESTOES = [
  "Princípios constitucionais",
  "Administração Pública",
  "Direito Penal — Tipicidade",
  "Língua Portuguesa — Coesão",
  "Redação ENEM",
  "Direito Civil — Contratos",
];

export default function LandingPage() {
  const router  = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
      else       setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = () => {
    if (texto.trim()) sessionStorage.setItem("pending_topic", texto.trim());
    router.push("/login");
  };

  const handleSugestao = (s: string) => {
    setTexto(s);
    textRef.current?.focus();
  };

  if (!authChecked) {
    return (
      <div className="h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 md:px-8 h-14 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LogoAnimated size={32} />
          <span className="text-sm font-black text-black tracking-tight hidden sm:inline">95porcento</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/login")}
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-black px-4 py-2 rounded-xl transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-[11px] font-black uppercase tracking-widest bg-black text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors"
          >
            Criar conta
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">

        {/* Headline */}
        <div className="text-center space-y-3 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-[1.1]">
            O que você quer<br />
            <span className="text-blue-600">estudar hoje?</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-medium">
            Explique o tema como um professor. A IA analisa seu raciocínio e aponta lacunas.
          </p>
        </div>

        {/* Input card */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-white border-2 border-slate-200 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] focus-within:border-blue-500 focus-within:shadow-[0_2px_24px_rgba(37,99,235,0.12)] transition-all duration-200">

            <textarea
              ref={textRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ex: quero estudar os princípios da administração pública..."
              rows={4}
              className="w-full resize-none px-5 pt-5 pb-3 outline-none font-medium text-slate-800 placeholder-slate-300 text-base leading-relaxed bg-transparent"
            />

            <div className="flex items-center justify-between px-4 pb-3.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden sm:block">
                Enter para enviar
              </span>
              <button
                onClick={handleSubmit}
                disabled={!texto.trim()}
                className="ml-auto w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Sugestões */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => handleSugestao(s)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 bg-white px-3.5 py-2 rounded-full hover:border-slate-400 hover:text-black hover:bg-slate-50 transition-all"
            >
              <Sparkles size={10} className="text-blue-400 shrink-0" />
              {s}
            </button>
          ))}
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="py-5 text-center border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          95porcento · Estudo ativo com inteligência artificial
        </p>
      </footer>

    </div>
  );
}
