// frontend/app/onboarding/page.tsx
"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { BookOpen, Mic, BrainCircuit, Target, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Onboarding() {
  const steps = [
    {
      id: 1,
      icon: <BookOpen size={32} className="text-blue-500" />,
      title: "1. Crie seu Plano",
      desc: "Selecione a matéria, o tema e os subtemas exatos que você deseja testar."
    },
    {
      id: 2,
      icon: <Mic size={32} className="text-indigo-500" />,
      title: "2. Estudo Ativo",
      desc: "Sem ler. Grave um áudio ou digite dando uma aula sobre o tema com suas próprias palavras."
    },
    {
      id: 3,
      icon: <BrainCircuit size={32} className="text-emerald-500" />,
      title: "3. Auditoria IA",
      desc: "Nossa Inteligência Artificial Generativa cruza a sua explicação com o banco de dados detalhado."
    },
    {
      id: 4,
      icon: <Target size={32} className="text-purple-500" />,
      title: "4. Relatório Cirúrgico",
      desc: "Descubra o que você omitiu, o que errou e receba um plano de ação para atingir 95% de retenção."
    }
  ];

  // Tipagem adicionada aqui para resolver o erro do TypeScript
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  // Tipagem adicionada aqui para resolver o erro do TypeScript
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full relative z-10 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-6">
            <CheckCircle2 size={18} /> Conta criada com sucesso!
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Como funciona o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Auditor IA</span>?</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Sua rotina de estudos está prestes a mudar. Entenda o fluxo para extrair o máximo do nosso motor de inteligência.
          </p>
        </motion.div>

        {/* Trilha de Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-4 w-full mb-20"
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Card */}
              <motion.div 
                variants={itemVariants}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm lg:w-1/4 flex flex-col items-center text-center relative shadow-xl shadow-black/50"
              >
                <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>

              {/* Seta Pontilhada (Escondida no último item) */}
              {index < steps.length - 1 && (
                <motion.div variants={itemVariants} className="hidden lg:flex items-center justify-center w-16 h-full mt-16 text-slate-600">
                  <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 10H36M36 10L28 2M36 10L28 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4"/>
                  </svg>
                </motion.div>
              )}
              
              {/* Seta Pontilhada Vertical (Mobile) */}
              {index < steps.length - 1 && (
                <motion.div variants={itemVariants} className="flex lg:hidden items-center justify-center h-12 text-slate-600">
                  <svg width="20" height="40" viewBox="0 0 20 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0V36M10 36L2 28M10 36L18 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4"/>
                  </svg>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Botão de Ação */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <Link href="/dashboard">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-12 rounded-full text-lg transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.8)] flex items-center gap-3 cursor-pointer">
              Começar a Estudar <ArrowRight size={24} />
            </button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}