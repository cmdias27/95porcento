// frontend/app/dashboard/modos/simulado/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft, ArrowRight, SkipForward, CheckCircle2, Circle, Clock,
  Target, Loader2, Mic, MicOff, Type, AlertTriangle, ChevronRight,
  Camera, Info, BookOpen, X,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { verificarRenovacaoSemanal, podeIniciarSessao, incrementarSessaoUsada, formatarDataRenovacao, PerfilUsuario } from "@/lib/premium";
import { ModalLimiteSessao } from "@/components/ModalLimiteSessao";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Cenario = {
  titulo: string;
  descricao: string;
  complexidade: "Inicial" | "Intermediário" | "Elite";
};

type Pergunta = {
  id: string;
  fase: number;
  objetivo: string;
  pergunta: string;
};

type Resposta = {
  id: string;
  fase: number;
  objetivo: string;
  pergunta: string;
  resposta_aluno: string;
  pulada: boolean;
};

const COMPLEXIDADE_CONFIG: Record<string, { cor: string }> = {
  "Inicial":       { cor: "text-emerald-700 bg-emerald-50 border-emerald-300" },
  "Intermediário": { cor: "text-amber-700 bg-amber-50 border-amber-300" },
  "Elite":         { cor: "text-red-700 bg-red-50 border-red-300" },
};

function ModoSimuladoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const materia       = searchParams.get("materia")        || "Matéria Não Definida";
  const tema          = searchParams.get("tema")           || "Tema Não Definido";
  const jornada       = searchParams.get("jornada")        || "concurso";
  const banca         = searchParams.get("banca")          || "Livre";
  const faixaSalarial = searchParams.get("faixa_salarial") || "";
  const personalizado = searchParams.get("personalizado")  === "1";
  const prioridades   = searchParams.get("prioridades")?.split("|").filter(Boolean) ?? [];

  const [tela, setTela] = useState<"carregando" | "cenario" | "sessao" | "finalizando">("carregando");
  const [erroConexao, setErroConexao] = useState("");

  const [cenario, setCenario] = useState<Cenario | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [showCenario, setShowCenario] = useState(false);

  const [modo, setModo] = useState<"texto" | "audio">("texto");
  const [respostaAtual, setRespostaAtual] = useState("");
  const [transcricaoInterim, setTranscricaoInterim] = useState("");
  const [gravando, setGravando] = useState(false);

  const [espelhoAtivo, setEspelhoAtivo] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const gravandoRef = useRef(false);

  const [segundos, setSegundos] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [progressoFinal, setProgressoFinal] = useState(0);

  // Premium / limite de sessões
  const [uid, setUid] = useState<string | null>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [modalLimite, setModalLimite] = useState(false);

  const perguntaAtual = perguntas[indiceAtual] ?? null;
  const total = perguntas.length;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    verificarRenovacaoSemanal(uid).then((perfil) => {
      setPerfilUsuario(perfil);
      if (!podeIniciarSessao(perfil)) setModalLimite(true);
    });
  }, [uid]);

  // Carrega cenário ao montar — AbortController evita duplo fetch no StrictMode
  useEffect(() => {
    const controller = new AbortController();
    const carregar = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/gerar-cenario-simulado`, {
          method: "POST",
          body: JSON.stringify({
            jornada, materia, tema, faixa_salarial: faixaSalarial,
            ...(personalizado && prioridades.length > 0 ? { contexto_personalizado: prioridades } : {}),
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Falha ao carregar cenário.");
        const data = await res.json();
        if (!data.cenario?.titulo) throw new Error("Cenário não gerado.");
        setCenario(data.cenario);
        setPerguntas(data.perguntas || []);
        setTela("cenario");
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setErroConexao(err.message || "Erro ao conectar ao servidor.");
      }
    };
    carregar();
    return () => controller.abort();
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) {
        gravandoRef.current = false;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [mediaStream]);

  useEffect(() => {
    if (espelhoAtivo && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [espelhoAtivo, mediaStream]);

  // Cronômetro — só corre durante sessão
  useEffect(() => {
    if (tela !== "sessao") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tela]);

  // Barra de progresso de finalização
  useEffect(() => {
    if (tela !== "finalizando") return;
    setProgressoFinal(0);
    const iv = setInterval(() => {
      setProgressoFinal(p => {
        if (p >= 95) return 95;
        const inc = p < 50 ? Math.random() * 4 + 2 : Math.random() * 2 + 1;
        return Math.min(95, p + inc);
      });
    }, 800);
    return () => clearInterval(iv);
  }, [tela]);

  // Limpar resposta ao trocar de pergunta
  useEffect(() => {
    setRespostaAtual("");
    setTranscricaoInterim("");
    if (gravandoRef.current) pararGravacao();
  }, [indiceAtual]);

  const formatarTempo = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Câmera espelho
  const toggleEspelho = async () => {
    if (espelhoAtivo) {
      if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); setMediaStream(null); }
      setEspelhoAtivo(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaStream(stream);
        setEspelhoAtivo(true);
      } catch {
        alert("Não foi possível aceder à câmara. Verifique as permissões do navegador.");
      }
    }
  };

  // Gravação de voz
  const iniciarGravacao = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Reconhecimento de voz não suportado. Use Google Chrome ou Microsoft Edge.");
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          setRespostaAtual(prev => prev + t + " ");
          setTranscricaoInterim("");
        } else {
          interim += t;
        }
      }
      setTranscricaoInterim(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") pararGravacao();
    };

    recognition.onend = () => {
      if (gravandoRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    gravandoRef.current = true;
    setGravando(true);
    setTranscricaoInterim("");
  };

  const pararGravacao = () => {
    gravandoRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setGravando(false);
    setTranscricaoInterim("");
  };

  // Fluxo da sessão
  const buildResposta = (pulada: boolean): Resposta => ({
    id:             perguntaAtual!.id,
    fase:           perguntaAtual!.fase,
    objetivo:       perguntaAtual!.objetivo,
    pergunta:       perguntaAtual!.pergunta,
    resposta_aluno: pulada ? "" : respostaAtual.trim(),
    pulada,
  });

  const finalizar = async (todasRespostas: Resposta[]) => {
    pararGravacao();
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    setTela("finalizando");
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/avaliar-sessao-simulada`, {
        method: "POST",
        body: JSON.stringify({
          jornada, materia, tema, banca,
          faixa_salarial: faixaSalarial,
          cenario,
          perguntas_respostas: todasRespostas,
          ...(personalizado && prioridades.length > 0 ? { contexto_personalizado: prioridades } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.erro || "Falha na avaliação.");
      }
      const data = await res.json();
      await incrementarSessaoUsada(uid ?? "").catch(() => {});
      router.push(`/dashboard/relatorio-simulado/${data.relatorio_id}`);
    } catch (err: any) {
      alert("Erro ao finalizar simulação: " + err.message);
      setTela("sessao");
    }
  };

  const avancar = () => {
    if (!perguntaAtual) return;
    if (gravando) pararGravacao();
    const novaResposta = buildResposta(false);
    const updatedRespostas = [...respostas.filter(r => r.id !== novaResposta.id), novaResposta];
    if (indiceAtual < total - 1) {
      setRespostas(updatedRespostas);
      setIndiceAtual(i => i + 1);
    } else {
      finalizar(updatedRespostas);
    }
  };

  const pular = () => {
    if (!perguntaAtual) return;
    if (gravando) pararGravacao();
    const novaResposta = buildResposta(true);
    const updatedRespostas = [...respostas.filter(r => r.id !== novaResposta.id), novaResposta];
    if (indiceAtual < total - 1) {
      setRespostas(updatedRespostas);
      setIndiceAtual(i => i + 1);
    } else {
      finalizar(updatedRespostas);
    }
  };

  const handleAbandonar = () => {
    if (tela === "carregando" || confirm("Deseja realmente abandonar esta simulação? O progresso não será guardado.")) {
      pararGravacao();
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      const qs = new URLSearchParams({ jornada, materia, tema, banca, faixa_salarial: faixaSalarial });
      router.push(`/dashboard/modos?${qs}`);
    }
  };

  const temResposta    = respostaAtual.trim().split(/\s+/).filter(Boolean).length >= 5;
  const temTranscricao = respostaAtual.trim().length > 0;
  const podeAvancar    = temResposta || modo === "audio";

  // ─── TELA DE CARREGAMENTO ───────────────────────────────────────
  if (tela === "carregando") {
    return (
      <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col">
        <SimpleHeader onAbandonar={handleAbandonar} subtitulo={`${materia} • ${tema}`} />
        <ModalLimiteSessao
          aberto={modalLimite}
          onFechar={() => { setModalLimite(false); router.push("/dashboard"); }}
          renovacaoEm={perfilUsuario ? formatarDataRenovacao(perfilUsuario.ultima_renovacao_sessoes) : undefined}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          {erroConexao ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-10 max-w-md w-full flex flex-col items-center gap-6 text-center">
              <AlertTriangle size={32} className="text-red-500" />
              <div>
                <p className="font-black text-black mb-2">Erro ao carregar simulação</p>
                <p className="text-sm font-bold text-slate-500">{erroConexao}</p>
              </div>
              <button onClick={handleAbandonar}
                className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Voltar
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Target size={28} className="text-amber-600 animate-pulse" />
              </div>
              <p className="font-black text-xs uppercase tracking-widest text-slate-600">Gerando cenário de simulação...</p>
              <Loader2 size={18} className="animate-spin text-amber-400" />
            </motion.div>
          )}
        </main>
      </div>
    );
  }

  // ─── TELA DE FINALIZAÇÃO ────────────────────────────────────────
  if (tela === "finalizando") {
    return (
      <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col">
        <SimpleHeader onAbandonar={() => {}} subtitulo={`${materia} • ${tema}`} />
        <main className="flex-1 flex items-center justify-center p-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-10 max-w-sm w-full flex flex-col items-center gap-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Target size={26} className="text-amber-600" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Avaliando Simulação</span>
                <span className="text-xs font-bold text-amber-600">{Math.round(progressoFinal)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div className="h-full bg-amber-500 rounded-full"
                  initial={{ width: "0%" }} animate={{ width: `${progressoFinal}%` }}
                  transition={{ ease: "easeInOut", duration: 1 }} />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 animate-pulse">
              {progressoFinal < 40 ? "Analisando as respostas ao cenário..."
                : progressoFinal < 70 ? "Avaliando raciocínio e argumentação..."
                : "Montando diagnóstico cognitivo..."}
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── TELA DO CENÁRIO ────────────────────────────────────────────
  if (tela === "cenario" && cenario) {
    const complexCfg = COMPLEXIDADE_CONFIG[cenario.complexidade] ?? COMPLEXIDADE_CONFIG["Inicial"];
    return (
      <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col">
        <SimpleHeader onAbandonar={handleAbandonar} subtitulo={`${materia} • ${tema}`} />
        <ModalLimiteSessao
          aberto={modalLimite}
          onFechar={() => { setModalLimite(false); router.push("/dashboard"); }}
          renovacaoEm={perfilUsuario ? formatarDataRenovacao(perfilUsuario.ultima_renovacao_sessoes) : undefined}
        />
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl flex flex-col gap-6">

            {/* Identificação do modo */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" }}>
                <Target size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Modo Simulado</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{materia} • {tema}</p>
              </div>
            </div>

            {/* Card do cenário */}
            <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

              <div className="bg-amber-50 border-b-2 border-black px-6 md:px-8 py-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-amber-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Cenário do Caso</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-black leading-tight">{cenario.titulo}</h2>
                </div>
                <span className={`shrink-0 mt-1 text-[9px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-full ${complexCfg.cor}`}>
                  {cenario.complexidade}
                </span>
              </div>

              <div className="px-6 md:px-8 py-6">
                <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                  {cenario.descricao}
                </p>
              </div>

              <div className="px-6 md:px-8 py-4 border-t-2 border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Você responderá</span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {perguntas.length} perguntas progressivas
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">sobre este cenário</span>
              </div>
            </div>

            {/* Botão iniciar */}
            <button onClick={() => setTela("sessao")}
              className="w-full py-4 bg-black text-white font-black text-[11px] uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2">
              <Target size={15} /> Iniciar Simulação
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── SESSÃO PRINCIPAL ───────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 font-sans flex flex-col overflow-x-hidden">

      <ModalLimiteSessao
        aberto={modalLimite}
        onFechar={() => { setModalLimite(false); router.push("/dashboard"); }}
        renovacaoEm={perfilUsuario ? formatarDataRenovacao(perfilUsuario.ultima_renovacao_sessoes) : undefined}
      />

      {/* MODAL REVISAR CENÁRIO */}
      <AnimatePresence>
        {showCenario && cenario && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCenario(false)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border-2 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-amber-50 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-700">Cenário do Caso</span>
                </div>
                <button onClick={() => setShowCenario(false)}
                  className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                  <X size={16} className="text-amber-700" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h3 className="text-lg font-black text-black mb-4">{cenario.titulo}</h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{cenario.descricao}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppHeader
        variant="session"
        tema={perguntaAtual?.objetivo ?? "Modo Simulado"}
        subtitulo={`Fase ${perguntaAtual?.fase ?? 1} de ${total} • ${materia}`}
        onAbandonar={handleAbandonar}
        timer={
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
            <Clock size={12} className="text-slate-500" />
            <span className="text-xs font-black text-slate-600 tabular-nums">{formatarTempo(segundos)}</span>
          </div>
        }
      />

      {/* BARRA DE PROGRESSO */}
      <div className="w-full h-1.5 bg-slate-100">
        <motion.div className="h-full bg-amber-500"
          animate={{ width: `${(indiceAtual / total) * 100}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }} />
      </div>

      {personalizado && prioridades.length > 0 && (
        <div className="w-full bg-slate-900 px-4 md:px-8 py-2.5 flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 shrink-0">Sessão Personalizada</span>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {prioridades.map(t => (
              <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6">

        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* CARD DA PERGUNTA */}
          <AnimatePresence mode="wait">
            {perguntaAtual && (
              <motion.div key={perguntaAtual.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
                className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-amber-50 border-b-2 border-black px-6 md:px-8 py-4 flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-white border border-amber-200 px-3 py-1 rounded-full">
                    Fase {perguntaAtual.fase} — {perguntaAtual.objetivo}
                  </span>
                  <button onClick={() => setShowCenario(true)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-700 transition-colors border border-slate-200 hover:border-amber-300 bg-white px-3 py-1.5 rounded-lg">
                    <BookOpen size={11} /> Revisar Cenário
                  </button>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-lg md:text-xl font-black text-black leading-relaxed">{perguntaAtual.pergunta}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ÁREA DE RESPOSTA */}
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">

            {/* TABS */}
            <div className="flex border-b-2 border-black shrink-0">
              <button onClick={() => { if (gravando) pararGravacao(); setModo("texto"); }}
                className={`flex-1 p-3.5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${modo === "texto" ? "bg-black text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                <Type size={14} /> Texto
              </button>
              <button onClick={() => setModo("audio")}
                className={`flex-1 p-3.5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-l-2 border-black ${modo === "audio" ? "bg-black text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                <Mic size={14} /> Áudio
              </button>
            </div>

            {/* CONTEÚDO DO MODO */}
            {modo === "texto" ? (
              <textarea
                value={respostaAtual}
                onChange={e => setRespostaAtual(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="flex-1 min-h-[180px] p-6 outline-none resize-none font-medium text-sm text-slate-700 placeholder-slate-400 bg-white transition-colors custom-scrollbar"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center gap-4 p-6 overflow-y-auto custom-scrollbar">

                {/* CÂMERA */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <button onClick={toggleEspelho}
                    className={`border-2 border-black rounded-xl px-5 py-2 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none flex items-center gap-2 ${espelhoAtivo ? "bg-blue-100 text-blue-800" : "bg-white text-slate-700"}`}>
                    <Camera size={13} /> {espelhoAtivo ? "Desligar Câmera" : "Ligar Câmera (Espelho)"}
                  </button>
                  {espelhoAtivo && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                      <Info size={11} className="text-blue-500 shrink-0" />
                      <p className="text-[9px] font-bold text-blue-700 leading-tight">
                        Câmera usada apenas como espelho para apoiar sua explicação — nenhum vídeo é gravado.
                      </p>
                    </div>
                  )}
                </div>

                {/* VIDEO / MIC */}
                <div className={`transition-all duration-500 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${espelhoAtivo ? "w-36 h-36 border-4 border-black shadow-lg bg-black" : "w-16 h-16"} ${gravando && !espelhoAtivo ? "bg-red-100 animate-pulse" : "bg-slate-100"} ${gravando && espelhoAtivo ? "border-red-500 animate-pulse" : ""}`}>
                  {espelhoAtivo
                    ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    : <Mic size={28} className={gravando ? "text-red-600" : "text-slate-400"} />}
                </div>

                {/* STATUS */}
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  {gravando ? "Gravando — fale sua resposta..." : temTranscricao ? "Gravação concluída — revise ou avance" : "Clique em Gravar para iniciar"}
                </p>

                {/* TRANSCRIÇÃO */}
                {temTranscricao && (
                  <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 max-h-36 overflow-y-auto custom-scrollbar">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Transcrição</p>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{respostaAtual}</p>
                    {transcricaoInterim && (
                      <p className="text-xs font-medium text-slate-400 italic mt-1">{transcricaoInterim}</p>
                    )}
                  </div>
                )}
                {!temTranscricao && transcricaoInterim && (
                  <div className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3">
                    <p className="text-xs font-medium text-slate-400 italic">{transcricaoInterim}</p>
                  </div>
                )}

                {/* BOTÃO GRAVAR */}
                <button
                  onClick={gravando ? pararGravacao : iniciarGravacao}
                  className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none ${gravando ? "bg-red-600 text-white border-red-600" : "bg-white text-black border-black"}`}>
                  {gravando ? <><MicOff size={14} /> Parar</> : <><Mic size={14} /> Gravar</>}
                </button>
              </div>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div className="p-4 border-t-2 border-black bg-white flex items-center gap-3">
              <button onClick={pular}
                className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-2 border-slate-300 rounded-xl hover:border-black hover:text-black transition-all">
                <SkipForward size={13} /> Pular
              </button>

              <button onClick={avancar}
                disabled={modo === "texto" && !temResposta}
                className={`ml-auto flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all ${podeAvancar
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"}`}>
                {indiceAtual < total - 1
                  ? <><ArrowRight size={13} /> Avançar</>
                  : <><CheckCircle2 size={13} /> Finalizar</>}
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL — PROGRESSO */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <Target size={15} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Progresso</span>
            </div>

            <ul className="space-y-2">
              {perguntas.map((p, i) => {
                const respondida = respostas.find(r => r.id === p.id);
                const isCurrent  = i === indiceAtual;
                return (
                  <li key={p.id}
                    className={`p-3 rounded-xl border transition-all ${isCurrent ? "border-amber-400 bg-amber-50" : respondida ? "border-slate-200 bg-slate-50 opacity-60" : "border-transparent"}`}>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        {respondida && !respondida.pulada ? <CheckCircle2 size={14} className="text-emerald-500" />
                          : respondida?.pulada ? <SkipForward size={14} className="text-amber-400" />
                          : isCurrent ? <ChevronRight size={14} className="text-amber-600" />
                          : <Circle size={14} className="text-slate-300" />}
                      </div>
                      <p className={`text-[10px] font-black truncate flex-1 ${isCurrent ? "text-amber-700" : "text-slate-600"}`}>
                        Fase {p.fase} — {p.objetivo}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Link para o cenário */}
            {cenario && (
              <div className="pt-3 border-t-2 border-slate-100">
                <button onClick={() => setShowCenario(true)}
                  className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 hover:bg-amber-100 transition-colors text-left">
                  <BookOpen size={13} className="text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Cenário</p>
                    <p className="text-[10px] font-bold text-amber-800 truncate">{cenario.titulo}</p>
                  </div>
                  <ChevronRight size={12} className="text-amber-500 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function SimpleHeader({ onAbandonar, subtitulo }: { onAbandonar: () => void; subtitulo: string }) {
  return <AppHeader variant="session" tema="Modo Simulado" subtitulo={subtitulo} onAbandonar={onAbandonar} />;
}

import { Suspense } from "react";

export default function ModoSimuladoPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ModoSimuladoContent />
    </Suspense>
  );
}
