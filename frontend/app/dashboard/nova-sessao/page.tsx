// frontend/app/dashboard/nova-sessao/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { JORNADAS_ESTUDO } from "@/data/materias";
import { ArrowLeft, ChevronRight, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function NovaSessaoPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  
  const [jornada, setJornada] = useState("concurso");
  const [nivel, setNivel] = useState("Intermediario");
  const [banca, setBanca] = useState("Livre");
  
  const [materia, setMateria] = useState("");
  const [tema, setTema] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setJornada(d.jornada || "concurso");
          setNivel(d.nivel_padrao || "Intermediario");
          setBanca(d.banca_padrao || "Livre");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    });
    return () => unsub();
  }, [router]);

  const jornadaObj = useMemo(() => JORNADAS_ESTUDO.find(j => j.nome.toLowerCase() === jornada), [jornada]);
  const materiaObj = useMemo(() => jornadaObj?.materias.find(m => m.nome === materia), [jornadaObj, materia]);

  useEffect(() => {
    if (materiaObj && materiaObj.temas.length > 0) {
      setTema(materiaObj.temas[0]);
    } else {
      setTema("");
    }
  }, [materiaObj]);

  const iniciarExplicacao = () => {
    const qs = new URLSearchParams({
      jornada,
      materia,
      tema,
      banca,
      faixa_salarial: nivel,
    });
    router.push(`/dashboard/auditorio?${qs.toString()}`);
  };

  if (carregando) return <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      <button onClick={() => router.back()} className="absolute top-6 left-6 md:top-8 md:left-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black flex items-center gap-1.5 transition-colors">
        <ArrowLeft size={14} /> Voltar
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <Brain size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">O que vamos mapear hoje?</h1>
          <p className="text-xs font-bold text-slate-500">Jornada atual: <span className="uppercase text-blue-600">{jornada}</span></p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Matéria</label>
            <select value={materia} onChange={e => setMateria(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
              <option value="" disabled>Selecione a matéria</option>
              {jornadaObj?.materias.map(m => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>

          {materia && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tema Específico</label>
              <select value={tema} onChange={e => setTema(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                <option value="" disabled>Selecione o tema</option>
                {materiaObj?.temas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </motion.div>
          )}
        </div>

        <button onClick={iniciarExplicacao} disabled={!materia || !tema}
          className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-30 shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]">
          Iniciar Diagnóstico <ChevronRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
