// frontend/app/dashboard/auditorio/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Type, Camera, PenTool, Loader2, Play, CheckCircle2, Circle, ChevronRight, Zap, Info, MicOff } from "lucide-react";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/apiFetch";
import { onAuthStateChanged } from "firebase/auth";
import {
  verificarRenovacaoSemanal, podeIniciarSessao,
  incrementarSessaoUsada, formatarDataRenovacao,
  type PerfilUsuario,
} from "@/lib/premium";
import { ModalLimiteSessao } from "@/components/ModalLimiteSessao";

function AuditorioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parâmetros da URL
  const materia       = searchParams.get('materia')        || "Matéria Não Definida";
  const tema          = searchParams.get('tema')           || "Tema Não Definido";
  const jornada       = searchParams.get('jornada')        || "concurso";
  const banca         = searchParams.get('banca')          || "Livre";
  const faixaSalarial = searchParams.get('faixa_salarial') || "R$ 5.000 a R$ 15.000";
  const personalizado = searchParams.get("personalizado")  === "1";
  const prioridades   = searchParams.get("prioridades")?.split("|").filter(Boolean) ?? [];

  // UID do usuário autenticado (resolvido de forma reativa)
  const [uid, setUid] = useState<string>("");
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [modalLimite, setModalLimite]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUid(u?.uid ?? ""));
    return () => unsub();
  }, []);

  // Verifica limite semanal quando o uid estiver disponível
  useEffect(() => {
    if (!uid) return;
    verificarRenovacaoSemanal(uid).then((perfil) => {
      setPerfilUsuario(perfil);
      if (!podeIniciarSessao(perfil)) setModalLimite(true);
    });
  }, [uid]);

  // Estados de Interface
  const [modo, setModo] = useState<'audio' | 'texto'>('audio');
  const [espelhoAtivo, setEspelhoAtivo] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [textoExplicacao, setTextoExplicacao] = useState("");
  const [transcricaoInterim, setTranscricaoInterim] = useState("");

  // Estados Lógicos (Checklist de Tópicos)
  const [extraindo, setExtraindo] = useState(true);
  const [topicos, setTopicos] = useState<string[]>([]);
  const [topicosMarcados, setTopicosMarcados] = useState<Record<number, boolean>>({});
  const [nivelElite, setNivelElite] = useState(false);
  const [gravando, setGravando] = useState(false);

  // Estado que controla o ecrã de Loading central
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Referências para Câmera e SpeechRecognition
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const gravandoRef = useRef(false);

  // Detectar nível com base na faixa salarial
  const faixaLower = faixaSalarial.toLowerCase();
  const isNivelElite = faixaLower.includes("elite");
  const isNivelIntermediario = !isNivelElite && faixaLower.includes("intermediar");

  // ==========================================
  // GERAÇÃO DE CHECKLIST VIA IA
  // ==========================================
  useEffect(() => {
    const gerarChecklist = async () => {
      if (!materia || !tema || materia === "Matéria Não Definida") {
        setTopicos(["Selecione uma matéria e tema para gerar o roteiro."]);
        setExtraindo(false);
        return;
      }
      try {
        const response = await apiFetch("http://127.0.0.1:5000/api/gerar-checklist", {
          method: "POST",
          body: JSON.stringify({
            jornada,
            materia,
            tema,
            faixa_salarial: faixaSalarial,
            ...(personalizado && prioridades.length > 0 ? { contexto_personalizado: prioridades } : {}),
          }),
        });
        if (!response.ok) throw new Error("Falha ao gerar checklist.");
        const data = await response.json();
        if (data.nivel_elite) { setNivelElite(true); setTopicos([]); }
        else { setNivelElite(false); setTopicos(data.topicos || []); }
      } catch (error) {
        console.warn("Checklist não gerado.", error);
        setTopicos(["Erro ao gerar checklist. Verifique a conexão."]);
      } finally {
        setExtraindo(false);
      }
    };
    gerarChecklist();
  }, [jornada, materia, tema, faixaSalarial]);

  // Limpar câmera e reconhecimento ao desmontar
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) {
        gravandoRef.current = false;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [mediaStream]);

  useEffect(() => {
    if (espelhoAtivo && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [espelhoAtivo, mediaStream]);

  // ==========================================
  // BARRA DE PROGRESSO NÃO-LINEAR
  // ==========================================
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (processando) {
      setProgresso(0);
      intervalo = setInterval(() => {
        setProgresso((old) => {
          if (old >= 95) return 95;
          let incremento = old < 45 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1;
          return old + incremento > 95 ? 95 : old + incremento;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [processando]);

  const getLoadingText = () => {
    if (progresso < 45) return "A organizar a sua exposição e a extrair conceitos-chave...";
    if (progresso < 70) return "A calcular o Score de Teoria com base no Checklist...";
    if (progresso < 85) return `A cruzar a sua precisão com o padrão estatístico da Banca ${banca}...`;
    if (progresso < 95) return `A aplicar as métricas de rigor para a faixa de ${faixaSalarial}...`;
    return "A consolidar as Notas e a definir o seu Quadrante de Eficiência...";
  };

  const toggleTopico = (idx: number) => {
    setTopicosMarcados(prev => ({ ...prev, [idx]: !prev[idx] }));
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
          setTextoExplicacao(prev => prev + t + " ");
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

    // Auto-reinicia quando o browser encerra automaticamente
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

  const handleAbandonar = () => {
    if (confirm("Deseja realmente abandonar a sessão? O progresso não será guardado.")) {
      pararGravacao();
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      router.push('/dashboard');
    }
  };

  // ==========================================
  // ENVIO PARA AUDITORIA
  // ==========================================
  const enviarTextoParaAuditoria = async () => {
    if (!textoExplicacao || textoExplicacao.trim().length < 10) {
      alert("Por favor, grave ou digite um conteúdo para análise.");
      return;
    }
    setProcessando(true);
    try {
      const payload = {
        jornada: searchParams.get("jornada") || "Concurso",
        materia: searchParams.get("materia") || "",
        tema: searchParams.get("tema") || "",
        banca: searchParams.get("banca") || "Livre",
        faixa_salarial: searchParams.get("faixa_salarial") || "",
        texto_aula: textoExplicacao,
        anotacoes_manuais: rascunho,
        ...(personalizado && prioridades.length > 0 ? { contexto_personalizado: prioridades } : {}),
      };
      const response = await apiFetch("http://127.0.0.1:5000/api/processar-texto", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || "Falha na auditoria.");
      }
      const data = await response.json();
      // Incrementa contagem de sessão após sucesso
      if (uid) await incrementarSessaoUsada(uid).catch(() => {});
      router.push(`/dashboard/relatorio/${data.relatorio_id}`);
    } catch (error: any) {
      alert("Erro na Auditoria: " + error.message);
      setProcessando(false);
    }
  };

  // ==========================================
  // RENDER DO CHECKLIST
  // ==========================================
  const renderChecklist = () => {
    if (extraindo) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest text-center">A gerar checklist com IA...</span>
        </div>
      );
    }
    if (nivelElite || isNivelElite) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="w-full bg-black rounded-2xl border border-white/10 p-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
              <Zap size={22} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400 mb-2">Nível Elite</p>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">
                Sem guia. Demonstre domínio completo do tema utilizando apenas seu conhecimento.
              </p>
            </div>
          </motion.div>
        </div>
      );
    }
    return (
      <>
        {personalizado && prioridades.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-700 mb-2 flex items-center gap-1.5">
              <Zap size={11} /> Atenção Especial
            </p>
            <ul className="space-y-1.5">
              {prioridades.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] font-bold text-blue-800">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="space-y-2">
          {topicos.map((topico, idx) => {
            const isSubtopico = topico.startsWith("→ ");
            const textoLimpo = isSubtopico ? topico.slice(2) : topico;
            const isMarcado = topicosMarcados[idx];
            return (
              <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                key={idx} onClick={() => toggleTopico(idx)}
                className={`flex gap-2 items-start cursor-pointer transition-all rounded-xl border-2 ${isSubtopico ? "ml-5 p-2" : "p-3"} ${isMarcado ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50"}`}>
                <div className="shrink-0 mt-0.5">
                  {isSubtopico
                    ? (isMarcado ? <CheckCircle2 size={12} className="text-emerald-500" /> : <ChevronRight size={12} className="text-slate-300" />)
                    : (isMarcado ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-300" />)}
                </div>
                <p className={`leading-relaxed transition-all ${isSubtopico ? "text-[10px] font-bold" : "text-[11px] font-bold"} ${isMarcado ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {textoLimpo}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </>
    );
  };

  const checklistTitulo = isNivelElite || nivelElite ? "Modo Elite" : isNivelIntermediario ? "Tópicos-Guia" : "Checklist Detalhado";
  const checklistSubtitulo = isNivelElite || nivelElite ? "Sem guia de tópicos" : "Marque o que já explicou";

  // Lógica do botão principal no modo áudio
  const temTranscricao = textoExplicacao.trim().length > 0;
  const botaoAudioClick = gravando ? pararGravacao : temTranscricao ? enviarTextoParaAuditoria : iniciarGravacao;
  const botaoAudioLabel = gravando ? "PARAR AULA" : temTranscricao ? "ENVIAR AULA" : "INICIAR AULA";
  const botaoAudioCor   = gravando ? "bg-red-600 text-white" : "bg-black text-white";

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 font-sans flex flex-col overflow-x-hidden overflow-y-auto">

      <ModalLimiteSessao
        aberto={modalLimite}
        onFechar={() => setModalLimite(false)}
        renovacaoEm={perfilUsuario ? formatarDataRenovacao(perfilUsuario.ultima_renovacao_sessoes) : undefined}
      />

      <header className="w-full px-4 md:px-8 py-4 md:py-5 border-b-2 border-black bg-white flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-20 sticky top-0">
        <button onClick={handleAbandonar}
          className="w-full md:w-auto bg-white border-2 border-black rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all">
          <ArrowLeft size={16} /> Abandonar
        </button>
        <div className="text-center md:text-right w-full md:w-auto">
          <h1 className="text-base md:text-xl font-black text-black truncate max-w-[90vw] md:max-w-lg mx-auto md:mx-0">{tema}</h1>
          <h2 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
            {materia} • Banca: <span className="text-blue-600">{banca}</span> • Alvo: <span className="text-purple-600">{faixaSalarial}</span>
          </h2>
        </div>
      </header>

      {/* MAIN GRID - COCKPIT */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

        {/* COLUNA 1 (ESQUERDA): CHECKLIST */}
        <div className="order-2 lg:order-1 lg:col-span-3 bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[350px] lg:h-[calc(100vh-140px)] overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-slate-50 text-center shrink-0">
            <h3 className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-800">{checklistTitulo}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">{checklistSubtitulo}</p>
          </div>
          <div className={`p-4 flex-1 overflow-y-auto custom-scrollbar ${(nivelElite || isNivelElite) ? "bg-black" : "bg-white"}`}>
            {renderChecklist()}
          </div>
        </div>

        {/* COLUNA 2 (CENTRO): AÇÃO PRINCIPAL */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col h-auto lg:h-[calc(100vh-140px)]">
          <div className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden flex-1">
            {processando ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                <div className="w-full max-w-sm mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">A Avaliar Desempenho</h2>
                    <span className="text-xs font-bold text-blue-600">{progresso}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                    <motion.div className="h-full bg-blue-600 rounded-full relative"
                      initial={{ width: "0%" }} animate={{ width: `${progresso}%` }}
                      transition={{ ease: "easeInOut", duration: 1.2 }}>
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
                    </motion.div>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-500 text-center max-w-sm leading-relaxed animate-pulse">{getLoadingText()}</p>
              </div>
            ) : (
              <>
                {/* TABS — áudio em destaque */}
                <div className="flex border-b-2 border-black shrink-0">
                  <button onClick={() => setModo('audio')}
                    className={`flex-[2] p-4 font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${modo === 'audio' ? 'bg-black text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-black'}`}>
                    <Mic size={16}/> Voz — Análise Profunda
                    {modo === 'audio' && <span className="ml-1 text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Recomendado</span>}
                  </button>
                  <button onClick={() => setModo('texto')}
                    className={`flex-1 p-4 font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-l-2 border-black ${modo === 'texto' ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-black'}`}>
                    <Type size={16}/> Texto
                  </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  {modo === 'audio' ? (
                    <div className="flex-1 flex flex-col items-center justify-start p-6 gap-4 overflow-y-auto custom-scrollbar">

                      {/* CONTROLES DE CÂMERA */}
                      <div className="flex flex-col items-center gap-2 w-full">
                        <button onClick={toggleEspelho}
                          className={`border-2 border-black rounded-xl px-5 py-2.5 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none flex items-center gap-2 ${espelhoAtivo ? 'bg-blue-100 text-blue-800' : 'bg-white text-slate-700'}`}>
                          <Camera size={14}/> {espelhoAtivo ? 'Desligar Espelho' : 'Ligar Espelho'}
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
                      <div className={`transition-all duration-500 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${espelhoAtivo ? 'w-44 h-44 md:w-52 md:h-52 border-4 border-black shadow-lg bg-black' : 'w-20 h-20'} ${gravando && !espelhoAtivo ? 'bg-red-100 animate-pulse' : 'bg-slate-100'} ${gravando && espelhoAtivo ? 'border-red-500 animate-pulse' : ''}`}>
                        {espelhoAtivo
                          ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                          : <Mic size={36} className={gravando ? 'text-red-600' : 'text-slate-400'} />}
                      </div>

                      {/* STATUS DE GRAVAÇÃO */}
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                        {gravando ? 'Gravando — fale sua aula...' : temTranscricao ? 'Gravação concluída — revise ou envie' : 'Pronto para gravar'}
                      </p>

                      {/* TRANSCRIÇÃO ACUMULADA (se houver) */}
                      {temTranscricao && (
                        <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Transcrição</p>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{textoExplicacao}</p>
                          {transcricaoInterim && (
                            <p className="text-xs font-medium text-slate-400 italic mt-1">{transcricaoInterim}</p>
                          )}
                        </div>
                      )}

                      {/* TEXTO INTERIM (sem transcrição ainda) */}
                      {!temTranscricao && transcricaoInterim && (
                        <div className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4">
                          <p className="text-xs font-medium text-slate-400 italic leading-relaxed">{transcricaoInterim}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 p-4 md:p-6 flex flex-col gap-3">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                        <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-800 leading-snug">
                          A explicação por voz gera uma análise cognitiva mais profunda e personalizada.
                        </p>
                      </div>
                      <textarea
                        value={textoExplicacao}
                        onChange={e => setTextoExplicacao(e.target.value)}
                        placeholder="Cole ou edite a transcrição da sua aula aqui..."
                        className="flex-1 bg-white border-2 border-slate-300 rounded-2xl p-6 outline-none focus:border-black focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-700 placeholder-slate-400 resize-none transition-all custom-scrollbar"
                      />
                    </div>
                  )}
                </div>

                {/* BOTÃO PRINCIPAL */}
                <div className="p-4 md:p-6 border-t-2 border-black bg-white shrink-0">
                  <button
                    onClick={modo === 'texto' ? enviarTextoParaAuditoria : botaoAudioClick}
                    className={`w-full py-5 rounded-xl font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3 ${modo === 'audio' ? botaoAudioCor : 'bg-black text-white'}`}>
                    {modo === 'texto'
                      ? <><span>ENVIAR AULA</span> <Play size={16}/></>
                      : <>{gravando ? <MicOff size={16}/> : <Play size={16}/>} <span>{botaoAudioLabel}</span></>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COLUNA 3 (DIREITA): RASCUNHO */}
        <div className="order-3 lg:col-span-3 bg-[#FEF08A] border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[250px] lg:h-[calc(100vh-140px)] overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-[#FDE047] flex items-center justify-center gap-2 shrink-0">
            <PenTool size={16} className="text-yellow-900"/>
            <span className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-yellow-900">Rascunho de Apoio</span>
          </div>
          <textarea value={rascunho} onChange={e => setRascunho(e.target.value)}
            className="flex-1 p-5 bg-transparent outline-none resize-none font-bold text-[11px] md:text-xs text-yellow-900 placeholder-yellow-700/50 leading-relaxed custom-scrollbar"
            placeholder="Anotações, atalhos e palavras-chave para guiar a sua explicação..." />
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

import { Suspense } from "react";

export default function AuditorioPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuditorioContent />
    </Suspense>
  );
}
