// frontend/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErro("E-mail ou senha incorretos. Tente novamente.");
      } else {
        setErro("Ocorreu um erro ao tentar fazer login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 font-sans">
      {/* Lado Esquerdo - Motivacional */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px]"></div>
        
        <Link href="/" className="relative z-10 flex items-center gap-2 text-2xl font-bold text-white cursor-pointer w-fit">
          <BrainCircuit className="text-indigo-400" size={32} /> Auditor IA
        </Link>

        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Bem-vindo de volta ao <span className="text-indigo-400">topo</span>.
          </h1>
          <p className="text-lg text-slate-300 max-w-md">
            O seu progresso está salvo. Faça login para continuar suas auditorias e não deixar nenhum assunto para trás.
          </p>
        </div>
        <div className="relative z-10 text-sm text-slate-400">© {new Date().getFullYear()} Auditor IA.</div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold mb-2">Acessar Conta</h2>
            <p className="text-slate-400">Insira suas credenciais para entrar.</p>
          </div>

          {erro && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
              <AlertCircle size={20} /> {erro}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="email" required placeholder="E-mail" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="password" required placeholder="Senha" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                value={senha} onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-indigo-400 hover:underline">Esqueceu a senha?</a>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 mt-4 cursor-pointer disabled:opacity-50">
              {loading ? "Entrando..." : <>Entrar na Plataforma <ArrowRight size={20} /></>}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-8">
            Ainda não tem conta? <Link href="/cadastro" className="text-indigo-400 font-bold hover:underline cursor-pointer">Cadastre-se grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}