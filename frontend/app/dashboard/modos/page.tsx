// frontend/app/dashboard/modos/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, Brain, Target, Settings, ChevronRight, Flame, Check, RotateCcw, BookOpen } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { Logo } from "@/components/Logo";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { JORNADAS_ESTUDO } from "@/data/materias";
import { motion, AnimatePresence } from "framer-motion";

const MODOS = [
  {
    value: "livre" as const,
    label: "Livre",
    icon: Mic,
    resumo: "Explicação aberta",
    beneficios: [
      "Você controla o ritmo",
      "A IA mapeia todas as lacunas",
      "Ideal para revisão geral",
    ],
    bgGrad: "from-blue-50 to-blue-100",
    border: "border-blue-200",
    borderActive: "border-blue-500",
    ring: "ring-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800",
    resumoColor: "text-blue-500",
    dotColor: "bg-blue-400",
    hoverShadow: "0 24px 48px rgba(37,99,235,0.16)",
  },
  {
    value: "guiado" as const,
    label: "Guiado",
    icon: Target,
    resumo: "Perguntas progressivas",
    beneficios: [
      "A IA conduz a sessão",
      "Aprofundamento gradual",
      "Ideal para dominar detalhes",
    ],
    bgGrad: "from-emerald-50 to-emerald-100",
    border: "border-emerald-200",
    borderActive: "border-emerald-500",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-800",
    resumoColor: "text-emerald-500",
    dotColor: "bg-emerald-400",
    hoverShadow: "0 24px 48px rgba(16,185,129,0.16)",
  },
  {
    value: "simulado" as const,
    label: "Simulado",
    icon: Brain,
    resumo: "Cenário hipotético",
    beneficios: [
      "Contexto real apresentado",
      "Você explica o raciocínio",
      "Treino para provas práticas",
    ],
    bgGrad: "from-violet-50 to-violet-100",
    border: "border-violet-200",
    borderActive: "border-violet-500",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    titleColor: "text-violet-800",
    resumoColor: "text-violet-500",
    dotColor: "bg-violet-400",
    hoverShadow: "0 24px 48px rgba(124,58,237,0.16)",
  },
] as const;

type LacunaHistorico = {
  topico?: string;
  descricao?: string;
  count?: number;
  peso_percentual?: number;
};

function extrairPrioridades(perfil: any): string[] {
  if (!perfil) return [];

  const itens: Array<LacunaHistorico & { origem: "erro" | "omissao" }> = [
    ...(perfil.erros || []).map((item: LacunaHistorico) => ({ ...item, origem: "erro" as const })),
    ...(perfil.omissoes || []).map((item: LacunaHistorico) => ({ ...item, origem: "omissao" as const })),
  ];

  const vistos = new Set<string>();
  return itens
    .filter((item) => item.topico)
    .sort((a, b) => {
      const pesoA = a.peso_percentual || 0;
      const pesoB = b.peso_percentual || 0;
      if (pesoA !== pesoB) return pesoB - pesoA;
      return (b.count || 1) - (a.count || 1);
    })
    .map((item) => {
      const prefixo = item.origem === "erro" ? "Erro anterior" : "Omissão anterior";
      return `${prefixo}: ${item.topico}`;
    })
    .filter((texto) => {
      const key = texto.toLowerCase().trim();
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    })
    .slice(0, 6);
}

export default function ModosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const [jornada, setJornada] = useState("concurso");
  const [nivel, setNivel] = useState("Intermediario");
  const [banca, setBanca] = useState("Livre");

  // Sessão Normal
  const [materia, setMateria] = useState("");
  const [tema, setTema] = useState("");

  // Sessão Personalizada
  const [tipoSessao, setTipoSessao] = useState<"normal" | "personalizada">("normal");
  const [perfis, setPerfis] = useState<any[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<any>(null);

  const [modo, setModo] = useState<"livre" | "guiado" | "simulado">("livre");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (!snap.exists() || !snap.data().onboarding_completo) {
          router.replace("/onboarding");
          return;
        }
        const d = snap.data();
        setJornada(d.jornada || "concurso");
        setNivel(d.nivel_padrao || "Intermediario");
        setBanca(d.banca_padrao || "Livre");

        const qPerfis = query(collection(db, "perfis_cognitivos"), where("user_id", "==", u.uid));
        const perfisSnap = await getDocs(qPerfis);
        const pData = perfisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        pData.sort((a: any, b: any) => new Date(b.ultima_atualizacao).getTime() - new Date(a.ultima_atualizacao).getTime());
        setPerfis(pData);
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

  const matAtual = tipoSessao === "personalizada" ? perfilSelecionado?.materia : materia;
  const temaAtual = tipoSessao === "personalizada" ? perfilSelecionado?.tema : tema;
  const prioridadesPersonalizadas = useMemo(
    () => extrairPrioridades(perfilSelecionado),
    [perfilSelecionado],
  );
  const podeIniciar = !!matAtual && !!temaAtual;

  const iniciar = () => {
    if (!podeIniciar) return;
    const qs = new URLSearchParams({ jornada, materia: matAtual, tema: temaAtual, banca, faixa_salarial: nivel });
    if (tipoSessao === "personalizada" && prioridadesPersonalizadas.length > 0) {
      qs.set("personalizado", "1");
      qs.set("prioridades", prioridadesPersonalizadas.join("|"));
    }
    if (modo === "livre") router.push(`/dashboard/auditorio?${qs}`);
    else if (modo === "guiado") router.push(`/dashboard/modos/guiado?${qs}`);
    else router.push(`/dashboard/modos/simulado?${qs}`);
  };

  if (carregando) return (
    <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* NAVBAR */}
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <Flame size={14} className="fill-amber-500" /> 3 Dias
          </div>
          <Link href="/dashboard" className="text-slate-500 hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest hidden md:block">
            Dashboard
          </Link>
          <Link href="/perfil" className="text-slate-400 hover:text-black transition-colors">
            <Settings size={20} />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-8">

        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            Olá, {user?.displayName?.split(" ")[0] || "Estudante"}.
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1">O que vamos dominar hoje?</p>
        </div>

        {/* TOGGLE: TIPO DE SESSÃO */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-1.5 flex gap-1.5">
          <button
            onClick={() => setTipoSessao("normal")}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              tipoSessao === "normal" ? "bg-black text-white shadow-sm" : "text-slate-400 hover:text-black"
            }`}
          >
            Sessão Normal
          </button>
          <button
            onClick={() => setTipoSessao("personalizada")}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              tipoSessao === "personalizada" ? "bg-black text-white shadow-sm" : "text-slate-400 hover:text-black"
            }`}
          >
            <RotateCcw size={12} /> Sessão Personalizada
          </button>
        </div>

        {/* SELEÇÃO DE ASSUNTO */}
        <AnimatePresence mode="wait">
          {tipoSessao === "normal" ? (
            <motion.section
              key="normal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4"
            >
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <BookOpen size={14} /> Assunto
              </h3>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Matéria</label>
                <select value={materia} onChange={e => setMateria(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                  <option value="" disabled>Selecione a matéria</option>
                  {jornadaObj?.materias.map(m => (
                    <option key={m.id} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
              </div>

              {materia && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tema</label>
                  <select value={tema} onChange={e => setTema(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors">
                    {materiaObj?.temas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </motion.section>

          ) : (
            <motion.section
              key="personalizada"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <RotateCcw size={14} /> Temas Já Estudados
              </h3>

              {perfis.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
                  <p className="text-sm font-black text-slate-500 mb-1">Nenhuma sessão anterior encontrada.</p>
                  <p className="text-xs font-bold text-slate-400">Faça sua primeira sessão normal para ativar esta opção.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {perfis.map((p: any) => (
                    <motion.button
                      key={p.id}
                      onClick={() => setPerfilSelecionado(perfilSelecionado?.id === p.id ? null : p)}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-colors ${
                        perfilSelecionado?.id === p.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{p.materia}</p>
                        <p className="font-black text-slate-800">{p.tema}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          {p.total_sessoes || 1} {p.total_sessoes === 1 ? "sessão" : "sessões"}
                          {p.erros?.length ? ` · ${p.erros.length} lacunas mapeadas` : ""}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors ${
                        perfilSelecionado?.id === p.id ? "bg-blue-600" : "bg-slate-100"
                      }`}>
                        <Check size={12} className={perfilSelecionado?.id === p.id ? "text-white" : "text-slate-300"} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* MODO DE ESTUDO */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Como Quer Estudar?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODOS.map(m => {
              const Icon = m.icon;
              const ativo = modo === m.value;
              return (
                <motion.button
                  key={m.value}
                  onClick={() => setModo(m.value)}
                  whileHover={{ y: -6, boxShadow: m.hoverShadow }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`relative flex flex-col p-6 rounded-[1.5rem] border-2 text-left bg-gradient-to-br ${m.bgGrad} transition-colors ${
                    ativo
                      ? `${m.borderActive} ring-4 ring-offset-2 ${m.ring}`
                      : m.border
                  }`}
                >
                  {ativo && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                  <div className={`w-11 h-11 ${m.iconBg} rounded-2xl flex items-center justify-center mb-4 ${m.iconColor}`}>
                    <Icon size={22} />
                  </div>
                  <p className={`font-black text-lg mb-0.5 ${m.titleColor}`}>{m.label}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${m.resumoColor}`}>{m.resumo}</p>
                  <ul className="space-y-2">
                    {m.beneficios.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dotColor}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
        </section>

        <motion.button
          onClick={iniciar}
          disabled={!podeIniciar}
          whileHover={podeIniciar ? { scale: 1.01 } : {}}
          whileTap={podeIniciar ? { scale: 0.98 } : {}}
          className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:hover:bg-black"
        >
          Iniciar Sessão <ChevronRight size={16} />
        </motion.button>

      </main>
    </div>
  );
}
