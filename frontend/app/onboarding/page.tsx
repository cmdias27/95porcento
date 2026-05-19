// frontend/app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, BookOpen, GraduationCap, Scale } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const JORNADAS = [
  { value: "concurso", label: "Concurso Público", icon: BookOpen },
  { value: "oab", label: "OAB", icon: Scale },
  { value: "enem", label: "ENEM", icon: GraduationCap },
] as const;

const NIVEIS = [
  { value: "Inicial", label: "Iniciante" },
  { value: "Intermediario", label: "Intermediário" },
  { value: "Avancado", label: "Avançado" },
  { value: "Elite", label: "Elite" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [jornada, setJornada] = useState<string>("");
  const [banca, setBanca] = useState<string>("");
  const [nivel, setNivel] = useState<string>("Intermediario");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace("/login"); return; }
      setUid(u.uid);
    });
    return () => unsub();
  }, [router]);

  const avancar = () => setEtapa(e => e + 1);
  const voltar = () => setEtapa(e => e - 1);

  const salvarPerfil = async () => {
    if (!uid) return;
    setSalvando(true);
    try {
      await setDoc(doc(db, "usuarios", uid), {
        jornada,
        nivel_padrao: nivel,
        banca_padrao: banca || "Livre",
        onboarding_completo: true,
      }, { merge: true });
      router.replace("/dashboard/modos");
    } catch (e) {
      console.error(e);
      router.replace("/dashboard/modos");
    } finally {
      setSalvando(false);
    }
  };

  const SLIDE = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  return (
    <div className="min-h-[100dvh] bg-white font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Barra de Progresso */}
        <div className="flex gap-2 mb-8 px-4">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= etapa ? 'bg-blue-600' : 'bg-slate-100'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ETAPA 1: OBJETIVO */}
          {etapa === 1 && (
            <motion.div key="e1" {...SLIDE} className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight mb-2">Qual seu objetivo?</h1>
                <p className="text-sm font-bold text-slate-400">Personalizamos a inteligência pro seu foco.</p>
              </div>

              <div className="grid gap-3">
                {JORNADAS.map(j => {
                  const ativo = jornada === j.value;
                  const Icon = j.icon;
                  return (
                    <button key={j.value} onClick={() => setJornada(j.value)}
                      className={`flex items-center p-5 rounded-2xl border-2 transition-all text-left ${
                        ativo ? "border-blue-600 bg-blue-50 ring-4 ring-blue-50" : "border-slate-200 hover:border-slate-300"
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${ativo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <Icon size={24} />
                      </div>
                      <span className={`text-lg font-black ${ativo ? "text-blue-700" : "text-slate-800"}`}>{j.label}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={avancar} disabled={!jornada}
                className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:hover:bg-black mt-4">
                Continuar <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ETAPA 2: PERFIL */}
          {etapa === 2 && (
            <motion.div key="e2" {...SLIDE} className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-black tracking-tight mb-2">Monte seu perfil</h1>
                <p className="text-sm font-bold text-slate-400">Usamos isso para personalizar sua experiência.</p>
              </div>

              <div className="space-y-4">
                {jornada === 'concurso' && (
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Banca</label>
                    <select value={banca} onChange={e => setBanca(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                      <option value="">Não Escolher Agora</option>
                      <option value="CEBRASPE">CEBRASPE / CESPE</option>
                      <option value="FCC">FCC</option>
                      <option value="VUNESP">VUNESP</option>
                      <option value="QUADRIX">QUADRIX</option>
                      <option value="IBFC">IBFC</option>
                      <option value="IDECAN">IDECAN</option>
                      <option value="IADES">IADES</option>
                      <option value="AOCP">AOCP</option>
                      <option value="FAURGS">FAURGS</option>
                      <option value="FUNDATEC">FUNDATEC</option>
                      <option value="NC-UFPR">NC-UFPR</option>
                      <option value="CONSULPLAN">CONSULPLAN</option>
                      <option value="FGV">FGV</option>
                      <option value="ESAF">ESAF</option>
                      <option value="FEPESE">FEPESE</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Seu Nível de Conhecimento</label>
                  <select value={nivel} onChange={e => setNivel(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                    {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={voltar} className="px-6 py-4 rounded-xl border-2 border-slate-200 font-black text-xs uppercase text-slate-500 hover:bg-slate-50">
                  Voltar
                </button>
                <button onClick={salvarPerfil} disabled={salvando}
                  className="flex-1 bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {salvando
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <>Começar a Estudar <ChevronRight size={16} /></>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
