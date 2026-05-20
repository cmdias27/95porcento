// frontend/components/FeedbackPopup.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type Props = { relatorioId: string };

const PERGUNTAS_BINARIAS = [
  { id: "confuso",     texto: "Você ficou confuso em algum momento no site?" },
  { id: "inteligente", texto: "O relatório pareceu inteligente?" },
  { id: "descobriu",   texto: "A IA identificou algo que você realmente não sabia?" },
  { id: "voltaria",    texto: "Você voltaria amanhã?" },
  { id: "cansativo",   texto: "O fluxo foi cansativo?" },
  { id: "pagaria",     texto: "Você pagaria por isso hoje?" },
];

const FAIXAS = ["Entre R$ 9,90 e 19,90", "Entre R$ 20,00 e 39,90", "Acima de R$ 40,00"];

export function FeedbackPopup({ relatorioId }: Props) {
  const [visible, setVisible] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [faixa, setFaixa] = useState("");
  const [faltando, setFaltando] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("feedback_popup_done")) return;
    const t = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const responder = (id: string, valor: string) =>
    setRespostas(prev => ({ ...prev, [id]: valor }));

  const podeSalvar =
    PERGUNTAS_BINARIAS.every(p => respostas[p.id]) && faixa !== "";

  const fechar = () => {
    localStorage.setItem("feedback_popup_done", "true");
    setVisible(false);
  };

  const enviar = async () => {
    if (!podeSalvar) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, "feedbacks_popup"), {
        relatorioId,
        uid: auth.currentUser?.uid ?? null,
        respostas,
        faixa_preco: faixa,
        o_que_falta: faltando.trim() || null,
        criadoEm: serverTimestamp(),
      });
      setEnviado(true);
      setTimeout(fechar, 2200);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden max-h-[92dvh] flex flex-col"
          >
            {enviado ? (
              <div className="flex flex-col items-center gap-4 py-14 px-8 text-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="text-lg font-black text-slate-900">Obrigado!</p>
                <p className="text-sm text-slate-500">Suas respostas nos ajudam muito.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">1 minuto</p>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Dá sua opinião?</h3>
                    <p className="text-xs text-slate-500 mt-1">Ajuda a melhorar para você.</p>
                  </div>
                  <button onClick={fechar} className="text-slate-400 hover:text-black transition-colors mt-1 shrink-0">
                    <X size={18} />
                  </button>
                </div>

                {/* Perguntas Sim/Não */}
                <div className="space-y-4">
                  {PERGUNTAS_BINARIAS.map(p => (
                    <div key={p.id} className="space-y-1.5">
                      <p className="text-sm font-bold text-slate-700">{p.texto}</p>
                      <div className="flex gap-2">
                        {["Sim", "Não"].map(op => (
                          <button
                            key={op}
                            onClick={() => responder(p.id, op)}
                            className={`px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                              respostas[p.id] === op
                                ? "bg-black text-white border-black"
                                : "border-slate-200 text-slate-500 hover:border-black hover:text-black"
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Faixa de preço */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700">
                    De forma hipotética, quanto você pagaria por uma assinatura mensal?
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {FAIXAS.map(f => (
                      <button
                        key={f}
                        onClick={() => setFaixa(f)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black text-left border-2 transition-all ${
                          faixa === f
                            ? "bg-black text-white border-black"
                            : "border-slate-200 text-slate-600 hover:border-black hover:text-black"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Texto livre */}
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-700">
                    O que está faltando?{" "}
                    <span className="font-normal text-slate-400">(opcional)</span>
                  </p>
                  <textarea
                    value={faltando}
                    onChange={e => setFaltando(e.target.value)}
                    placeholder="Escreva aqui..."
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-2xl p-3 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={enviar}
                  disabled={!podeSalvar || enviando}
                  className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-40"
                >
                  {enviando
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Send size={13} /> Enviar</>}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
