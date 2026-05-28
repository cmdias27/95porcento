// frontend/app/dashboard/historico/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppHeader } from "@/components/AppHeader";
import { motion } from "framer-motion";
import { FileText, Play, BookOpen, Brain, Swords, Search } from "lucide-react";

type Modo = "livre" | "guiado" | "simulado";

interface Sessao {
  id: string;
  materia: string;
  tema: string;
  modo: Modo;
  url: string;
  ts: number;
  nota?: number;
}

const MODO_LABEL: Record<Modo, string> = {
  livre:    "Livre",
  guiado:   "Guiado",
  simulado: "Simulado",
};

const MODO_ICON: Record<Modo, React.FC<{ size?: number; className?: string }>> = {
  livre:    BookOpen,
  guiado:   Brain,
  simulado: Swords,
};

const MODO_COLOR: Record<Modo, string> = {
  livre:    "bg-blue-100 text-blue-700",
  guiado:   "bg-emerald-100 text-emerald-700",
  simulado: "bg-purple-100 text-purple-700",
};

const MODO_DOT: Record<Modo, string> = {
  livre:    "bg-blue-500",
  guiado:   "bg-emerald-500",
  simulado: "bg-purple-500",
};

function formatDate(ts: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HistoricoPage() {
  const router = useRouter();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Modo | "todos">("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/"); return; }

      try {
        const [livres, guiados, simulados] = await Promise.all([
          getDocs(query(collection(db, "relatorios"),           where("user_id", "==", u.uid))),
          getDocs(query(collection(db, "relatorios_guiados"),   where("user_id", "==", u.uid))),
          getDocs(query(collection(db, "relatorios_simulados"), where("user_id", "==", u.uid))),
        ]);

        const todas: Sessao[] = [
          ...livres.docs.map(x => ({
            id: x.id,
            materia: x.data().materia || "",
            tema: x.data().tema || "",
            modo: "livre" as Modo,
            url: `/dashboard/relatorio/${x.id}`,
            ts: new Date(x.data().data || x.data().timestamp || 0).getTime(),
            nota: x.data().score_cognitivo ?? x.data().nota_geral,
          })),
          ...guiados.docs.map(x => ({
            id: x.id,
            materia: x.data().materia || "",
            tema: x.data().tema || "",
            modo: "guiado" as Modo,
            url: `/dashboard/relatorio-guiado/${x.id}`,
            ts: new Date(x.data().data || x.data().timestamp || 0).getTime(),
            nota: x.data().score_cognitivo ?? x.data().nota_final,
          })),
          ...simulados.docs.map(x => ({
            id: x.id,
            materia: x.data().materia || "",
            tema: x.data().tema || "",
            modo: "simulado" as Modo,
            url: `/dashboard/relatorio-simulado/${x.id}`,
            ts: new Date(x.data().data || x.data().timestamp || 0).getTime(),
            nota: x.data().score_cognitivo ?? x.data().acertos,
          })),
        ];
        todas.sort((a, b) => b.ts - a.ts);
        setSessoes(todas);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const visiveis = sessoes.filter(s => {
    const modoOk = filtro === "todos" || s.modo === filtro;
    const buscaOk = busca.trim() === "" ||
      s.materia.toLowerCase().includes(busca.toLowerCase()) ||
      s.tema.toLowerCase().includes(busca.toLowerCase());
    return modoOk && buscaOk;
  });

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col">
      <AppHeader variant="default" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black text-black tracking-tight">Histórico</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">
            {sessoes.length} sessão{sessoes.length !== 1 ? "s" : ""} registrada{sessoes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Busca */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar matéria ou tema..."
              className="text-sm font-medium text-slate-700 placeholder-slate-400 outline-none bg-transparent w-full"
            />
          </div>

          {/* Modo */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {(["todos", "livre", "guiado", "simulado"] as const).map(m => (
              <button key={m} onClick={() => setFiltro(m)}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                  filtro === m ? "bg-black text-white" : "text-slate-400 hover:text-black"
                }`}
              >
                {m === "todos" ? "Todos" : MODO_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-400">
              {sessoes.length === 0 ? "Nenhuma sessão ainda." : "Nenhum resultado para o filtro atual."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visiveis.map((s, i) => {
              const Icon = MODO_ICON[s.modo];
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${MODO_COLOR[s.modo]}`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{s.materia}</p>
                    <p className="text-sm font-black text-slate-800 truncate">{s.tema}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{formatDate(s.ts)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {s.nota !== undefined && s.nota !== null && (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {Number(s.nota).toFixed(1)}/10
                      </span>
                    )}
                    <button onClick={() => router.push(s.url)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                      <FileText size={11} /> Relatório
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/dashboard?repetir_materia=${encodeURIComponent(s.materia)}&repetir_tema=${encodeURIComponent(s.tema)}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                      <Play size={11} /> Repetir
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
