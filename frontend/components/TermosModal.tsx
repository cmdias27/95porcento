"use client";

import { useRef, useState } from "react";
import { X, ScrollText, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Textos legais ────────────────────────────────────────────

const SECOES = [
  {
    titulo: "TERMOS DE USO",
    corpo: `Última atualização: maio de 2026

1. ACEITAÇÃO DOS TERMOS
Ao criar uma conta e utilizar a plataforma 95porcento, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, solicitamos que não utilize a plataforma.

2. SOBRE A PLATAFORMA
O 95porcento é uma plataforma de aprendizagem ativa baseada na Pirâmide de Glasser, que utiliza Inteligência Artificial para auditar explicações do usuário e fornecer relatórios de desempenho cognitivo, identificando lacunas e pontos de melhoria no conhecimento.

3. CADASTRO E RESPONSABILIDADES DO USUÁRIO
3.1 Para utilizar os recursos da plataforma, é necessário criar uma conta fornecendo nome completo e endereço de e-mail válido.
3.2 O usuário é inteiramente responsável pela veracidade, precisão e atualização das informações fornecidas no cadastro.
3.3 O usuário deve manter sua senha em sigilo absoluto e é responsável por toda atividade realizada em sua conta.
3.4 É proibido compartilhar, ceder ou transferir as credenciais de acesso a terceiros.
3.5 Em caso de suspeita de acesso não autorizado, o usuário deve comunicar imediatamente a plataforma pelo canal de suporte.

4. USO PERMITIDO E PROIBIDO
4.1 A plataforma destina-se exclusivamente ao uso pessoal, educacional e não comercial.
4.2 É expressamente proibido:
   a) Reproduzir, distribuir, sublicenciar ou comercializar conteúdos, relatórios ou tecnologias da plataforma sem autorização prévia e por escrito;
   b) Utilizar a plataforma para fins ilícitos, fraudulentos ou que violem direitos de terceiros;
   c) Realizar engenharia reversa, descompilar ou tentar acessar o código-fonte da plataforma;
   d) Utilizar scripts automatizados, bots ou qualquer meio para acessar a plataforma de forma não autorizada;
   e) Publicar conteúdo ofensivo, discriminatório, difamatório ou que viole a legislação vigente.

5. PROPRIEDADE INTELECTUAL
5.1 A marca, interface, design, tecnologia e conteúdo editorial da plataforma 95porcento são de propriedade exclusiva de seus titulares, protegidos pela legislação de propriedade intelectual vigente.
5.2 Os relatórios e análises gerados pela IA com base nas sessões de explicação do próprio usuário pertencem ao usuário que os produziu.
5.3 O usuário concede ao 95porcento uma licença não exclusiva para utilizar os dados das sessões de forma anonimizada com o fim de melhorar os algoritmos da plataforma.

6. DISPONIBILIDADE E LIMITAÇÃO DE RESPONSABILIDADE
6.1 A plataforma empenha-se em manter disponibilidade contínua, mas não garante funcionamento ininterrupto, podendo sofrer indisponibilidades por manutenção ou fatores externos.
6.2 O 95porcento não garante resultados específicos de aprendizagem ou aprovação em provas e concursos. O desempenho depende exclusivamente do esforço, dedicação e método de estudo do próprio usuário.
6.3 A plataforma não se responsabiliza por danos decorrentes do uso indevido da conta pelo próprio usuário ou por terceiros mediante acesso com suas credenciais.

7. CANCELAMENTO E EXCLUSÃO DE CONTA
7.1 O usuário pode solicitar o cancelamento de sua conta a qualquer momento pelo canal de suporte: suporte@95porcento.com.br.
7.2 Após o cancelamento, os dados serão retidos pelo prazo legal de 5 (cinco) anos e então eliminados, salvo obrigação legal em contrário.

8. ALTERAÇÕES NOS TERMOS
Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações relevantes serão comunicadas com antecedência mínima de 30 dias por e-mail cadastrado. O uso continuado da plataforma após a data de vigência das alterações constitui aceite das novas condições.`,
  },
  {
    titulo: "POLÍTICA DE PRIVACIDADE E ADEQUAÇÃO À LGPD",
    corpo: `Lei Geral de Proteção de Dados Pessoais – Lei nº 13.709/2018

1. IDENTIFICAÇÃO DO CONTROLADOR
Razão Social: 95porcento Plataforma de Aprendizagem
E-mail do Encarregado de Dados (DPO): privacidade@95porcento.com.br

2. DADOS PESSOAIS COLETADOS
A plataforma coleta e trata os seguintes dados pessoais:

Dados fornecidos pelo usuário:
• Nome completo
• Endereço de e-mail
• Senha (armazenada de forma criptografada)

Dados gerados pelo uso da plataforma:
• Sessões de explicação realizadas (transcrições e anotações)
• Relatórios de desempenho gerados
• Histórico de matérias e temas estudados
• Pontuações e métricas cognitivas

Dados técnicos coletados automaticamente:
• Endereço IP
• Tipo de dispositivo e sistema operacional
• Navegador utilizado
• Data e horário de acesso
• Identificadores de sessão

3. FINALIDADE DO TRATAMENTO DE DADOS
Seus dados pessoais são tratados para as seguintes finalidades:
• Criação, autenticação e gerenciamento da conta do usuário
• Prestação dos serviços de aprendizagem e geração de relatórios
• Personalização da experiência e evolução do perfil cognitivo
• Comunicações operacionais relacionadas à conta (com consentimento prévio)
• Melhoria contínua dos algoritmos e da plataforma, mediante análise de dados anonimizados
• Cumprimento de obrigações legais e regulatórias

4. BASE LEGAL PARA O TRATAMENTO
O tratamento de dados pessoais nesta plataforma fundamenta-se nas seguintes bases legais previstas na LGPD:
• Consentimento do titular (Art. 7º, inciso I): para comunicações de marketing e uso de imagem/nome
• Execução de contrato (Art. 7º, inciso V): para prestação dos serviços contratados
• Cumprimento de obrigação legal (Art. 7º, inciso II): para retenção de dados conforme legislação
• Legítimo interesse do controlador (Art. 7º, inciso IX): para melhoria dos serviços, com observância dos direitos do titular

5. COMPARTILHAMENTO DE DADOS
Seus dados poderão ser compartilhados com:
• Google Firebase / Firestore: infraestrutura de armazenamento e autenticação (servidores seguros, com certificação SOC 2)
• Provedores de Inteligência Artificial: para processamento das sessões e geração de relatórios, mediante anonimização sempre que possível
• Autoridades públicas: quando exigido por lei, decisão judicial ou autoridade competente

O 95porcento NÃO vende, aluga ou comercializa dados pessoais de usuários a terceiros para fins publicitários.

6. RETENÇÃO E ELIMINAÇÃO DOS DADOS
• Dados da conta: mantidos enquanto a conta estiver ativa
• Após solicitação de exclusão: dados são anonimizados em até 30 dias e eliminados definitivamente em até 5 anos (prazo legal)
• Dados de logs técnicos: mantidos por até 12 meses

7. DIREITOS DO TITULAR DOS DADOS
Nos termos da LGPD, você tem direito a:
✓ Confirmar a existência do tratamento de seus dados
✓ Acessar seus dados pessoais
✓ Corrigir dados incompletos, inexatos ou desatualizados
✓ Solicitar anonimização, bloqueio ou eliminação de dados desnecessários
✓ Portabilidade dos dados a outro fornecedor de serviço
✓ Informação sobre compartilhamentos realizados
✓ Revogar o consentimento a qualquer momento, sem prejuízo dos serviços essenciais

Para exercer qualquer desses direitos, entre em contato:
privacidade@95porcento.com.br — Prazo de resposta: até 15 dias úteis.

8. SEGURANÇA DA INFORMAÇÃO
O 95porcento adota medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo:
• Criptografia em trânsito (TLS/HTTPS) e em repouso
• Controle de acesso baseado em funções (RBAC)
• Monitoramento contínuo de segurança
• Backups regulares e política de recuperação de desastres
• Revisão periódica das práticas de segurança

Em caso de incidente de segurança que possa afetar seus dados, você será notificado nos prazos previstos pela LGPD.

9. TRANSFERÊNCIA INTERNACIONAL DE DADOS
Alguns de nossos provedores (Google, OpenAI) processam dados em servidores localizados fora do Brasil. Essas transferências ocorrem com provedores que oferecem nível de proteção equivalente ao exigido pela LGPD e/ou com cláusulas contratuais padrão aprovadas pela ANPD.`,
  },
  {
    titulo: "POLÍTICA DE COOKIES",
    corpo: `1. O QUE SÃO COOKIES
Cookies são pequenos arquivos de texto armazenados em seu dispositivo pelo navegador quando você acessa um site ou aplicação web. Eles permitem que a plataforma reconheça seu dispositivo e melhore sua experiência de uso.

2. TIPOS DE COOKIES UTILIZADOS

Cookies Essenciais (Obrigatórios):
• Autenticação: mantêm sua sessão ativa após o login, evitando que você precise se autenticar a cada visita
• Segurança: protegem contra ataques CSRF e garantem a integridade das requisições
• Preferências básicas: armazenam configurações essenciais de funcionamento
Estes cookies não podem ser desativados sem comprometer o funcionamento da plataforma.

Cookies Analíticos (Opcionais):
• Google Analytics: utilizados para entender como os usuários interagem com a plataforma (páginas visitadas, tempo de uso, fluxos de navegação). Os dados são anonimizados antes do processamento.
• Métricas de desempenho: monitoram a performance técnica da plataforma para identificar e corrigir problemas.

Cookies de Preferência (Opcionais):
• Armazenam suas preferências de interface e configurações personalizadas

3. COMO GERENCIAR COOKIES
Você pode controlar e gerenciar cookies nas configurações do seu navegador. Cada navegador possui procedimento próprio:
• Chrome: Configurações > Privacidade e Segurança > Cookies
• Firefox: Opções > Privacidade e Segurança
• Safari: Preferências > Privacidade
• Edge: Configurações > Privacidade, pesquisa e serviços

A desativação de cookies essenciais afetará o funcionamento da plataforma, podendo impossibilitar o login e o uso dos serviços.

4. COOKIES DE TERCEIROS
Alguns cookies são definidos por serviços de terceiros (Google, Firebase) que utilizamos. Estes terceiros possuem suas próprias políticas de privacidade e cookies, pelas quais o 95porcento não se responsabiliza.

5. PERÍODO DE RETENÇÃO
• Cookies de sessão: expiram ao fechar o navegador
• Cookies persistentes: expiram conforme prazo definido (geralmente 30 a 365 dias)
• Você pode apagar cookies a qualquer momento nas configurações do navegador`,
  },
  {
    titulo: "AUTORIZAÇÃO DE USO DE NOME EM CAMPANHAS PUBLICITÁRIAS",
    corpo: `Esta seção trata de uma autorização VOLUNTÁRIA e OPCIONAL. Você pode utilizar a plataforma normalmente caso opte por não concedê-la.

1. OBJETO DA AUTORIZAÇÃO
Ao marcar a opção de autorização de marketing no cadastro, você concede expressamente ao 95porcento o direito de:

a) Utilizar seu primeiro nome (ex.: "João conquistou 90% de retenção no 95porcento") em:
   • Depoimentos e cases de sucesso no site institucional
   • Publicações em redes sociais (Instagram, LinkedIn, YouTube)
   • Materiais impressos e digitais de divulgação
   • Apresentações institucionais e pitches para investidores

b) Mencionar sua jornada de aprendizagem de forma genérica ou anonimizada (ex.: "Estudante de Direito que passou no OAB usando o método"), sem expor dados sensíveis, notas ou informações que possam constranger.

c) Utilizar métricas de uso anonimizadas (ex.: "usuários aumentaram sua retenção em média X%") em comunicações de marketing.

2. LIMITAÇÕES EXPRESSAS
O 95porcento compromete-se a:
• NÃO divulgar notas de desempenho, pontuações específicas ou resultados de avaliações sem seu consentimento adicional e expresso
• NÃO associar sua imagem ou identidade a conteúdos negativos, depreciativos ou que causem constrangimento
• NÃO revelar informações sobre matérias específicas estudadas sem autorização explícita
• NÃO vender ou transferir esta autorização a terceiros

3. REVOGAÇÃO
Esta autorização pode ser revogada a qualquer momento, sem ônus ou prejuízo ao acesso à plataforma, mediante:
• E-mail para: marketing@95porcento.com.br
• Assunto: "Revogação de Autorização de Marketing – [seu nome]"
• Prazo para processamento da revogação: até 10 dias úteis

4. VIGÊNCIA
Esta autorização tem vigência por prazo indeterminado a partir da data de aceite, podendo ser revogada conforme previsto no item 3.

Ao marcar a opção correspondente no cadastro, você declara ter lido e compreendido integralmente os termos desta autorização, concedendo-a de forma livre, informada e inequívoca, nos termos do Art. 7º, inciso I, da LGPD.`,
  },
];

// ─── Componente ───────────────────────────────────────────────

type Props = {
  onClose: () => void;
  onAccept: () => void;
};

export function TermosModal({ onClose, onAccept }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [leuTudo, setLeuTudo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [secaoAtiva, setSecaoAtiva] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const p = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    setProgresso(Math.min(p, 1));
    if (p >= 0.97) setLeuTudo(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="bg-white w-full sm:max-w-2xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col border-2 border-black"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black flex-shrink-0">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-blue-600" />
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Documentos Legais
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 bg-slate-100 flex-shrink-0">
          <motion.div
            className="h-full bg-blue-600 rounded-full origin-left"
            animate={{ scaleX: progresso }}
            transition={{ duration: 0.1 }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {/* Tabs das seções */}
        <div className="flex gap-1 px-4 pt-3 pb-1 flex-shrink-0 overflow-x-auto scrollbar-none">
          {SECOES.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setSecaoAtiva(i);
                scrollRef.current?.scrollTo({ top: 0 });
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                secaoAtiva === i
                  ? "bg-black text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {i + 1}. {s.titulo.split(" ")[0]}
              {s.titulo.split(" ")[1] ? " " + s.titulo.split(" ")[1] : ""}
            </button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
        >
          {SECOES.map((s, i) => (
            <div key={i} className={secaoAtiva === i ? "block" : "hidden"}>
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 pb-2 border-b border-slate-200">
                {s.titulo}
              </h3>
              <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                {s.corpo}
              </pre>
            </div>
          ))}

          {/* Aviso de rolar até o final (última aba) */}
          {secaoAtiva === SECOES.length - 1 && !leuTudo && (
            <div className="mt-6 flex flex-col items-center gap-1 text-slate-400 animate-bounce">
              <ChevronDown size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">Role até o final para aceitar</span>
            </div>
          )}
        </div>

        {/* Navegação entre abas */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => { setSecaoAtiva(Math.max(0, secaoAtiva - 1)); scrollRef.current?.scrollTo({ top: 0 }); }}
            disabled={secaoAtiva === 0}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black disabled:opacity-30 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-[9px] text-slate-400 font-bold">
            {secaoAtiva + 1} / {SECOES.length}
          </span>
          {secaoAtiva < SECOES.length - 1 ? (
            <button
              onClick={() => { setSecaoAtiva(secaoAtiva + 1); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
            >
              Próximo →
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>

        {/* Rodapé de aceite */}
        <div className="px-6 pb-6 pt-3 border-t-2 border-black flex-shrink-0 space-y-3">
          {!leuTudo && secaoAtiva === SECOES.length - 1 && (
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center">
              Role até o final da última seção para habilitar o botão
            </p>
          )}
          {secaoAtiva < SECOES.length - 1 && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Leia todas as {SECOES.length} seções antes de aceitar
            </p>
          )}
          <button
            onClick={onAccept}
            disabled={!leuTudo || secaoAtiva < SECOES.length - 1}
            className="w-full bg-black text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(37,99,235,0.3)]"
          >
            <CheckCircle2 size={14} /> Li e aceito todos os documentos
          </button>
        </div>
      </motion.div>
    </div>
  );
}
