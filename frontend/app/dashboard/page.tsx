"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Mic,
  Play,
  Settings,
  Target,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Logo } from "@/components/Logo";

type ModoSessao = "livre" | "guiado" | "simulado";

type SessaoHistorico = {
  id: string;
  materia: string;
  tema: string;
  timestamp: string;
  modo: ModoSessao;
  url: string;
  data: Record<string, any>;
};

const MODO_LABEL: Record<ModoSessao, string> = {
  livre: "Livre",
  guiado: "Guiado",
  simulado: "Simulado",
};

const MODO_STYLE: Record<ModoSessao, string> = {
  livre: "bg-blue-50 text-blue-700 border-blue-200",
  guiado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  simulado: "bg-violet-50 text-violet-700 border-violet-200",
};

function formatDate(value?: string) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function cleanFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function stringifySection(title: string, value: unknown) {
  if (!value || (Array.isArray(value) && value.length === 0)) return "";
  return `\n\n--- ${title} ---\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`;
}

function buildReportText(sessao: SessaoHistorico) {
  const data = sessao.data || {};
  return [
    "95porcento - Relatório de Explicação",
    `Modo: ${MODO_LABEL[sessao.modo]}`,
    `Matéria: ${sessao.materia}`,
    `Tema: ${sessao.tema}`,
    `Data: ${formatDate(sessao.timestamp)}`,
    stringifySection("Diagnóstico", data.diagnostico_eficiencia || data.diagnostico_cognitivo),
    stringifySection("Erros identificados", data.erros_cometidos || data.erros),
    stringifySection("Omissões", data.temas_nao_abordados || data.omissoes),
    stringifySection("Questões adaptadas", data.questoes_adaptadas || data.questoes),
    stringifySection("Relatório completo", data),
  ].filter(Boolean).join("\n");
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessoes, setSessoes] = useState<SessaoHistorico[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      try {
        const userSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
        if (!userSnap.exists()) {
          router.replace("/onboarding");
          return;
        }

        const userData = userSnap.data();
        if (!userData.onboarding_completo) {
          router.replace("/onboarding");
          return;
        }

        const [livresSnap, guiadosSnap, simuladosSnap] = await Promise.all([
          getDocs(query(collection(db, "relatorios"), where("user_id", "==", currentUser.uid))),
          getDocs(query(collection(db, "relatorios_guiados"), where("user_id", "==", currentUser.uid))),
          getDocs(query(collection(db, "relatorios_simulados"), where("user_id", "==", currentUser.uid))),
        ]);

        const toSessao = (
          docs: typeof livresSnap.docs,
          modo: ModoSessao,
          baseUrl: string,
        ): SessaoHistorico[] => docs.map((relatorioDoc) => {
          const data = relatorioDoc.data();
          return {
            id: relatorioDoc.id,
            materia: data.materia || "Matéria não informada",
            tema: data.tema || "Tema não informado",
            timestamp: data.timestamp || data.created_at || data.data || "",
            modo,
            url: `${baseUrl}/${relatorioDoc.id}`,
            data,
          };
        });

        const historico = [
          ...toSessao(livresSnap.docs, "livre", "/dashboard/relatorio"),
          ...toSessao(guiadosSnap.docs, "guiado", "/dashboard/relatorio-guiado"),
          ...toSessao(simuladosSnap.docs, "simulado", "/dashboard/relatorio-simulado"),
        ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

        setSessoes(historico);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const totalSessoes = sessoes.length;
  const ultimaSessao = useMemo(() => sessoes[0] || null, [sessoes]);

  const downloadRelatorio = (sessao: SessaoHistorico) => {
    const text = buildReportText(sessao);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${cleanFileName(sessao.materia)}-${cleanFileName(sessao.tema)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <Logo />
        <Link href="/perfil" className="text-slate-400 hover:text-black transition-colors">
          <Settings size={20} />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
              Histórico de explicações
            </p>
            <h1 className="text-2xl font-black text-black tracking-tight">
              Olá, {user?.displayName?.split(" ")[0] || "Estudante"}.
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              {totalSessoes > 0
                ? `${totalSessoes} ${totalSessoes === 1 ? "explicação registrada" : "explicações registradas"}.`
                : "Suas explicações aparecerão aqui."}
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/modos")}
            className="bg-black text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            Nova explicação <Mic size={15} />
          </button>
        </section>

        {ultimaSessao && (
          <section className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                <FileText size={19} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Último relatório
                </p>
                <p className="font-black text-slate-900">{ultimaSessao.tema}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={() => router.push(ultimaSessao.url)}
                className="bg-slate-950 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                Abrir relatório <ChevronRight size={15} />
              </button>
              <button
                onClick={() => downloadRelatorio(ultimaSessao)}
                className="bg-white text-slate-800 border-2 border-slate-200 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Baixar <Download size={15} />
              </button>
              <button
                onClick={() => router.push("/dashboard/modos")}
                className="bg-blue-50 text-blue-700 border-2 border-blue-100 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                Reexplicar <Play size={15} />
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
              Todas as explicações
            </h2>
          </div>

          {sessoes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic size={26} className="text-blue-600" />
              </div>
              <p className="text-sm font-black text-slate-700 mb-1">
                Nenhuma explicação feita ainda.
              </p>
              <p className="text-xs font-bold text-slate-400 mb-6">
                Explique um tema para gerar seu primeiro relatório.
              </p>
              <button
                onClick={() => router.push("/dashboard/modos")}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors"
              >
                Começar agora <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessoes.map((sessao) => (
                <article
                  key={`${sessao.modo}-${sessao.id}`}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${MODO_STYLE[sessao.modo]}`}>
                          {MODO_LABEL[sessao.modo]}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(sessao.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                        {sessao.materia}
                      </p>
                      <h3 className="font-black text-slate-900 text-base truncate">
                        {sessao.tema}
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                      <button
                        onClick={() => router.push(sessao.url)}
                        className="px-3 py-2 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => downloadRelatorio(sessao)}
                        className="px-3 py-2 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download size={13} /> Baixar
                      </button>
                      <button
                        onClick={() => router.push("/dashboard/modos")}
                        className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Reexplicar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
