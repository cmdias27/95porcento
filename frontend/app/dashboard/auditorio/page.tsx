// frontend/app/dashboard/auditorio/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mic, Square, Loader2, ArrowLeft, Brain, Activity, Type, Edit3, Send, Pause, Play, Video, VideoOff, Check } from 'lucide-react';

export default function Auditorio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const jornada = searchParams.get('jornada') || '';
  const materia = searchParams.get('materia') || 'Tema Livre';
  const tema = searchParams.get('tema') || '';
  const subtema = searchParams.get('subtema') || '';

  const [modoInput, setModoInput] = useState<'audio' | 'text'>('audio');
  const [cameraOn, setCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); 
  
  // ESTADOS DA BARRA DE PROGRESSO
  const [progressoIA, setProgressoIA] = useState(0);
  const [statusIA, setStatusIA] = useState("Iniciando auditoria...");

  const [syllabus, setSyllabus] = useState<string[]>([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(true);
  const [checkedTopics, setCheckedTopics] = useState<Record<number, boolean>>({});
  const [textoAuditoria, setTextoAuditoria] = useState("");
  const [notas, setNotas] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const MAX_TIME = 1800; // 30 min

  useEffect(() => {
    const buscarSyllabus = async () => {
      if (!tema) return;
      try {
        const response = await fetch('http://127.0.0.1:5000/api/gerar-guia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materia, tema, subtema })
        });
        if (!response.ok) throw new Error("Erro na API.");
        const data = await response.json();
        if (data.topicos) {
          setSyllabus(data.topicos);
          setCheckedTopics({});
        }
      } catch (err) {
        setSyllabus(["⚠️ Não foi possível carregar o guia. Verifique o servidor."]);
      } finally {
        setLoadingSyllabus(false);
      }
    };
    buscarSyllabus();
  }, [materia, tema, subtema]);

  const toggleTopic = (index: number) => setCheckedTopics(prev => ({ ...prev, [index]: !prev[index] }));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_TIME) { stopRecording(); return MAX_TIME; }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => { return () => pararTudo(); }, []);

  const toggleCamera = async () => {
    if (cameraOn) {
      if (videoStreamRef.current) { videoStreamRef.current.getTracks().forEach(track => track.stop()); videoStreamRef.current = null; }
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      } catch (err) { alert("Não foi possível acessar a câmera."); }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        enviarParaAuditoria(audioBlob, 'audio');
      };
      mediaRecorderRef.current.start();
      setIsRecording(true); setIsPaused(false); setRecordingTime(0);
    } catch (err) { alert("Permita o acesso ao microfone."); }
  };

  const pauseRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.pause(); setIsPaused(true); } };
  const resumeRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.resume(); setIsPaused(false); } };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false); setIsPaused(false);
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const pararTudo = () => {
    stopRecording();
    if (cameraOn && videoStreamRef.current) videoStreamRef.current.getTracks().forEach(track => track.stop());
  };

  const enviarParaAuditoria = async (conteudo: Blob | string, tipo: 'audio' | 'text') => {
    setIsProcessing(true);
    setProgressoIA(0);
    setStatusIA(tipo === 'audio' ? "Transcrevendo áudio..." : "Processando texto...");

    // Lógica da Barra de Progresso Simulada (cresce até 90% enquanto espera a API)
    const progInterval = setInterval(() => {
      setProgressoIA(old => {
        if (old < 30) { setStatusIA("Mapeando conceitos explicados..."); return old + 5; }
        if (old < 60) { setStatusIA("Cruzando dados com o banco de questões e material específico..."); return old + 3; }
        if (old < 90) { setStatusIA("Gerando predição de prova..."); return old + 1; }
        return 90;
      });
    }, 800);

    const formData = new FormData();
    formData.append('jornada', jornada);
    formData.append('materia', materia);
    formData.append('tema', tema);
    if (subtema) formData.append('subtema', subtema);
    formData.append('anotacoes_manuais', notas);

    if (tipo === 'audio') formData.append('audio', conteudo as Blob, 'gravacao.webm');
    else formData.append('texto', conteudo as string);

    try {
      const endpoint = tipo === 'text' ? 'processar-texto' : 'processar-audio';
      const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, { method: 'POST', body: formData });
      
      clearInterval(progInterval);
      setProgressoIA(100);
      setStatusIA("Auditoria concluída!");

      if (!response.ok) throw new Error("Erro na API.");
      const data = await response.json();
      if (data.relatorio_id) {
        setTimeout(() => router.push(`/dashboard/relatorio/${data.relatorio_id}`), 500);
      } else {
        alert("Erro na auditoria."); setIsProcessing(false);
      }
    } catch (error) {
      clearInterval(progInterval);
      alert(`Falha na comunicação com o backend.`);
      setIsProcessing(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const progressPercentage = (recordingTime / MAX_TIME) * 100;

  return (
    <div className="h-screen w-screen bg-slate-50 text-black font-sans p-4 flex flex-col overflow-hidden relative">
      <header className="h-14 shrink-0 w-full flex items-center justify-between mb-4 relative z-10">
        <button onClick={() => { pararTudo(); router.push('/'); }} className="text-black flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
          <ArrowLeft size={14} /> Abandonar
        </button>
        <div className="text-center bg-white px-6 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-sm font-black truncate max-w-md">{tema}</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{materia} {subtema && `• ${subtema}`}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-200 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Activity size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black">Cockpit Ativo</span>
        </div>
      </header>

      <main className="flex-1 flex gap-4 min-h-0 relative z-10">
        <div className="w-1/4 bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-slate-100 flex items-center gap-2 shrink-0">
            <Brain size={16} className="text-black" />
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Guia de Tópicos</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {loadingSyllabus ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3"><Loader2 className="animate-spin" size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Extraindo...</span></div>
            ) : syllabus.length > 0 ? (
              syllabus.map((item, idx) => {
                const isChecked = checkedTopics[idx] || false;
                return (
                  <div key={idx} onClick={() => toggleTopic(idx)} className={`flex gap-3 items-start group cursor-pointer p-2 -mx-2 rounded-lg transition-all ${isChecked ? 'bg-transparent' : 'hover:bg-slate-100'}`}>
                    <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-black group-hover:border-blue-600 bg-white'}`}>
                      {isChecked && <Check size={10} strokeWidth={4} className="text-white" />}
                    </div>
                    <p className={`text-xs font-bold leading-relaxed transition-all ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-black'}`}>{item}</p>
                  </div>
                );
              })
            ) : (<p className="text-xs font-bold text-slate-400 text-center mt-10">Nenhum guia carregado.</p>)}
          </div>
        </div>

        <div className="w-2/4 bg-slate-200 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
          <div className="flex p-2 border-b-2 border-black bg-slate-300 shrink-0 gap-2">
            {[{ id: 'audio', icon: <Mic size={14}/>, label: 'Áudio (Fala)' }, { id: 'text', icon: <Type size={14}/>, label: 'Texto (Digitação)' }].map((modo) => (
              <button key={modo.id} onClick={() => { if(!isRecording) setModoInput(modo.id as any); }} disabled={isRecording || isProcessing} className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 ${modoInput === modo.id ? 'bg-black text-white border-black' : 'bg-white text-slate-500 border-transparent hover:border-black hover:text-black'} disabled:opacity-50`}>
                {modo.icon} {modo.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col p-4 relative bg-white">
            {isProcessing ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100 relative shadow-inner">
                   <Loader2 size={40} className="animate-spin text-blue-600 absolute" />
                   <span className="text-sm font-black text-blue-600 z-10">{progressoIA}%</span>
                 </div>
                 <div className="w-full max-w-sm space-y-3 text-center">
                   <p className="font-black uppercase tracking-widest text-sm text-slate-800 animate-pulse">{statusIA}</p>
                   <div className="w-full bg-slate-100 h-4 rounded-full border-2 border-black overflow-hidden p-0.5">
                     <div className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressoIA}%` }} />
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Não feche esta tela</p>
                 </div>
               </div>
            ) : modoInput === 'text' ? (
              <textarea value={textoAuditoria} onChange={(e) => setTextoAuditoria(e.target.value)} placeholder="Digite sua explicação detalhada aqui..." className="w-full h-full bg-slate-50 border-2 border-black rounded-xl p-4 resize-none outline-none focus:ring-4 focus:ring-blue-600/30 text-sm font-bold shadow-inner custom-scrollbar" />
            ) : (
              <div className="relative flex-1 flex flex-col items-center justify-center w-full h-full bg-slate-100 rounded-xl border-2 border-black overflow-hidden">
                <button onClick={toggleCamera} className="absolute top-4 right-4 z-20 bg-white border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2">
                  {cameraOn ? <VideoOff size={14} className="text-red-500" /> : <Video size={14} />}<span className="text-[10px] font-black uppercase">{cameraOn ? 'Desligar Espelho' : 'Ligar Espelho'}</span>
                </button>
                <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 -scale-x-100 ${cameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
                <div className={`relative flex items-center justify-center transition-opacity duration-300 ${cameraOn ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="absolute w-48 h-48 border-2 border-black/10 rounded-full" />
                  <Mic size={64} className="text-black/20 absolute" /><p className="absolute mt-32 text-xs font-bold text-slate-400 uppercase tracking-widest">Apenas Áudio</p>
                </div>
                {isRecording && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-black shadow-sm">
                    <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black uppercase">{isPaused ? 'Pausado' : 'Gravando'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-200 border-t-2 border-black shrink-0 flex flex-col gap-3">
            {modoInput === 'audio' && isRecording && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] font-black tracking-widest text-black px-1"><span>{formatTime(recordingTime)}</span><span>30:00</span></div>
                <div className="w-full bg-slate-300 h-2.5 rounded-full border border-black overflow-hidden"><div className="bg-blue-600 h-full transition-all duration-1000 ease-linear" style={{ width: `${progressPercentage}%` }} /></div>
              </div>
            )}
            {modoInput === 'text' ? (
              <button onClick={() => enviarParaAuditoria(textoAuditoria, 'text')} disabled={!textoAuditoria.trim() || isProcessing} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none transition-all">
                <Send size={16} /> Enviar Explicação
              </button>
            ) : (
              <div className="flex gap-2">
                {!isRecording ? (
                  <button onClick={startRecording} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <Mic size={16} /> Iniciar Explicação
                  </button>
                ) : (
                  <>
                    <button onClick={isPaused ? resumeRecording : pauseRecording} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${isPaused ? 'bg-emerald-400 text-black' : 'bg-amber-400 text-black'}`}>
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}{isPaused ? "Retomar" : "Pausar"}
                    </button>
                    <button onClick={stopRecording} className="flex-1 bg-red-500 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <Square size={16} /> Finalizar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/4 bg-[#FFF9C4] rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
           <div className="p-4 border-b-2 border-black bg-[#FFF59D] flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2"><Edit3 size={16} className="text-black" /><h2 className="text-xs font-black uppercase tracking-widest text-black">Rascunho</h2></div>
           </div>
           <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Use este espaço para fazer suas anotações..." className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-sm font-bold text-slate-800 placeholder-slate-500/50 custom-scrollbar leading-relaxed" />
        </div>
      </main>
    </div>
  );
}