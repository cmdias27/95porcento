// frontend/components/FeedbackFloatante.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, Gift } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";

// Evento global para abrir o feedback programaticamente (ex.: botão "Voltar" do 1º relatório).
// detail.redirect (opcional): rota para navegar ao fechar o modal.
export const FEEDBACK_EVENT = "abrir-feedback";
// Marca, no localStorage, que o usuário já concluiu a primeira explicação.
export const FLAG_PRIMEIRA_EXPLICACAO = "ja_explicou";

const PERGUNTAS_BINARIAS = [
  { id: "confuso",     texto: "Você ficou confuso em algum momento no site?" },
  { id: "inteligente", texto: "O relatório pareceu inteligente?" },
  { id: "descobriu",   texto: "A IA identificou algo que você realmente não sabia?" },
  { id: "voltaria",    texto: "Você voltaria amanhã?" },
  { id: "cansativo",   texto: "O fluxo foi cansativo?" },
  { id: "pagaria",     texto: "Você pagaria por isso hoje?" },
];

const FAIXAS = ["Entre R$ 9,90 e 19,90", "Entre R$ 20,00 e 39,90", "Acima de R$ 40,00"];

const API_BASE    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STORAGE_KEY = "feedback_premium_done";

export function FeedbackFloatante() {
  const router = useRouter();
  const [visible,   setVisible]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [faixa,     setFaixa]     = useState("");
  const [faltando,  setFaltando]  = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [resultado, setResultado] = useState<{ recompensa: boolean } | null>(null);
  const [redirectAoFechar, setRedirectAoFechar] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return; // já enviou → nada a fazer

    // Botão flutuante só fica disponível após a primeira explicação
    if (localStorage.getItem(FLAG_PRIMEIRA_EXPLICACAO) === "1") setVisible(true);

    // Abertura programática (ex.: "Voltar" do primeiro relatório)
    const onAbrir = (e: Event) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const detail = (e as CustomEvent).detail || {};
      setVisible(true);
      setOpen(true);
      if (detail.redirect) setRedirectAoFechar(detail.redirect);
    };
    window.addEventListener(FEEDBACK_EVENT, onAbrir as EventListener);
    return () => window.removeEventListener(FEEDBACK_EVENT, onAbrir as EventListener);
  }, []);

  const responder = (id: string, valor: string) =>
    setRespostas(prev => ({ ...prev, [id]: valor }));

  const podeSalvar =
    PERGUNTAS_BINARIAS.every(p => respostas[p.id]) && faixa !== "";

  const enviar = async () => {
    if (!podeSalvar) return;
    setEnviando(true);
    try {
      const res  = await apiFetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        body: JSON.stringify({
          respostas,
          faixa_preco: faixa,
          texto_livre: faltando.trim() || null,
        }),
      });
      const data = await res.json();
      setResultado({ recompensa: !!data.recompensa_ativada });
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // silent — não bloqueia o usuário
    } finally {
      setEnviando(false);
    }
  };

  const fechar = () => {
    setOpen(false);
    if (resultado) setVisible(false);
    if (redirectAoFechar) {
      const destino = redirectAoFechar;
      setRedirectAoFechar(null);
      router.push(destino);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-gradient-to-br from-violet-600 to-purple-500 text-white pl-3.5 pr-4 py-3 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.45)] hover:shadow-[0_12px_36px_rgba(124,58,237,0.55)] hover:scale-105 transition-all select-none"
          >
            <motion.span
              animate={{ rotate: [0, -18, 18, -10, 10, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 5, duration: 0.65 }}
              className="text-xl leading-none"
            >
              🎁
            </motion.span>
            <div className="text-left leading-none">
              <p className="text-[11px] font-black tracking-tight">Ganhe 1 mês ilimitado</p>
              <p className="text-[9px] font-semibold opacity-75 mt-[3px]">Envie seu feedback</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={fechar}
            />
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed inset-x-4 bottom-4 md:inset-x-auto md:right-6 md:bottom-6 md:w-[420px] bg-white rounded-[1.5rem] shadow-2xl z-50 overflow-hidden max-h-[92dvh] flex flex-col"
            >
              {resultado ? (
                /* ── Tela de sucesso ──────────────────────────────────── */
                <div className="p-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {resultado.recompensa ? "1 mês ilimitado ativado! 🎉" : "Obrigado pelo feedback!"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 leading-snug">
                      {resultado.recompensa
                        ? "Seu acesso ilimitado foi estendido por 30 dias. Aproveite!"
                        : "Suas respostas nos ajudam a melhorar o produto."}
                    </p>
                  </div>
                  <button
                    onClick={fechar}
                    className="w-full bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                  >
                    Continuar estudando
                  </button>
                </div>
              ) : (
                /* ── Formulário completo ──────────────────────────────── */
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">🎁</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                          Recompensa
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">Ganhe 1 mês de acesso ilimitado</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Preencha em 1 minuto e ganhe 30 dias ilimitados.</p>
                    </div>
                    <button onClick={fechar} className="text-slate-400 hover:text-black transition-colors shrink-0 mt-1">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Perguntas Sim / Não */}
                  <div className="space-y-4">
                    {PERGUNTAS_BINARIAS.map(p => (
                      <div key={p.id}>
                        <p className="text-sm font-bold text-slate-700 mb-2">{p.texto}</p>
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
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">
                      De forma hipotética, quanto você pagaria por mês?
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
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-1.5">
                      O que está faltando?{" "}
                      <span className="font-normal text-slate-400">(opcional)</span>
                    </p>
                    <textarea
                      value={faltando}
                      onChange={e => setFaltando(e.target.value)}
                      placeholder="Escreva aqui..."
                      rows={3}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-black rounded-xl p-3 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Botão enviar */}
                  <button
                    onClick={enviar}
                    disabled={!podeSalvar || enviando}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-500 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {enviando
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Gift size={13} /> Enviar e ativar 1 mês grátis</>}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
