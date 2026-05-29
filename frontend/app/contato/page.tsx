// frontend/app/contato/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { Footer } from "@/components/Footer";
import { apiFetch } from "@/lib/apiFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ASSUNTOS = ["Dúvida", "Feedback", "Problema técnico", "Sugestão", "Outro"];

function ContatoForm() {
  const searchParams = useSearchParams();
  const [nome, setNome]         = useState("");
  const [email, setEmail]       = useState("");
  const [assunto, setAssunto]   = useState("Dúvida");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [erro, setErro]         = useState("");

  // Pré-seleciona o assunto se vier por query (?assunto=Feedback)
  useEffect(() => {
    const a = searchParams.get("assunto");
    if (a && ASSUNTOS.includes(a)) setAssunto(a);
  }, [searchParams]);

  const valido =
    nome.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email.trim()) &&
    mensagem.trim().length >= 10;

  const enviar = async () => {
    if (!valido || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const res = await apiFetch(`${API_BASE}/api/contato`, {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), assunto, mensagem: mensagem.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.erro || "Não foi possível enviar.");
      }
      setEnviado(true);
    } catch (e: any) {
      setErro(e.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-10 text-center flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-black">Mensagem enviada!</h2>
        <p className="text-sm font-semibold text-slate-500 max-w-sm leading-relaxed">
          Recebemos seu contato e vamos responder no e-mail informado. Obrigado por nos ajudar a melhorar a plataforma.
        </p>
        <Link href="/" className="mt-2 bg-black text-white px-7 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors">
          Voltar ao início
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Seu nome</label>
          <input
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Como podemos te chamar?"
            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl px-4 py-3 outline-none text-sm font-medium text-slate-800 placeholder-slate-400 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Seu e-mail</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl px-4 py-3 outline-none text-sm font-medium text-slate-800 placeholder-slate-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assunto</label>
        <div className="flex flex-wrap gap-2">
          {ASSUNTOS.map(a => (
            <button key={a} type="button" onClick={() => setAssunto(a)}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border-2 transition-all ${
                assunto === a ? "bg-black text-white border-black" : "border-slate-200 text-slate-500 hover:border-black hover:text-black"
              }`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mensagem</label>
        <textarea
          value={mensagem} onChange={e => setMensagem(e.target.value)}
          placeholder="Conte com detalhes o que você precisa..."
          rows={6}
          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl px-4 py-3 outline-none text-sm font-medium text-slate-800 placeholder-slate-400 resize-none transition-colors leading-relaxed"
        />
        <p className="text-[10px] font-bold text-slate-400 mt-1.5">Mínimo de 10 caracteres.</p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-700">{erro}</div>
      )}

      <button
        onClick={enviar} disabled={!valido || enviando}
        className="w-full bg-black text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:hover:bg-black"
      >
        {enviando
          ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Send size={14} /> Enviar mensagem</>}
      </button>
    </div>
  );
}

export default function ContatoPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 antialiased flex flex-col"
      style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

      {/* NAVBAR */}
      <nav className="w-full px-6 py-3.5 flex items-center justify-between bg-white border-b-2 border-black z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={13} /> Voltar
          </button>
          <span className="text-slate-200">|</span>
          <span className="font-black text-lg leading-none tracking-tighter select-none">
            <span className="text-black">95</span><span className="text-blue-500">%</span>
          </span>
        </div>
        <Link href="/ajuda"
          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
          Central de Ajuda
        </Link>
      </nav>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-6 py-12 flex flex-col gap-8">

        {/* HERO */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            <Mail size={11} /> Contato
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black leading-tight">
            Fale com a <span className="text-blue-600">gente</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 max-w-lg mx-auto leading-relaxed">
            Dúvidas, sugestões ou encontrou um problema? Envie sua mensagem — respondemos no seu e-mail.
          </p>
        </div>

        <Suspense fallback={<div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <ContatoForm />
        </Suspense>

        {/* Atalho ajuda */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <MessageSquare size={13} />
          Talvez sua dúvida já esteja respondida na{" "}
          <Link href="/ajuda" className="text-blue-600 font-black hover:underline">Central de Ajuda</Link>.
        </div>

      </main>

      <Footer />
    </div>
  );
}
