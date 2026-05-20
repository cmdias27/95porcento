// frontend/app/dashboard/relatorio/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Brain, CheckCircle2, AlertTriangle, ChevronRight, Download, Printer, Sparkles, Edit3, BrainCircuit, Activity, Compass, BookOpen, LayoutGrid, Eye, EyeOff, Fingerprint, Zap, Mic, Star, Send } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { db, auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const formatarTexto = (texto: any) => {
  if (!texto) return null;
  if (Array.isArray(texto)) {
    return (
      <ul className="list-disc pl-5 space-y-2">
        {texto.map((item, index) => (
          <li key={index} className="text-sm text-slate-700">{item}</li>
        ))}
      </ul>
    );
  }
  if (typeof texto === 'string') {
    return texto.split('\n').map((linha, index) => (
      <span key={index}>{linha}<br /></span>
    ));
  }
  return String(texto);
};

const limparTextoExportacao = (texto: any): string => {
  if (!texto) return "";
  if (Array.isArray(texto)) return texto.map(t => limparTextoExportacao(t)).join('\n');
  if (typeof texto === 'object') return JSON.stringify(texto);
  return String(texto).replace(/\*\*/g, '');
};

function CollapsibleSection({
  title, icon: Icon, iconColor, badge, isOpen, onToggle, children,
}: {
  id?: string;
  title: string;
  icon: any;
  iconColor: string;
  badge?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 border-b-2 border-black pb-3 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={20} className={`${iconColor} shrink-0`} />
          <h2 className="text-base md:text-xl lg:text-2xl font-black uppercase tracking-tight text-black">{title}</h2>
          {badge !== undefined && badge > 0 && (
            <span className="text-[10px] font-black text-white bg-slate-700 px-2 py-0.5 rounded-full shrink-0">{badge}</span>
          )}
        </div>
        <ChevronRight
          size={20}
          className={`text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function QuestaoCard({ questao, gabaritosRevelados, toggle, autoral = false, bancaLabel = "" }: {
  questao: any;
  gabaritosRevelados: Set<string>;
  toggle: (id: string) => void;
  autoral?: boolean;
  bancaLabel?: string;
}) {
  if (!questao) return null;
  const revealed = gabaritosRevelados.has(questao.id);
  return (
    <div className={`mt-4 border-2 rounded-xl overflow-hidden ${autoral ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${autoral ? "border-purple-200 bg-purple-100" : "border-slate-200 bg-slate-100"}`}>
        {autoral ? <Sparkles size={13} className="text-purple-500" /> : <BookOpen size={13} className="text-slate-500" />}
        <span className={`text-[10px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-slate-500"}`}>
          {autoral ? "Questão Autoral" : "Questão de Prova"}
        </span>
        {autoral && bancaLabel && bancaLabel.toLowerCase() !== "livre" && (
          <span className="ml-auto text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">Estilo {bancaLabel}</span>
        )}
        {!autoral && questao.banca && <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.banca}</span>}
        {!autoral && questao.ano && <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{questao.ano}</span>}
      </div>
      <div className="p-4">
        {questao.texto_auxiliar && (
          <div className="text-sm font-medium text-slate-600 leading-relaxed mb-3 bg-slate-100 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap">
            {questao.texto_auxiliar}
          </div>
        )}
        <p className="text-sm font-medium text-slate-800 leading-relaxed mb-4">{questao.enunciado}</p>
        {questao.alternativas && (
          <ul className="space-y-1.5 mb-4">
            {Object.entries(questao.alternativas).sort(([a], [b]) => a.localeCompare(b)).map(([letra, texto]) => (
              <li key={letra} className={`text-xs flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                revealed && questao.gabarito === letra
                  ? autoral ? "bg-purple-50 border-purple-300 font-bold text-purple-900" : "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                  : "border-slate-100 text-slate-600"
              }`}>
                <span className="font-black shrink-0 w-4">{letra})</span>
                <span>{String(texto)}</span>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => toggle(questao.id)}
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${autoral ? "text-purple-600 hover:text-purple-800" : "text-blue-600 hover:text-blue-800"}`}>
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          {revealed ? "Ocultar Gabarito" : "Ver Gabarito"}
        </button>
        {revealed && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${autoral ? "text-purple-600" : "text-emerald-600"}`}>Gabarito:</span>
              <span className={`text-sm font-black px-2 py-0.5 rounded border ${autoral ? "text-purple-700 bg-purple-50 border-purple-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}>{questao.gabarito}</span>
            </div>
            {questao.comentario && (
              <p className="text-xs font-medium text-slate-600 leading-relaxed">{questao.comentario}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pesquisa de satisfação ──────────────────────────────────
function PesquisaSatisfacao({ relatorioId }: { relatorioId: string }) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [recomenda, setRecomenda] = useState<string>("");
  const [sugestao, setSugestao] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const perguntas = [
    { id: "relatorio", texto: "Como você avalia o relatório gerado?" },
    { id: "precisao", texto: "A análise foi precisa com o que você explicou?" },
    { id: "utilidade", texto: "O quanto isso ajudou no seu aprendizado?" },
  ];

  const setNota = (id: string, valor: number) =>
    setNotas(prev => ({ ...prev, [id]: valor }));

  const podeSalvar = Object.keys(notas).length === perguntas.length && recomenda !== "";

  const enviar = async () => {
    if (!podeSalvar) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, "feedbacks"), {
        relatorioId,
        uid: auth.currentUser?.uid ?? null,
        notas,
        recomenda,
        sugestao: sugestao.trim() || null,
        criadoEm: serverTimestamp(),
      });
      setEnviado(true);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircle2 size={36} className="text-emerald-500" />
      <p className="text-base font-black text-slate-900">Obrigado pelo feedback!</p>
      <p className="text-sm text-slate-500">Suas respostas nos ajudam a melhorar.</p>
    </div>
  );

  return (
    <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Sua opinião importa</p>
        <h3 className="text-xl font-black text-slate-900">Como foi essa sessão?</h3>
      </div>

      {/* Estrelas */}
      {perguntas.map(p => (
        <div key={p.id} className="space-y-2">
          <p className="text-sm font-bold text-slate-700">{p.texto}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(v => (
              <button key={v} onClick={() => setNota(p.id, v)}
                className="transition-transform hover:scale-110 active:scale-95">
                <Star
                  size={28}
                  className={v <= (notas[p.id] ?? 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"}
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Recomendaria */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-700">Você recomendaria o 95porcento para outros estudantes?</p>
        <div className="flex gap-2 flex-wrap">
          {["Sim", "Talvez", "Não"].map(op => (
            <button key={op} onClick={() => setRecomenda(op)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                recomenda === op
                  ? "bg-black text-white border-black"
                  : "border-slate-200 text-slate-500 hover:border-black hover:text-black"
              }`}>
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Sugestão livre */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-700">O que você melhoraria? <span className="font-normal text-slate-400">(opcional)</span></p>
        <textarea
          value={sugestao}
          onChange={e => setSugestao(e.target.value)}
          placeholder="Escreva sua sugestão..."
          rows={3}
          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-colors resize-none"
        />
      </div>

      <button onClick={enviar} disabled={!podeSalvar || enviando}
        className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-40 shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]">
        {enviando
          ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Send size={13} /> Enviar Feedback</>}
      </button>
    </div>
  );
}

export default function RelatorioFinal() {
  const params = useParams();
  const router = useRouter();
  const relatorioId = params.id as string;
  const [relatorio, setRelatorio] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [gabaritosRevelados, setGabaritosRevelados] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["mentor"]));

  const toggleGabarito = (id: string) => setGabaritosRevelados(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleSection = (id: string) => setOpenSections(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  useEffect(() => {
    const buscarRelatorio = async () => {
      try {
        const docRef = doc(db, "relatorios", relatorioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setRelatorio({ id: docSnap.id, ...docSnap.data() });
        else router.push("/");
      } catch (error) { console.error(error); }
      finally { setCarregando(false); }
    };
    if (relatorioId) buscarRelatorio();
  }, [relatorioId, router]);

  useEffect(() => {
    if (!relatorio || !relatorioId) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${API}/api/evento`, {
      method: "POST",
      body: JSON.stringify({
        tipo: "relatorio_visualizado",
        relatorio_id: relatorioId,
        tema:    relatorio.tema    ?? "",
        materia: relatorio.materia ?? "",
        jornada: relatorio.jornada ?? "",
      }),
    }).catch(() => {});
  }, [relatorio, relatorioId]);

  const exportarRelatorioTXT = () => {
    if (!relatorio) return;
    let c = `=== RELATÓRIO DE AUDITORIA: ${relatorio.tema?.toUpperCase()} ===\n`;
    c += `Perfil: ${relatorio.perfil_quadrante || 'Não classificado'}\n`;
    c += `Banca Alvo: ${relatorio.banca_escolhida || 'Geral'}\n`;
    c += `Faixa Salarial Alvo: ${relatorio.faixa_salarial_alvo || 'Não informada'}\n`;
    c += `\nANÁLISE DO MENTOR:\n${limparTextoExportacao(relatorio.raciocinio_interno)}\n\n`;
    if (relatorio.diagnostico_eficiencia) {
      c += `\n--- QUADRANTE DE EFICIÊNCIA ---\n${limparTextoExportacao(relatorio.diagnostico_eficiencia)}\n\n`;
    }
    c += `--- ERROS IDENTIFICADOS ---\n`;
    relatorio.erros_cometidos?.forEach((e: any, i: number) => {
      c += `Erro ${i+1}: ${limparTextoExportacao(e.trecho_aluno || e.erro)}\n`;
      c += `Correção: ${limparTextoExportacao(e.correcao || e.resumo)}\n\n`;
    });
    c += `--- OMISSÕES CRÍTICAS EM RELAÇÃO AO ROTEIRO IDEAL ---\n`;
    relatorio.temas_nao_abordados?.forEach((o: any) => {
      c += `- ${limparTextoExportacao(o.tema)}: ${limparTextoExportacao(o.resumo)}\n`;
    });
    c += `\n--- PONTOS FORTES ---\n`;
    relatorio.checklist_acertos?.forEach((a: any) => { c += `- ${limparTextoExportacao(a)}\n`; });
    c += `\n--- ROTEIRO DE ESTUDO ---\n`;
    relatorio.plano_de_estudo?.forEach((p: any) => {
      c += `- ${limparTextoExportacao(p.titulo)}: ${limparTextoExportacao(p.foco)}\n`;
    });
    const blob = new Blob([c], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Auditoria_${relatorio.tema}.txt`;
    link.click();
  };

  if (carregando || !relatorio) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <AppHeader
        variant="report"
        title={relatorio.tema}
        subtitle={`${relatorio.materia} • ${relatorio.banca_escolhida || "Banca Geral"}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportarRelatorioTXT} className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:text-black border-2 border-slate-200 hover:border-black rounded-xl transition-all">
              <Download size={13} /> TXT
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase text-white bg-black rounded-xl hover:-translate-y-0.5 transition-all">
              <Printer size={13} /> Imprimir
            </button>
          </div>
        }
      />

      <main className="w-full max-w-5xl mx-auto px-3 md:px-8 py-4 md:py-8 flex flex-col gap-6 md:gap-10 print:max-w-none print:p-0">

        {/* SEÇÃO 1: ANÁLISE DO MENTOR */}
        <CollapsibleSection
          id="mentor"
          title="Análise do Mentor"
          icon={Brain}
          iconColor="text-blue-600"
          isOpen={openSections.has("mentor")}
          onToggle={() => toggleSection("mentor")}
        >
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 md:p-7">
            <div className="text-sm md:text-base font-medium text-slate-800 leading-relaxed">
              {formatarTexto(relatorio.raciocinio_interno)}
            </div>
            {relatorio.faixa_salarial_alvo && (
              <div className="mt-4 inline-flex px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg w-max">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Alvo da Avaliação: <span className="text-slate-800">{relatorio.faixa_salarial_alvo}</span>
                </span>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* SEÇÃO 2: QUADRANTE DE EFICIÊNCIA */}
        {relatorio.perfil_quadrante && (
          <CollapsibleSection
            id="quadrante"
            title="Quadrante de Eficiência"
            icon={LayoutGrid}
            iconColor="text-blue-600"
            isOpen={openSections.has("quadrante")}
            onToggle={() => toggleSection("quadrante")}
          >
            <div className="bg-blue-50/50 border-2 border-blue-200 rounded-[2rem] p-6 md:p-10 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-blue-100">
                <span className="text-lg md:text-xl font-black uppercase text-blue-700 bg-blue-100/70 px-4 py-2 rounded-full border border-blue-200">
                  {relatorio.perfil_quadrante}
                </span>
              </div>
              <div className="text-sm md:text-base lg:text-lg font-bold text-slate-900 leading-relaxed mb-6 md:mb-8 max-w-3xl whitespace-pre-wrap">
                {formatarTexto(relatorio.diagnostico_eficiencia)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatorio.detalhamento_teoria && (
                  <div className="bg-white border-2 border-blue-100/70 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Roteiro Teórico Abordado</span>
                      <span className="text-xl font-black text-slate-900">
                        {relatorio.detalhamento_teoria.itens_vistos}
                        <span className="text-sm font-medium text-slate-500"> de {relatorio.detalhamento_teoria.itens_totais} tópicos essenciais</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {relatorio.detalhamento_questoes?.principais_lacunas_pontuacao?.length > 0 && (
                <div className="mt-6 bg-red-50/50 border border-red-100 rounded-2xl p-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} /> Onde você está a perder pontos estatísticos:
                  </span>
                  <ul className="space-y-2">
                    {relatorio.detalhamento_questoes.principais_lacunas_pontuacao.map((lacuna: string, i: number) => (
                      <li key={i} className="text-sm text-red-950 flex items-start gap-2">
                        <span className="text-red-400 shrink-0 mt-0.5">•</span>
                        {formatarTexto(lacuna)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* SEÇÃO 3: OMISSÕES DO ROTEIRO */}
        <CollapsibleSection
          id="omissoes"
          title="Omissões do Roteiro Técnico Ideal"
          icon={Activity}
          iconColor="text-amber-500"
          badge={relatorio.temas_nao_abordados?.length}
          isOpen={openSections.has("omissoes")}
          onToggle={() => toggleSection("omissoes")}
        >
          {relatorio.temas_nao_abordados && relatorio.temas_nao_abordados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatorio.temas_nao_abordados.map((item: any, i: number) => (
                <div key={i} className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <h3 className="text-sm font-black text-black flex items-start gap-2 mb-3 leading-tight">
                    <ChevronRight size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    {formatarTexto(item.tema)}
                  </h3>
                  <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {formatarTexto(item.resumo)}
                  </div>
                  <QuestaoCard questao={item.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                  <QuestaoCard questao={item.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
              <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-black text-emerald-800">Nenhuma omissão identificada.</p>
                <p className="text-xs font-medium text-emerald-600 mt-1">Você abordou todos os tópicos do roteiro técnico ideal.</p>
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* SEÇÃO 4: INCONSISTÊNCIAS CRÍTICAS */}
        {relatorio.erros_cometidos && relatorio.erros_cometidos.length > 0 && (
          <CollapsibleSection
            id="erros"
            title="Inconsistências Críticas"
            icon={AlertTriangle}
            iconColor="text-red-600"
            badge={relatorio.erros_cometidos.length}
            isOpen={openSections.has("erros")}
            onToggle={() => toggleSection("erros")}
          >
            <div className="grid grid-cols-1 gap-6">
              {relatorio.erros_cometidos.map((item: any, i: number) => (
                <div key={i} className="bg-white border-2 border-red-200 rounded-2xl overflow-hidden shadow-sm hover:border-red-300 transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-red-50 p-6 md:w-1/2 border-b-2 md:border-b-0 md:border-r-2 border-red-100 flex flex-col justify-center">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">O que você explicou (Erro)</span>
                      <div className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        "{formatarTexto(item.trecho_aluno || item.erro)}"
                      </div>
                    </div>
                    <div className="p-6 md:w-1/2 flex flex-col justify-center bg-white">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BrainCircuit size={12} /> Correção Técnica
                      </span>
                      <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {formatarTexto(item.correcao || item.resumo)}
                      </div>
                    </div>
                  </div>
                  {(item.questao_vinculada || item.questao_autoral) && (
                    <div className="px-6 pb-6">
                      <QuestaoCard questao={item.questao_vinculada} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} />
                      <QuestaoCard questao={item.questao_autoral} gabaritosRevelados={gabaritosRevelados} toggle={toggleGabarito} autoral bancaLabel={relatorio.banca_escolhida} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* SEÇÃO 5: ANATOMIA DA BANCA */}
        {relatorio.analise_banca && typeof relatorio.analise_banca === 'object' && (
          <CollapsibleSection
            id="banca"
            title="Anatomia da Banca"
            icon={Compass}
            iconColor="text-amber-600"
            isOpen={openSections.has("banca")}
            onToggle={() => toggleSection("banca")}
          >
            <div className="bg-amber-50/50 border-2 border-amber-200 rounded-[2rem] p-6 md:p-10 shadow-sm space-y-8">
              {relatorio.fingerprint_banca && (
                <div className="bg-white border-2 border-amber-100 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={15} className="text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">DNA da Banca</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {relatorio.fingerprint_banca.estilo_cobranca && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estilo:</span>
                        <span className="text-xs font-black text-white bg-amber-500 px-3 py-1 rounded-full capitalize">{relatorio.fingerprint_banca.estilo_cobranca}</span>
                      </div>
                    )}
                    {relatorio.fingerprint_banca.palavras_gatilho?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                          <Zap size={10} className="text-red-500" /> Gatilhos:
                        </span>
                        {relatorio.fingerprint_banca.palavras_gatilho.map((p: string, i: number) => (
                          <span key={i} className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Armadilhas que você evitou
                  </h3>
                  {Array.isArray(relatorio.analise_banca.maior_incidencia) && relatorio.analise_banca.maior_incidencia.length > 0 ? (
                    <ul className="space-y-2">
                      {relatorio.analise_banca.maior_incidencia.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Nenhuma armadilha evitada com precisão.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" /> Pegadinhas que você caiu
                  </h3>
                  {Array.isArray(relatorio.analise_banca.pegadinhas) && relatorio.analise_banca.pegadinhas.length > 0 ? (
                    <ul className="space-y-2">
                      {relatorio.analise_banca.pegadinhas.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Nenhuma pegadinha identificada.</p>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* SEÇÃO 6: ACERTOS E ROTEIRO DE ESTUDO */}
        <CollapsibleSection
          id="evolucao"
          title="Acertos e Como Evoluir"
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          isOpen={openSections.has("evolucao")}
          onToggle={() => toggleSection("evolucao")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" /> Acertos Consolidados
              </h3>
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 h-full">
                {relatorio.checklist_acertos?.map((item: string, i: number) => (
                  <div key={i} className="pb-3 mb-3 border-b border-emerald-100/50 last:border-0 last:mb-0 last:pb-0 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <div className="text-sm font-medium text-emerald-900 leading-relaxed">{formatarTexto(item)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-purple-500" /> Roteiro de Estudo
              </h3>
              <div className="space-y-3">
                {relatorio.plano_de_estudo?.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:border-purple-200 hover:shadow-md transition-all">
                    <div className="w-7 h-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                    <div>
                      <span className="text-sm font-black text-black block mb-1">{formatarTexto(item.titulo)}</span>
                      <div className="text-xs font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{formatarTexto(item.foco)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* SEÇÃO 7: CTA PRÓXIMA SESSÃO */}
        <section className="print:hidden">
          <div className="bg-slate-900 border-2 border-slate-900 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Próximo Passo</p>
            <h3 className="text-xl font-black mb-4">Continue sua jornada com uma nova sessão.</h3>
            <button onClick={() => router.push("/dashboard/modos")} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors">
              Nova Sessão <ChevronRight size={16} />
            </button>
            <button onClick={() => router.push("/dashboard")} className="w-full mt-3 py-2 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
              Ir para o Dashboard
            </button>
          </div>
        </section>

        {/* SEÇÃO 8: EXTRATO DA AULA */}
        <CollapsibleSection
          id="extrato"
          title="Extrato da sua Aula"
          icon={Sparkles}
          iconColor="text-slate-400"
          isOpen={openSections.has("extrato")}
          onToggle={() => toggleSection("extrato")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Edit3 size={14} /> Suas Anotações (Rascunho)
              </h3>
              <div className="bg-[#FFFDE7] p-5 rounded-xl border border-[#FFF59D] text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed print:border-black">
                {relatorio.anotacoes_manuais || "Nenhuma anotação."}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <Mic size={14} /> Transcrição Capturada
              </h3>
              <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 italic leading-relaxed whitespace-pre-wrap h-48 md:h-64 overflow-y-auto print:h-auto print:border-black custom-scrollbar">
                {relatorio.texto_transcrito || "Sem transcrição de áudio/texto."}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* PESQUISA DE SATISFAÇÃO */}
        <section className="print:hidden pb-12">
          <PesquisaSatisfacao relatorioId={relatorioId} />
        </section>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
