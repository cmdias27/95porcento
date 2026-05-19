// frontend/app/como-funciona/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Mic, Swords, Brain, Target, TrendingUp,
  CheckCircle2, BookOpen, Zap, ChevronRight, Award,
  Clock, BarChart2, ListChecks, Lightbulb,
} from "lucide-react";
import { Logo } from "@/components/Logo";

// ─── Card de seção ───────────────────────────────────
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 ${className}`}>
      {children}
    </div>
  );
}

// ─── Badge de label ──────────────────────────────────
function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "amber" | "emerald" | "red" | "purple" }) {
  const cls = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red:     "bg-red-50 border-red-200 text-red-700",
    purple:  "bg-purple-50 border-purple-200 text-purple-700",
  }[color];
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${cls}`}>
      {children}
    </span>
  );
}

// ─── Retenção bar ────────────────────────────────────
function RetencaoRow({ pct, label, destaque }: { pct: number; label: string; destaque?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2 ${destaque ? "opacity-100" : "opacity-70"}`}>
      <span className={`text-[10px] font-black w-10 text-right shrink-0 ${destaque ? "text-amber-600" : "text-slate-500"}`}>
        {pct}%
      </span>
      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${destaque ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-blue-300 to-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold w-28 shrink-0 ${destaque ? "text-amber-700 font-black" : "text-slate-500"}`}>
        {label}
      </span>
      {destaque && <Zap size={12} className="text-amber-500 shrink-0" />}
    </div>
  );
}

// ─── Passo numerado ──────────────────────────────────
function Passo({ n, titulo, descricao, icon: Icon, cor = "blue" }: {
  n: number; titulo: string; descricao: string;
  icon: React.ElementType; cor?: "blue" | "emerald" | "amber" | "purple" | "red";
}) {
  const iconCls = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    red: "text-red-500 bg-red-50 border-red-200",
  }[cor];
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center ${iconCls}`}>
          <Icon size={16} />
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[2rem]" />
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Passo {n}</span>
        </div>
        <p className="text-sm font-black text-black mb-1">{titulo}</p>
        <p className="text-xs font-semibold text-slate-500 leading-relaxed">{descricao}</p>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────
export default function ComoFuncionaPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-slate-900 antialiased"
      style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

      {/* NAVBAR */}
      <nav className="w-full px-6 py-3.5 flex items-center justify-between bg-white border-b-2 border-black z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={13} /> Voltar
          </button>
          <span className="text-slate-200">|</span>
          <Logo size="sm" />
        </div>
        <Link href="/login"
          className="bg-black text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">
          Começar Agora
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 flex flex-col gap-10">

        {/* ══ HERO ══ */}
        <div className="text-center space-y-4">
          <Badge color="blue">Protocolo de Aprendizagem</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black leading-tight">
            Como o <span className="text-blue-600">95porcento</span> funciona
          </h1>
          <p className="text-sm font-semibold text-slate-500 max-w-xl mx-auto leading-relaxed">
            Uma plataforma baseada em ciência cognitiva que transforma a maneira como você estuda — usando IA para revelar exatamente o que você sabe, o que esqueceu e onde focar.
          </p>
        </div>

        {/* ══ A CIÊNCIA ══ */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb size={16} className="text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">A Ciência Por Trás</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xl font-black text-black leading-tight mb-3">
                Você retém <span className="text-blue-600">95%</span> do que ensina.<br />
                Apenas <span className="text-slate-400">5%</span> do que ouve em aula.
              </p>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-4">
                A Pirâmide de Glasser mostra que métodos passivos (ouvir, ler) têm retenção baixíssima. Já ensinar ativamente é o método mais eficaz já documentado pela neurociência.
              </p>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                O 95porcento foi construído inteiramente sobre esse princípio: você ensina a matéria para nossa IA, e ela devolve uma análise cirúrgica do seu domínio real.
              </p>
            </div>

            <div className="space-y-1">
              <RetencaoRow pct={5}  label="Aula expositiva" />
              <RetencaoRow pct={10} label="Leitura" />
              <RetencaoRow pct={20} label="Audiovisual" />
              <RetencaoRow pct={30} label="Demonstração" />
              <RetencaoRow pct={50} label="Discussão em grupo" />
              <RetencaoRow pct={75} label="Prática ativa" />
              <RetencaoRow pct={95} label="Ensinar / Explicar" destaque />
            </div>
          </div>
        </SectionCard>

        {/* ══ COMO USAR — PASSO A PASSO ══ */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-6">
            <ListChecks size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">O Protocolo em 5 Passos</h2>
          </div>

          <div>
            <Passo n={1} icon={BookOpen} cor="blue" titulo="Escolha sua Jornada e Tema"
              descricao="Selecione sua jornada (Concurso Público, ENEM ou OAB), a disciplina e o tema específico que você acabou de estudar no seu material de revisão." />
            <Passo n={2} icon={Mic} cor="blue" titulo="Explique no Auditório de IA"
              descricao="Grave sua explicação oral do tema, como se estivesse dando uma aula. Não consulte o material — o objetivo é testar o que você realmente fixou." />
            <Passo n={3} icon={Swords} cor="red" titulo="Treine no Simulador (opcional)"
              descricao="Após explicar, enfrente questões inéditas com DNA da banca que você escolheu. A IA clona o estilo, vocabulário e pegadinhas das provas reais." />
            <Passo n={4} icon={BarChart2} cor="emerald" titulo="Receba seu Relatório de Desempenho"
              descricao="Nossa IA analisa sua explicação cruzando com a teoria e com o padrão da banca. Você recebe um score de domínio, lista de omissões e erros conceituais." />
            <Passo n={5} icon={Brain} cor="purple" titulo="Acompanhe seu Perfil Cognitivo"
              descricao="Com o tempo, o sistema mapeia seus pontos cegos, tópicos dominados e monta um plano de estudo personalizado baseado no seu histórico real." />
          </div>
        </SectionCard>

        {/* ══ AUDITÓRIO ══ */}
        <SectionCard>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center shrink-0">
              <Mic size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-black text-black">Auditório de IA</h2>
                <Badge color="blue">Modo Principal</Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-5">
                O coração do 95porcento. Você grava uma explicação oral do tema estudado — sem consultar material. A IA transcreve, analisa a profundidade técnica e identifica o que você deixou de fora.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: CheckCircle2, color: "text-blue-600", titulo: "Score de Domínio", desc: "Nota de 0 a 10 que reflete o quão completa e precisa foi sua explicação em relação ao conteúdo esperado." },
                  { icon: Target, color: "text-red-500", titulo: "Omissões Identificadas", desc: "Tópicos que fazem parte do tema mas que você não mencionou — os pontos cegos que custam pontos na prova." },
                  { icon: Zap, color: "text-amber-500", titulo: "Erros Conceituais", desc: "Afirmações incorretas ou imprecisas na sua explicação, detectadas pelo cruzamento com a base técnica da IA." },
                  { icon: BookOpen, color: "text-emerald-600", titulo: "Guia de Revisão", desc: "Ao final, a IA gera um roteiro priorizado para você revisar exatamente o que faltou, sem perder tempo." },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <item.icon size={13} className={item.color} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.titulo}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-1">Modo Guiado</p>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Para quem está começando no tema, o Modo Guiado divide o conteúdo em blocos e faz perguntas pontuais — como um examinador ao vivo — guiando sua explicação passo a passo.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ SIMULADOR ══ */}
        <SectionCard>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center shrink-0">
              <Swords size={22} className="text-red-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-black text-black">Simulador de Questões</h2>
                <Badge color="red">Validação Tática</Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-5">
                Questões inéditas criadas com o DNA da sua banca. Nossa IA replica fielmente o vocabulário, o nível de dificuldade e as armadilhas das provas reais — sem reaproveitar questões antigas.
              </p>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Award, color: "text-red-500", titulo: "DNA da Banca", desc: "FGV, Cebraspe, FCC, Vunesp — cada banca tem estilo próprio. A IA absorve esses padrões e os clona com 98% de fidelidade." },
                  { icon: TrendingUp, color: "text-amber-500", titulo: "Dificuldade Adaptativa", desc: "Escolha entre Inicial, Intermediário e Elite. O nível de apoio e complexidade se ajusta ao seu estágio." },
                  { icon: BarChart2, color: "text-blue-600", titulo: "Análise de Questão", desc: "Cada resposta é justificada com embasamento técnico, conectando o gabarito ao conteúdo do tema." },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <item.icon size={13} className={item.color} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.titulo}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ PERFIL COGNITIVO ══ */}
        <SectionCard>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-center shrink-0">
              <Brain size={22} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-black text-black">Perfil Cognitivo</h2>
                <Badge color="purple">Premium</Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-5">
                Cada sessão alimenta um banco de dados do seu aprendizado. Com o tempo, o sistema constrói um mapa preciso do seu domínio — tema a tema, matéria a matéria.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  { icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", titulo: "Evolução do Score", desc: "Gráfico da evolução do seu domínio ao longo das sessões para cada tema. Veja claramente sua curva de aprendizado." },
                  { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", titulo: "Tópicos Dominados", desc: "Tópicos que você explicou corretamente em múltiplas sessões são marcados como consolidados." },
                  { icon: Zap, color: "text-red-500", bg: "bg-red-50 border-red-200", titulo: "Histórico de Erros", desc: "Erros recorrentes ficam em destaque. Quando você os supera em sessões seguintes, são marcados como superados." },
                  { icon: Target, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", titulo: "Plano de Estudo", desc: "Com base no seu histórico, a IA gera uma lista priorizada: o que rever com urgência e o que já está consolidado." },
                ].map((item, i) => (
                  <div key={i} className={`border rounded-2xl p-4 ${item.bg}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <item.icon size={13} className={item.color} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.titulo}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 flex items-start gap-3">
                <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">
                  O perfil é filtrado por <span className="text-white font-black">Jornada → Matéria → Tema</span>, dando uma visão granular do seu desempenho em cada área, não apenas um número genérico.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ JORNADAS ══ */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-6">
            <Award size={16} className="text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Jornadas Disponíveis</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { nome: "Concurso Público", cor: "border-blue-200 bg-blue-50", badge: "bg-blue-600", desc: "Mais de 30 matérias do edital. Simulador adaptado para as principais bancas: Cebraspe, FGV, FCC, Vunesp." },
              { nome: "ENEM", cor: "border-emerald-200 bg-emerald-50", badge: "bg-emerald-600", desc: "Conteúdo alinhado à matriz do ENEM. Foco em competências e interdisciplinaridade, com linguagem da prova." },
              { nome: "OAB", cor: "border-amber-200 bg-amber-50", badge: "bg-amber-500", desc: "Matérias do 1º e 2º exame da OAB. Questões no formato da FGV com análise de casos práticos." },
            ].map((j, i) => (
              <div key={i} className={`border-2 ${j.cor} rounded-2xl p-5`}>
                <div className={`inline-block text-[9px] font-black text-white uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${j.badge}`}>
                  {j.nome}
                </div>
                <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{j.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══ BENEFÍCIOS ══ */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Por Que Funciona</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Zap, color: "text-amber-500", titulo: "Aprenda 3x mais rápido", desc: "Ensinar obriga seu cérebro a organizar o conhecimento. Uma sessão de 20 minutos no Auditório equivale a horas de leitura passiva." },
              { icon: Target, color: "text-red-500", titulo: "Descubra seus pontos cegos", desc: "Você não sabe o que não sabe — até tentar explicar. Nossa IA revela exatamente as lacunas que você jamais perceberia estudando sozinho." },
              { icon: Brain, color: "text-purple-600", titulo: "Memória de longo prazo", desc: "A recuperação ativa — tentar lembrar sem consultar — é o mecanismo que cimenta o conhecimento na memória permanente." },
              { icon: Clock, color: "text-blue-600", titulo: "Estudo focado, sem desperdício", desc: "O plano de estudo personalizado direciona seu tempo para o que realmente importa, eliminando o estudo aleatório." },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                  <b.icon size={16} className={b.color} />
                </div>
                <div>
                  <p className="text-xs font-black text-black mb-1">{b.titulo}</p>
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══ FAQ ══ */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-5">
            {[
              {
                q: "Preciso saber o assunto antes de usar o Auditório?",
                a: "Sim. O Auditório testa o que você já estudou — não é para aprender do zero. Estude o tema no seu material de base e depois use o Auditório para consolidar e identificar lacunas.",
              },
              {
                q: "O que é o Modo Guiado e quando usá-lo?",
                a: "No Modo Guiado, a IA conduz a sessão fazendo perguntas sobre o tema, ideal para quem ainda não tem confiança de explicar livremente. Já o Modo Livre permite que você fale sem interrupções, como uma aula completa.",
              },
              {
                q: "Como o simulador cria questões originais?",
                a: "Nossa IA foi treinada com padrões de provas reais de cada banca. Ela gera questões inéditas que replicam estilo, vocabulário e nível de dificuldade — não reusa questões já existentes.",
              },
              {
                q: "O que é o Perfil Cognitivo e como ele evolui?",
                a: "A cada sessão, o sistema registra seus erros, omissões e tópicos dominados. Com o tempo, ele identifica padrões — quais temas você supera e quais continuam sendo pontos fracos — e monta um plano de estudo sob medida.",
              },
              {
                q: "Posso usar em qualquer área de concurso?",
                a: "Sim. O banco de matérias cobre mais de 30 disciplinas de concursos federais e estaduais, além das trilhas específicas de ENEM e OAB.",
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <p className="text-sm font-black text-black mb-1.5">{item.q}</p>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══ CTA ══ */}
        <div className="bg-black border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(37,99,235,0.4)] p-10 text-center flex flex-col items-center gap-5">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full">
            Comece hoje
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            Pare de estudar mais.<br />
            <span className="text-blue-400">Comece a aprender de verdade.</span>
          </h2>
          <p className="text-xs font-semibold text-slate-400 max-w-sm leading-relaxed">
            Crie sua conta gratuitamente e faça sua primeira sessão no Auditório. Você vai descobrir em minutos o que precisa revisar.
          </p>
          <Link href="/login"
            className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(37,99,235,0.4)]">
            Criar Conta Grátis <ChevronRight size={14} />
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 border-t border-slate-200 mt-4">
        <p className="text-center text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">
          95porcento AI Protocol • 2026
        </p>
      </footer>
    </div>
  );
}
