// frontend/app/cadastro/page.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, User, Phone, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Cadastro() {
  const router = useRouter();
  const [formData, setFormData] = useState({ nome: "", telefone: "", cep: "", email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // 1. Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      // 2. Atualiza o nome de exibição básico
      await updateProfile(user, { displayName: formData.nome });

      // 3. Salva os dados extras (Telefone, CEP) no Firestore
      await setDoc(doc(db, "users", user.uid), {
        nome: formData.nome,
        telefone: formData.telefone,
        cep: formData.cep,
        email: formData.email,
        dataCadastro: new Date()
      });

      // 4. Redireciona para a página de explicação (Onboarding)
        router.push("/onboarding");

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErro("Este e-mail já está cadastrado. Que tal fazer login?");
      } else if (error.code === 'auth/weak-password') {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErro("Erro ao criar conta. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 font-sans">
      {/* Lado Esquerdo - Motivacional */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
        
        <Link href="/" className="relative z-10 flex items-center gap-2 text-2xl font-bold text-white cursor-pointer w-fit">
          <BrainCircuit className="text-blue-400" size={32} /> Auditor IA
        </Link>

        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Sua jornada rumo à <span className="text-blue-400">alta performance</span> começa aqui.
          </h1>
          <p className="text-lg text-slate-300 max-w-md">
            Junte-se à elite dos estudantes. Crie sua conta para auditar seu conhecimento, corrigir falhas invisíveis e dominar qualquer edital.
          </p>
        </div>
        <div className="relative z-10 text-sm text-slate-400">© {new Date().getFullYear()} Auditor IA.</div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold mb-2">Criar Conta</h2>
            <p className="text-slate-400">Preencha seus dados para acessar a plataforma.</p>
          </div>

          {erro && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
              <AlertCircle size={20} /> {erro}
            </motion.div>
          )}

          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="text" required placeholder="Nome completo" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input type="tel" required placeholder="Telefone (DDD)" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input type="text" required placeholder="CEP" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})}
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="email" required placeholder="E-mail" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="password" required placeholder="Senha (mín. 6 caracteres)" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})}
              />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 mt-4 cursor-pointer disabled:opacity-50">
              {loading ? "Criando conta..." : <>Finalizar Cadastro <ArrowRight size={20} /></>}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-8">
            Já tem uma conta? <Link href="/login" className="text-blue-400 font-bold hover:underline cursor-pointer">Faça login aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
}