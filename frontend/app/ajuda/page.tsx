// frontend/app/ajuda/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, HelpCircle, Mic, Brain, Swords,
  CreditCard, ShieldCheck, Settings, ChevronRight,
} from "lucide-react";
import { Footer } from "@/components/Footer";

type Pergunta = { q: string; a: string };
type Grupo = { titulo: string; icon: React.ElementType; cor: string; perguntas: Pergunta[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Primeiros passos",
    icon: HelpCircle,
    cor: "text-blue-600 bg-blue-50 border-blue-200",
    perguntas: [
      { q: "O que é o 95porcento?", a: "É uma plataforma de estudo ativo baseada na Pirâmide de Glasser: você retém até 95% do que ensina. Em vez de só ler ou assistir aula, você explica o assunto para a nossa IA, que analisa sua explicação e devolve um relatório mostrando o que você domina, o que esqueceu e onde focar." },
      { q: "Preciso saber o assunto antes de usar?", a: "Sim. A plataforma testa o que você já estudou — não é para aprender do zero. Estude o tema no seu material de base e depois use o Auditório para consolidar e identificar lacunas que você não perceberia sozinho." },
      { q: "Como começo minha primeira sessão?", a: "Crie sua conta, escolha sua jornada (Concurso, ENEM ou OAB), digite ou selecione o tema que acabou de estudar e comece a explicar. Em poucos minutos você recebe seu primeiro relatório de desempenho." },
      { q: "Preciso pagar para usar?", a: "Você pode começar gratuitamente e fazer suas primeiras sessões. Recursos avançados, como o histórico completo do Perfil Cognitivo, fazem parte do acesso Premium." },
    ],
  },
  {
    titulo: "Modos de estudo",
    icon: Mic,
    cor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    perguntas: [
      { q: "Qual a diferença entre os modos Livre, Guiado e Simulado?", a: "No modo Livre você explica o tema do seu jeito, sem interrupções, como uma aula completa. No Guiado, a IA conduz com perguntas progressivas por fases — ideal para quem ainda não tem confiança. No Simulado, você enfrenta um cenário hipotético como em prova real, respondendo em 5 fases de raciocínio." },
      { q: "Por que devo explicar por voz em vez de texto?", a: "Explicar em voz alta ativa a recuperação ativa de forma mais natural e completa — você organiza o raciocínio como se estivesse ensinando. Por isso o modo de voz é o recomendado e aparece em destaque. O texto continua disponível como alternativa." },
      { q: "O que aparece no meu relatório?", a: "Um score de domínio, seus acertos consolidados, os erros conceituais identificados, os conceitos que você omitiu e um plano de estudo priorizado. Em cada ponto, você ainda recebe questões de prova reais e questões autorais no estilo da sua banca." },
    ],
  },
  {
    titulo: "Simulador e questões",
    icon: Swords,
    cor: "text-red-500 bg-red-50 border-red-200",
    perguntas: [
      { q: "Como o simulador cria as questões?", a: "A IA foi treinada com padrões de provas reais de cada banca (FGV, Cebraspe, FCC, Vunesp e outras). Ela gera questões inéditas que replicam estilo, vocabulário e nível de dificuldade — sem reaproveitar questões antigas." },
      { q: "As questões de prova são reais?", a: "Sim. Sempre que existe uma questão real pertinente ao seu tema no nosso banco, ela é exibida. Quando não há questão real sobre aquele assunto específico, mostramos apenas a questão autoral criada pela IA no estilo da banca." },
    ],
  },
  {
    titulo: "Perfil Cognitivo e evolução",
    icon: Brain,
    cor: "text-purple-600 bg-purple-50 border-purple-200",
    perguntas: [
      { q: "O que é o Perfil Cognitivo?", a: "A cada sessão, o sistema registra seus erros, omissões e tópicos dominados. Com o tempo, ele identifica padrões — quais temas você supera e quais continuam sendo pontos fracos — e monta um plano de estudo sob medida, filtrado por Jornada → Matéria → Tema." },
      { q: "Como acompanho minha evolução?", a: "No seu Dashboard, cada tema estudado vira um card. Ao clicar, você expande o histórico de notas, a tendência de evolução e os pontos que ainda precisam de atenção naquele tema." },
    ],
  },
  {
    titulo: "Conta e Premium",
    icon: CreditCard,
    cor: "text-amber-600 bg-amber-50 border-amber-200",
    perguntas: [
      { q: "Como funciona o acesso Premium?", a: "O Premium libera recursos avançados e uso ampliado da plataforma. Você pode, inclusive, ganhar 1 mês de Premium enviando seu feedback pelo botão flutuante dentro da plataforma." },
      { q: "Esqueci minha senha. O que faço?", a: "Na tela de login, clique em \"Esqueci minha senha\" e informe seu e-mail. Você receberá um link para redefinir a senha. Se você entrou com o Google, use sempre o botão \"Entrar com Google\"." },
      { q: "Como altero meus dados ou minha senha?", a: "Acesse a página de Perfil pelo menu. Lá você pode editar seu nome, ajustar preferências de estudo e, se entrou por e-mail e senha, alterar sua senha." },
    ],
  },
  {
    titulo: "Privacidade e dados",
    icon: ShieldCheck,
    cor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    perguntas: [
      { q: "Minhas explicações são privadas?", a: "Sim. Suas explicações, relatórios e histórico são privados e protegidos. Tratamos seus dados conforme a LGPD e não vendemos nem comercializamos seus dados pessoais. Detalhes completos na nossa Política de Privacidade, no rodapé." },
      { q: "Posso excluir minha conta e meus dados?", a: "Sim. Você pode solicitar o cancelamento e a exclusão a qualquer momento pelo canal de contato. Seus dados são tratados conforme os prazos previstos na nossa política e na legislação." },
    ],
  },
];

function FaqItem({ pergunta }: { pergunta: Pergunta }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-black text-black group-hover:text-blue-600 transition-colors">{pergunta.q}</span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs font-semibold text-slate-500 leading-relaxed pb-4 pr-8">{pergunta.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AjudaPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 antialiased flex flex-col"
      style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

      {/* NAVBAR */}
      <nav className="w-full px-6 py-3.5 flex items-center justify-between bg-white border-b-2 border-black z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={13} /> Voltar
          </button>
          <span className="text-slate-200">|</span>
          <span className="font-black text-lg leading-none tracking-tighter select-none">
            <span className="text-black">95</span><span className="text-blue-500">%</span>
          </span>
        </div>
        <Link href="/login"
          className="bg-black text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">
          Começar Agora
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-12 flex flex-col gap-10">

        {/* HERO */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            <HelpCircle size={11} /> Central de Ajuda
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black leading-tight">
            Como podemos <span className="text-blue-600">ajudar?</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 max-w-xl mx-auto leading-relaxed">
            As principais dúvidas sobre como usar a plataforma. Não encontrou o que procurava?{" "}
            <Link href="/contato" className="text-blue-600 font-black hover:underline">Fale com a gente</Link>.
          </p>
        </div>

        {/* GRUPOS DE FAQ */}
        {GRUPOS.map((grupo, gi) => (
          <div key={gi} className="bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-slate-100">
              <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center ${grupo.cor}`}>
                <grupo.icon size={16} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">{grupo.titulo}</h2>
            </div>
            <div>
              {grupo.perguntas.map((p, pi) => <FaqItem key={pi} pergunta={p} />)}
            </div>
          </div>
        ))}

        {/* CTA contato */}
        <div className="bg-black border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(37,99,235,0.4)] p-8 text-center flex flex-col items-center gap-4">
          <Settings size={22} className="text-blue-400" />
          <h2 className="text-xl font-black text-white tracking-tight">Ainda com dúvidas?</h2>
          <p className="text-xs font-semibold text-slate-400 max-w-sm leading-relaxed">
            Nossa equipe responde diretamente. Envie sua mensagem e retornamos no seu e-mail.
          </p>
          <Link href="/contato"
            className="bg-white text-black px-7 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
            Falar com o suporte <ChevronRight size={14} />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
