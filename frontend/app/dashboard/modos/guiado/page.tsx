// frontend/app/dashboard/modos/guiado/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft, ArrowRight, SkipForward,
  CheckCircle2, Circle, Clock, BrainCircuit, Loader2,
  Mic, MicOff, Type, AlertTriangle, ChevronRight, Camera, Info,
} from "lucide-react";
import { verificarRenovacaoSemanal, podeIniciarSessao, incrementarSessaoUsada, formatarDataRenovacao, PerfilUsuario } from "@/lib/premium";
import { ModalLimiteSessao } from "@/components/ModalLimiteSessao";

type Pergunta = {
  id: string;
  assunto_idx: number;
  assunto: string;
  fase: number;
  pergunta: string;
  dificuldade: "Básica" | "Média" | "Alta";
};

type Resposta = {
  id: string;
  assunto_idx: number;
  assunto: string;
  fase: number;
  pergunta: string;
  resposta_aluno: string;
  pulada: boolean;
};

const FASE_LABEL: Record<number, string> = {
  1: "Conceito Direto",
  2: "Comparação",
  3: "Aplicação",
  4: "Análise Crítica",
};

const DIFICULDADE_COLOR: Record<string, string> = {
  "Básica": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Média":  "text-amber-700 bg-amber-50 border-amber-200",
  "Alta":   "text-red-700 bg-red-50 border-red-200",
};

export default function ModoGuiadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const materia        = searchParams.get("materia")        || "Matéria Não Definida";
  const tema           = searchParams.get("tema")           || "Tema Não Definido";
  const jornada        = searchParams.get("jornada")        || "concurso";
  const banca          = searchParams.get("banca")          || "Livre";
  const faixaSalarial  = searchParams.get("faixa_salarial") || "";
  const personalizado  = searchParams.get("personalizado")  === "1";
  const prioridades    = searchParams.get("prioridades")?.split("|").filter(Boolean) ?? [];

  // Fases da tela
  const [tela, setTela] = useState<"carregando" | "sessao" | "finalizando">("carregando");
  const [erroConexao, setErroConexao] = useState("");

  // Perguntas e respostas
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [totalAssuntos, setTotalAssuntos] = useState(0);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);

  // Modo de resposta
  const [modo, setModo] = useState<"texto" | "audio">("audio");
  const [respostaAtual, setRespostaAtual] = useState("");
  const [transcricaoInterim, setTranscricaoInterim] = useState("");
  const [gravando, setGravando] = useState(false);

  // Câmera
  const [espelhoAtivo, setEspelhoAtivo] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const gravandoRef    = useRef(false);

  // Cronômetro
  const [segundos, setSegundos] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Loading de finalização
  const [progressoFinal, setProgressoFinal] = useState(0);

  // Premium / limite de sessões
  const [uid, setUid] = useState<string | null>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [modalLimite, setModalLimite] = useState(false);

  const perguntaAtual    = perguntas[indiceAtual] ?? null;
  const total            = perguntas.length;
  const assuntoAtualIdx  = perguntaAtual?.assunto_idx ?? 0;
  const faseAtual        = perguntaAtual?.fase ?? 1;
  const assuntoAtualNome = perguntaAtual?.assunto ?? "";

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

  // Carrega perguntas ao montar — AbortController evita duplo fetch no StrictMode
  useEffect(() => {
    const controller = new AbortController();
    const carregar = async () => {
      try {
        const res = await apiFetch("http://127.0.0.1:5000/api/gerar-perguntas-guiado", {
          method: "POST",
          body: JSON.stringify({
            jornada, materia, tema, faixa_salarial: faixaSalarial,
            ...(personalizado && prioridades.length > 0 ? { contexto_personalizado: prioridades } : {}),
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Falha ao carregar perguntas.");
        const data = await res.json();
        if (!data.perguntas?.length) throw new Error("Nenhuma pergunta gerada.");
        setPerguntas(data.perguntas);
        setTotalAssuntos(data.total_assuntos || 0);
        setTela("sessao");
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setErroConexao(err.message || "Erro ao conectar ao servidor.");
      }
    };
    carregar();
    return () => controller.abort();
  }, []);

  // Limpar câmera e recognition ao desmontar
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) {
        gravandoRef.current = false;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [mediaStream]);

  useEffect(() => {
    if (espelhoAtivo && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [espelhoAtivo, mediaStream]);

  // Cronômetro
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

  // ==========================================
  // CÂMERA (ESPELHO)
  // ==========================================
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

  // ==========================================
  // GRAVAÇÃO DE VOZ + TRANSCRIÇÃO
  // ==========================================
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

  // ==========================================
  // FLUXO DA SESSÃO
  // ==========================================
  const buildResposta = (pulada: boolean): Resposta => ({
    id:             perguntaAtual!.id,
    assunto_idx:    perguntaAtual!.assunto_idx,
    assunto:        perguntaAtual!.assunto,
    fase:           perguntaAtual!.fase,
    pergunta:       perguntaAtual!.pergunta,
    resposta_aluno: pulada ? "" : respostaAtual.trim(),
    pulada,
  });

  const finalizar = async (todasRespostas: Resposta[]) => {
    pararGravacao();
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    setTela("finalizando");
    try {
      const res = await apiFetch("http://127.0.0.1:5000/api/avaliar-sessao-guiada", {
        method: "POST",
        body: JSON.stringify({
          jornada, materia, tema, banca,
          faixa_salarial: faixaSalarial,
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
      router.push(`/dashboard/relatorio-guiado/${data.relatorio_id}`);
    } catch (err: any) {
      alert("Erro ao finalizar sessão: " + err.message);
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
    if (confirm("Deseja realmente abandonar esta sessão? O progresso não será guardado.")) {
      pararGravacao();
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      const qs = new URLSearchParams({ jornada, materia, tema, banca, faixa_salarial: faixaSalarial });
      router.push(`/dashboard/modos?${qs}`);
    }
  };

  const temResposta   = respostaAtual.trim().split(/\s+/).filter(Boolean).length >= 5;
  const podeAvancar   = temResposta || modo === "audio";
  const temTranscricao = respostaAtual.trim().length > 0;

  // Agrupa assuntos únicos para a sidebar
  const assuntosUnicos = Array.from(
    new Map(perguntas.map(p => [p.assunto_idx, p.assunto])).entries()
  ).map(([idx, nome]) => ({ idx, nome }));

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
                <p className="font-black text-black mb-2">Erro ao carregar sessão</p>
                <p className="text-sm font-bold text-slate-500">{erroConexao}</p>
              </div>
              <button onClick={handleAbandonar}
                className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Voltar
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <BrainCircuit size={28} className="text-purple-600 animate-pulse" />
              </div>
              <p className="font-black text-xs uppercase tracking-widest text-slate-600">Preparando sessão guiada...</p>
              <Loader2 size={18} className="animate-spin text-purple-400" />
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
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
              <BrainCircuit size={26} className="text-purple-600" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Avaliando Sessão</span>
                <span className="text-xs font-bold text-purple-600">{Math.round(progressoFinal)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div className="h-full bg-purple-600 rounded-full"
                  initial={{ width: "0%" }} animate={{ width: `${progressoFinal}%` }}
                  transition={{ ease: "easeInOut", duration: 1 }} />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 animate-pulse">
              {progressoFinal < 40 ? "Analisando profundidade das respostas..."
                : progressoFinal < 70 ? "Identificando acertos e lacunas..."
                : "Montando relatório personalizado..."}
            </p>
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

      {/* HEADER */}
      <header className="w-full px-4 md:px-8 py-4 border-b-2 border-black bg-white flex items-center justify-between gap-4 shrink-0 sticky top-0 z-20">
        <button onClick={handleAbandonar}
          className="bg-white border-2 border-black rounded-xl px-4 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all">
          <ArrowLeft size={14} /> Abandonar
        </button>

        <div className="flex-1 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">
            Assunto {assuntoAtualIdx + 1} de {totalAssuntos}
          </p>
          <h1 className="text-sm md:text-base font-black text-black truncate max-w-[60vw] mx-auto">{assuntoAtualNome}</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Fase {faseAtual} — {FASE_LABEL[faseAtual]} • {materia}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
          <Clock size={12} className="text-slate-500" />
          <span className="text-xs font-black text-slate-600 tabular-nums">{formatarTempo(segundos)}</span>
        </div>
      </header>

      {/* BARRA DE PROGRESSO */}
      <div className="w-full h-1.5 bg-slate-100">
        <motion.div className="h-full bg-purple-600"
          animate={{ width: `${(indiceAtual / total) * 100}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }} />
      </div>

      {/* BANNER — SESSÃO PERSONALIZADA */}
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
                className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    Fase {faseAtual} — {FASE_LABEL[faseAtual]}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-full ${DIFICULDADE_COLOR[perguntaAtual.dificuldade] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
                    {perguntaAtual.dificuldade}
                  </span>
                  <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">{assuntoAtualNome}</span>
                </div>
                <p className="text-lg md:text-xl font-black text-black leading-relaxed">{perguntaAtual.pergunta}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ÁREA DE RESPOSTA */}
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">

            {/* TABS — voz em destaque */}
            <div className="flex border-b-2 border-black shrink-0">
              <button onClick={() => setModo("audio")}
                className={`flex-[2] p-3.5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${modo === "audio" ? "bg-black text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                <Mic size={14} /> Voz — Análise Profunda
                {modo === "audio" && <span className="ml-1 text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Recomendado</span>}
              </button>
              <button onClick={() => { if (gravando) pararGravacao(); setModo("texto"); }}
                className={`flex-1 p-3.5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-l-2 border-black ${modo === "texto" ? "bg-black text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                <Type size={14} /> Texto
              </button>
            </div>

            {/* CONTEÚDO DO MODO */}
            {modo === "texto" ? (
              <div className="flex flex-col flex-1 min-h-[180px]">
                <div className="flex items-start gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2.5 shrink-0">
                  <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-800 leading-snug">
                    A explicação por voz gera uma análise cognitiva mais profunda e personalizada.
                  </p>
                </div>
                <textarea
                  value={respostaAtual}
                  onChange={e => setRespostaAtual(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  className="flex-1 p-6 outline-none resize-none font-medium text-sm text-slate-700 placeholder-slate-400 bg-white transition-colors custom-scrollbar"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center gap-4 p-6 overflow-y-auto custom-scrollbar">

                {/* CÂMERA */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <button onClick={toggleEspelho}
                    className={`border-2 border-black rounded-xl px-5 py-2 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none flex items-center gap-2 ${espelhoAtivo ? "bg-blue-100 text-blue-800" : "bg-white text-slate-700"}`}>
                    <Camera size={13} /> {espelhoAtivo ? "Desligar Câmera" : "Ligar Câmera (Espelho)"}
                  </button>

                  {/* AVISO: sem gravação de vídeo */}
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

                {/* TRANSCRIÇÃO ACUMULADA */}
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

                {/* BOTÃO GRAVAR / PARAR */}
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
                className={`ml-auto flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all ${(podeAvancar)
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"}`}>
                {indiceAtual < total - 1
                  ? <><ArrowRight size={13} /> Avançar</>
                  : <><CheckCircle2 size={13} /> Finalizar</>}
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL — PROGRESSO POR ASSUNTO */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
              <BrainCircuit size={15} className="text-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Progresso</span>
            </div>

            <ul className="space-y-3">
              {assuntosUnicos.map(({ idx, nome }) => {
                const respostasDoAssunto = respostas.filter(r => r.assunto_idx === idx && !r.pulada);
                const pulasDoAssunto     = respostas.filter(r => r.assunto_idx === idx && r.pulada);
                const concluido          = respostasDoAssunto.length + pulasDoAssunto.length === 4;
                const isCurrent          = idx === assuntoAtualIdx;
                const iniciado           = respostas.some(r => r.assunto_idx === idx);

                return (
                  <li key={idx}
                    className={`p-3 rounded-xl border transition-all ${isCurrent ? "border-purple-400 bg-purple-50" : concluido ? "border-slate-200 bg-slate-50 opacity-60" : "border-transparent"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="shrink-0">
                        {concluido ? <CheckCircle2 size={14} className="text-emerald-500" />
                          : isCurrent ? <ChevronRight size={14} className="text-purple-600" />
                          : <Circle size={14} className="text-slate-300" />}
                      </div>
                      <p className={`text-[10px] font-black truncate flex-1 ${isCurrent ? "text-purple-700" : "text-slate-600"}`}>{nome}</p>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">{respostasDoAssunto.length + pulasDoAssunto.length}/4</span>
                    </div>
                    {(isCurrent || iniciado) && (
                      <div className="flex gap-1 ml-5">
                        {[1, 2, 3, 4].map(f => {
                          const respondida = respostas.find(r => r.assunto_idx === idx && r.fase === f);
                          const isCurrentFase = isCurrent && faseAtual === f;
                          return (
                            <div key={f}
                              className={`flex-1 h-1.5 rounded-full transition-all ${respondida && !respondida.pulada ? "bg-emerald-400" : respondida?.pulada ? "bg-amber-300" : isCurrentFase ? "bg-purple-400" : "bg-slate-200"}`} />
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assuntos concluídos</span>
              <span className="text-sm font-black text-slate-800">
                {assuntosUnicos.filter(({ idx }) => respostas.filter(r => r.assunto_idx === idx).length === 4).length} / {totalAssuntos}
              </span>
            </div>
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
  return (
    <header className="w-full px-4 md:px-8 py-4 border-b-2 border-black bg-white flex items-center justify-between gap-4 shrink-0 sticky top-0 z-20">
      <button onClick={onAbandonar}
        className="bg-white border-2 border-black rounded-xl px-4 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
        <ArrowLeft size={14} /> Abandonar
      </button>
      <div className="text-center">
        <p className="text-xs font-black text-slate-800">Modo Guiado</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subtitulo}</p>
      </div>
      <div className="w-24" />
    </header>
  );
}
