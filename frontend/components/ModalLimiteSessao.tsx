"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, X } from "lucide-react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  renovacaoEm?: string; // data formatada
}

export function ModalLimiteSessao({ aberto, onFechar, renovacaoEm }: Props) {
  const router = useRouter();

  const irParaPremium = () => {
    onFechar();
    router.push("/perfil");
  };

  const voltar = () => {
    onFechar();
    router.push("/dashboard");
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={voltar}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{   scale: 0.92, opacity: 0, y: 16  }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative bg-white border-2 border-black rounded-3xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Fechamento */}
            <button
              onClick={voltar}
              className="absolute top-4 right-4 text-slate-300 hover:text-black transition-colors"
            >
              <X size={18} />
            </button>

            {/* Ícone */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center shrink-0">
                <Lock size={22} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight leading-tight">
                  Limite semanal atingido
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Plano Gratuito
                </p>
              </div>
            </div>

            {/* Corpo */}
            <p className="text-sm font-bold text-slate-600 leading-relaxed mb-2">
              Você atingiu o limite de sessões gratuitas desta semana.
              Faça upgrade para continuar com sessões ilimitadas.
            </p>

            {renovacaoEm && (
              <p className="text-xs font-bold text-slate-400 mb-6">
                Renovação gratuita em: <span className="text-slate-700">{renovacaoEm}</span>
              </p>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={irParaPremium}
                className="w-full bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-[3px_3px_0px_0px_rgba(37,99,235,0.4)]"
              >
                <Zap size={13} /> Conhecer Premium
              </button>
              <button
                onClick={voltar}
                className="w-full bg-white text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 hover:border-black hover:text-black transition-all"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
