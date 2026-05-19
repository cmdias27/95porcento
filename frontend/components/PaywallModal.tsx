// frontend/components/PaywallModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, CheckCircle2, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaywallModalProps {
  isOpen: boolean;
  onClose?: () => void;
  titulo?: string;
  subtitulo?: string;
}

export function PaywallModal({ isOpen, onClose, titulo, subtitulo }: PaywallModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200"
        >
          {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-20 transition-colors">
              <X size={20} />
            </button>
          )}

          {/* Header */}
          <div className="bg-slate-900 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent" />
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 shadow-[0_0_30px_rgba(37,99,235,0.5)]">
              <Crown className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight relative z-10 mb-2">
              {titulo || "Desbloqueie o Protocolo Completo"}
            </h2>
            <p className="text-blue-200 font-medium text-sm relative z-10">
              {subtitulo || "Você atingiu o limite de diagnósticos gratuitos. Para continuar mapeando suas lacunas e evoluindo, assine o plano premium."}
            </p>
          </div>

          {/* Benefícios */}
          <div className="p-8 bg-white">
            <div className="space-y-4 mb-8">
              {[
                "Diagnósticos ilimitados de lacunas por áudio ou texto",
                "Simulador de questões inéditas com correção em tempo real",
                "Revisão espaçada automática baseada no seu esquecimento",
                "Acesso a todas as jornadas (Concurso, OAB, ENEM)",
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">{b}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push("/checkout")}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:-translate-y-1"
            >
              Quero ser Premium <ArrowRight size={16} />
            </button>
            
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              Pagamento seguro. Cancele quando quiser.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
