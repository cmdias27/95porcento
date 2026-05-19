// frontend/app/dashboard/simulador/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Loader2, CheckCircle2, XCircle, Brain, Target, ChevronRight } from 'lucide-react';
import { JORNADAS_ESTUDO } from "@/data/materias";
import { apiFetch } from "@/lib/apiFetch";

export default function SimuladorPage() {
  const router = useRouter();

  // Estados de Fluxo
  const [fase, setFase] = useState<'config' | 'loading' | 'treino' | 'relatorio'>('config');
  
  // Estados do Formulário
  const [jornada, setJornada] = useState<'concurso' | 'enem'>('concurso');
  const [materia, setMateria] = useState('');
  const [tema, setTema] = useState('');
  const [faixaSalarial, setFaixaSalarial] = useState('Intermediario');
  const [banca, setBanca] = useState('');
  const [tipoQuestao, setTipoQuestao] = useState('Múltipla Escolha');
  const [quantidade, setQuantidade] = useState('5');

  // Estados do Treino
  const [questoesIneditas, setQuestoesIneditas] = useState<any[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [alternativaMarcada, setAlternativaMarcada] = useState<string | null>(null);
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const [acertos, setAcertos] = useState(0);

  const jornadaAtual = useMemo(() => JORNADAS_ESTUDO.find(j => j.nome.toLowerCase() === jornada.toLowerCase()), [jornada]);
  const materiaAtual = useMemo(() => jornadaAtual?.materias.find(m => m.nome === materia), [jornadaAtual, materia]);

  const gerarSimulado = async () => {
    if (!materia || !tema || !banca) return alert("Preencha Matéria, Tema e Banca.");
    setFase('loading');

    try {
      const response = await apiFetch('http://127.0.0.1:5000/api/gerar-simulado', {
        method: 'POST',
        body: JSON.stringify({ jornada, materia, tema, faixa_salarial: faixaSalarial, banca, tipo: tipoQuestao, quantidade: parseInt(quantidade) })
      });

      const data = await response.json();
      if (data.questoes && data.questoes.length > 0) {
        setQuestoesIneditas(data.questoes);
        setIndiceAtual(0);
        setAcertos(0);
        setAlternativaMarcada(null);
        setMostrarGabarito(false);
        setFase('treino');
      } else {
        alert("Não foi possível gerar as questões. Tente outro tema.");
        setFase('config');
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
      setFase('config');
    }
  };

  // Lógica inteligente para validar se acertou (Trata "C", "Certo", "A", etc)
  const checarSeAcertou = () => {
    if (!alternativaMarcada) return false;
    const gab = questoesIneditas[indiceAtual].gabarito.toLowerCase();
    const marc = alternativaMarcada.toLowerCase();
    
    if (tipoQuestao === 'Certo/Errado') {
      return gab.startsWith(marc.charAt(0)); // Ex: "Certo" e "C" combinam
    }
    return gab.includes(marc);
  };

  const confirmarResposta = () => {
    if (!alternativaMarcada) return;
    setMostrarGabarito(true);
    if (checarSeAcertou()) setAcertos(prev => prev + 1);
  };

  const proximaQuestao = () => {
    if (indiceAtual + 1 < questoesIneditas.length) {
      setIndiceAtual(prev => prev + 1);
      setAlternativaMarcada(null);
      setMostrarGabarito(false);
    } else {
      setFase('relatorio');
    }
  };

  const questaoAtual = questoesIneditas[indiceAtual];
  const acertouAtual = mostrarGabarito ? checarSeAcertou() : false;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col items-center">
      
      {/* NAVBAR SIMPLIFICADA DO SIMULADOR */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b-2 border-black">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-black transition-colors">
          <ArrowLeft size={14} /> Voltar ao Painel
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-md flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
             <Swords size={12} className="text-white" />
          </div>
          <span className="font-black text-xs tracking-tight uppercase">Simulador Ativo</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl px-6 pb-20 flex flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          
          {/* FASE 1: CONFIGURAÇÃO */}
          {fase === 'config' && (
            <motion.div key="config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-8 rounded-[2rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-black mb-2">Configuração Tática</h1>
                <p className="text-xs text-slate-500 font-bold">Defina os parâmetros do combate. A IA forjará questões inéditas no padrão exato solicitado.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Matéria</label>
                  <select value={materia} onChange={(e) => {setMateria(e.target.value); setTema("");}} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {jornadaAtual?.materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Tema</label>
                  <select value={tema} onChange={(e) => setTema(e.target.value)} disabled={!materia} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer disabled:opacity-50">
                    <option value="" disabled>Selecione...</option>
                    {materiaAtual?.temas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Estilo da Banca</label>
                  <select value={banca} onChange={(e) => setBanca(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {[
                      { value: 'Cebraspe', label: 'CEBRASPE / CESPE' },
                      { value: 'FGV',      label: 'FGV' },
                      { value: 'FCC',      label: 'FCC' },
                      { value: 'Vunesp',   label: 'VUNESP' },
                      { value: 'OAB',      label: 'OAB (FGV)' },
                      { value: 'ENEM',     label: 'ENEM' },
                      { value: 'Livre',    label: 'Abordagem Livre' },
                    ].map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Tipo de Questão</label>
                  <select value={tipoQuestao} onChange={(e) => setTipoQuestao(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer">
                    <option value="Múltipla Escolha">Múltipla Escolha</option>
                    <option value="Certo/Errado">Certo / Errado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-3 sm:col-span-2 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Ajuste de Dificuldade</label>
                   <select value={faixaSalarial} onChange={(e) => setFaixaSalarial(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer">
                     <option value="Inicial">Inicial — conceitos diretos</option>
                     <option value="Intermediario">Intermediário — aplicação e casos práticos</option>
                     <option value="Avancado">Avançado — jurisprudência e pegadinhas</option>
                     <option value="Elite">Elite — máxima dificuldade</option>
                   </select>
                 </div>
                 <div className="col-span-3 sm:col-span-1 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Quantidade</label>
                   <select value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:border-black cursor-pointer">
                     {['5', '10', '15', '20'].map(q => <option key={q} value={q}>{q} Questões</option>)}
                   </select>
                 </div>
              </div>

              <button onClick={gerarSimulado} disabled={!materia || !tema || !banca} className="w-full bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none">
                Forjar Simulado Inédito
              </button>
            </motion.div>
          )}

          {/* FASE 2: LOADING */}
          {fase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center space-y-6 py-20">
               <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
               <div className="text-center">
                 <h2 className="text-xl font-black text-black">Forjando o Combate...</h2>
                 <p className="text-xs font-bold text-slate-500 mt-2">Nossa IA está cruzando o padrão da {banca} com a base de dados.</p>
               </div>
            </motion.div>
          )}

          {/* FASE 3: TREINO */}
          {fase === 'treino' && questoesIneditas.length > 0 && (
            <motion.div key="treino" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full space-y-6">
               <div className="flex items-center justify-between bg-white px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Questão {indiceAtual + 1} de {questoesIneditas.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black px-3 py-1.5 rounded-lg shadow-sm">{banca}</span>
               </div>

               <div className="bg-white p-6 md:p-10 rounded-[2rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-sm md:text-base font-bold text-slate-800 leading-relaxed whitespace-pre-wrap mb-8">
                     {questaoAtual.enunciado}
                  </div>

                  {/* LÓGICA VISUAL DAS ALTERNATIVAS */}
                  <div className="space-y-3">
                     {tipoQuestao === 'Certo/Errado' ? (
                       <div className="grid grid-cols-2 gap-4">
                         {['Certo', 'Errado'].map((opt) => {
                           const isSelected = alternativaMarcada === opt;
                           const isCorrectGabarito = questaoAtual.gabarito.toLowerCase().startsWith(opt.charAt(0).toLowerCase());
                           
                           // Definição de Cores Dinâmicas
                           let btnStyles = "border-slate-200 bg-white text-slate-700 hover:border-black";
                           if (mostrarGabarito) {
                             if (isCorrectGabarito) {
                               btnStyles = "border-emerald-500 bg-emerald-500 text-white shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]"; // Verde Destaque
                             } else if (isSelected && !isCorrectGabarito) {
                               btnStyles = "border-red-500 bg-red-500 text-white"; // Vermelho Erro
                             } else {
                               btnStyles = "border-slate-100 bg-slate-50 text-slate-300 opacity-50 grayscale"; // Cinza (Inativo)
                             }
                           } else if (isSelected) {
                             btnStyles = "border-black bg-black text-white"; // Selecionado antes de confirmar
                           }

                           return (
                             <button key={opt} disabled={mostrarGabarito} onClick={() => setAlternativaMarcada(opt)} className={`p-4 rounded-xl border-2 text-sm font-black transition-all text-center ${btnStyles}`}>
                               {opt}
                             </button>
                           );
                         })}
                       </div>
                     ) : (
                       Object.entries(questaoAtual.alternativas || {}).map(([letra, texto]: any) => {
                         const isSelected = alternativaMarcada === letra;
                         const isCorrectGabarito = questaoAtual.gabarito.toUpperCase().includes(letra.toUpperCase());
                         
                         // Definição de Cores Dinâmicas Múltipla Escolha
                         let btnStyles = "border-slate-200 bg-white hover:border-black";
                         let letterStyles = "bg-slate-100 text-slate-500";
                         let textStyles = "text-slate-700";

                         if (mostrarGabarito) {
                           if (isCorrectGabarito) {
                             btnStyles = "border-emerald-500 bg-emerald-50 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]";
                             letterStyles = "bg-emerald-500 text-white";
                             textStyles = "text-emerald-900";
                           } else if (isSelected && !isCorrectGabarito) {
                             btnStyles = "border-red-500 bg-red-50";
                             letterStyles = "bg-red-500 text-white";
                             textStyles = "text-red-900";
                           } else {
                             btnStyles = "border-slate-100 bg-white opacity-40 grayscale";
                             letterStyles = "bg-slate-50 text-slate-300";
                             textStyles = "text-slate-400";
                           }
                         } else if (isSelected) {
                           btnStyles = "border-black bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1";
                           letterStyles = "bg-black text-white";
                           textStyles = "text-black font-black";
                         }

                         return (
                           <button key={letra} disabled={mostrarGabarito} onClick={() => setAlternativaMarcada(letra)} className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${btnStyles}`}>
                             <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${letterStyles}`}>{letra}</span>
                             <span className={`text-xs md:text-sm font-bold pt-1.5 ${textStyles}`}>{texto}</span>
                           </button>
                         )
                       })
                     )}
                  </div>

                  {/* RESULTADO E COMENTÁRIO DO PROFESSOR (REVELADO) */}
                  {mostrarGabarito && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pt-8 border-t-2 border-slate-100 space-y-6">
                      
                      {/* BANNER DE ACERTO/ERRO COM GABARITO OFICIAL */}
                      <div className={`p-4 rounded-xl border-2 flex items-center gap-3 font-black text-xs md:text-sm uppercase tracking-widest ${acertouAtual ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
                        {acertouAtual ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                        <span>{acertouAtual ? 'Você Acertou!' : 'Você Errou!'}</span>
                        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-800 bg-white px-3 py-1.5 rounded-lg border-2 border-black shadow-sm">
                          GABARITO OFICIAL: <span className="text-black text-xs">{questaoAtual.gabarito}</span>
                        </div>
                      </div>

                      {/* TEXTO DO COMENTÁRIO */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Brain size={16} className="text-blue-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Comentário da IA</span>
                        </div>
                        <div className="text-xs md:text-sm font-bold text-slate-700 bg-slate-50 p-5 md:p-6 rounded-2xl border-2 border-slate-200 leading-relaxed whitespace-pre-wrap">
                          {questaoAtual.comentario}
                        </div>
                      </div>

                    </motion.div>
                  )}
               </div>

               {/* BOTÕES DE AÇÃO */}
               <div className="flex justify-end pt-2">
                  {!mostrarGabarito ? (
                    <button onClick={confirmarResposta} disabled={!alternativaMarcada} className="bg-black text-white px-8 py-4 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest disabled:opacity-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
                      Confirmar Resposta
                    </button>
                  ) : (
                    <button onClick={proximaQuestao} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
                      {indiceAtual + 1 === questoesIneditas.length ? 'Finalizar Simulado' : 'Próxima Questão'} <ChevronRight size={16} />
                    </button>
                  )}
               </div>
            </motion.div>
          )}

          {/* FASE 4: RELATÓRIO FINAL */}
          {fase === 'relatorio' && (
             <motion.div key="relatorio" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[2.5rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-8">
               <div className="w-24 h-24 bg-white border-4 border-black rounded-full flex flex-col items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 <span className="text-3xl font-black leading-none">{acertos}</span>
                 <span className="text-[10px] font-black uppercase text-slate-500 mt-1">de {questoesIneditas.length}</span>
               </div>
               
               <div>
                 <h2 className="text-2xl font-black text-black mb-2">Combate Concluído</h2>
                 <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">Você completou o treino tático focado na banca {banca}.</p>
               </div>

               <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl text-left">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 mb-2"><Target size={14} /> Fixação Ativa</h3>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed">
                    A melhor forma de transformar seus erros e acertos em memória de longo prazo é explicando o conteúdo. Entre no Auditório e consolide esse aprendizado.
                  </p>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <button onClick={() => router.push(`/dashboard/auditorio?jornada=${jornada}&materia=${materia}&tema=${tema}`)} className="bg-black text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                   Entrar no Auditório
                 </button>
                 <button onClick={() => setFase('config')} className="bg-white text-black border-2 border-black px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                   Novo Simulado
                 </button>
               </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}