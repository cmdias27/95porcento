// ARQUIVO GERADO AUTOMATICAMENTE PELO BACKEND
export interface Materia {
  id: string;
  nome: string;
  temas: string[];
  totalQuestoes: number;
}

export interface Jornada {
  nome: string;
  materias: Materia[];
}

export const JORNADAS_ESTUDO: Jornada[] = [
  {
    nome: "Concurso",
    materias: [
      {
        id: "afo_(administração_financeira_e_orçamentária)",
        nome: "AFO (Administração Financeira e Orçamentária)",
        totalQuestoes: 1077,
        temas: ["Introdução à Administração Financeira e Orçamentária", "Atividade Financeira do Estado", "Orçamento Público", "Ciclo ou Processo Orçamentário", "Lei Complementar - Art. 165, § 9º da CF/88", "Execução Orçamentária e Financeira", "Controle e Avaliação", "Plano Plurianual - PPA", "Lei de Diretrizes Orçamentárias - LDO", "Lei Orçamentária Anual - LOA", "Princípios Orçamentários", "Receita Pública", "Estágios/Etapas da Receita Pública", "Despesa Pública", "Estágios/Etapas da Despesa Pública", "Restos a Pagar - RP", "Sistemas de Informações: SIOP (antigo SIDOR), SIAFI e SIAFEM", "Lei 4.320/64 - Normas Gerais de Direito Financeiro", "Lei Complementar nº 101/2000 e suas alterações (Lei de Responsabilidade Fiscal - LRF)", "Receita Corrente Líquida - RCL", "Regra de Ouro na LRF", "Renúncia de Receita", "Despesa Pública (Art. 15 ao Art. 24)", "Despesa Obrigatória de Caráter Continuado - DOCC", "Limite Alerta", "Limite Prudencial", "Limite Ultrapassado (Excesso)", "Gestão Patrimonial (Art. 43 ao Art. 47)", "Relatórios", "Relatório Resumido da Execução Orçamentária - RREO"]
      },
      {
        id: "administração_geral",
        nome: "Administração Geral",
        totalQuestoes: 1158,
        temas: ["Introdução à Administração", "Eficiência, eficácia e efetividade", "Processo organizacional (PODC)", "Planejamento", "Organização", "Direção", "Controle", "Princípios gerais da administração segundo Fayol", "Teoria da burocracia", "Abordagem sistêmica", "Abordagem contingencial", "Planejamento e estratégia", "Planejamento Estratégico", "Diagnóstico estratégico – Análise SWOT", "Análise competitiva e estratégias genéricas", "Modelo de Cinco Forças de Porter", "Gestão estratégica", "Balanced Scorecard (BSC)", "Estrutura Organizacional", "Estrutura Matricial", "Motivação", "Liderança", "Cultura organizacional", "Controle e avaliação", "Indicadores de desempenho", "Gestão de mudanças", "Gestão de processos", "Gestão da Qualidade", "Processo decisório", "Gestão de Pessoas"]
      },
      {
        id: "administração_pública",
        nome: "Administração Pública",
        totalQuestoes: 833,
        temas: ["Administração Pública", "Características da Administração Pública", "Princípios aplicáveis à Administração Pública", "Administração Pública em sentido subjetivo e objetivo", "Administração Pública em sentido amplo e estrito", "Evolução dos modelos/paradigmas de gestão", "Administração patrimonialista", "Administração burocrática", "Gerencialismo", "O Novo Gerencialismo Público ou Nova Gestão Pública", "Paradigma pós-burocrático", "Decreto Lei nº 200/67", "Plano Diretor de Reforma do Aparelho do Estado – PDRAE (1995)", "Governança, governabilidade e accountability", "Decreto nº 9.203/2017", "Accountability", "Gestão de Pessoas na Administração Pública", "Modelo de Gestão", "Etapas da Gestão por Competências", "Gestão estratégica da qualidade ou Gestão da Qualidade Total", "Ciclo PDCL", "Ciclo PDCA", "Gestão de Processos", "Gestão por processos", "Lean Management", "Liderança no Setor Público", "Ética no Setor Público", "Conflito de Interesses (Lei nº 12.813)", "Governo Eletrônico", "Transparência"]
      },
      {
        id: "auditoria",
        nome: "Auditoria",
        totalQuestoes: 934,
        temas: ["Conceito de Auditoria", "Objetivo da Auditoria", "NBC TA – Estrutura Conceitual", "Definição e Objetivo do Trabalho de Asseguração", "Trabalho de Asseguração Razoável", "Trabalho de Asseguração Limitada", "Relação de Três Partes", "Auditor", "Partes Responsáveis", "Objeto Apropriado", "Critérios Aplicáveis", "Evidência de Auditoria", "Risco de Auditoria", "Plano de Auditoria Baseado no Risco", "Materialidade no Planejamento", "Determinação da Materialidade no Planejamento e na Execução da Auditoria", "Risco de Distorção Relevante", "Risco Inerente", "Risco de Controle", "Risco de Detecção", "Amostragem de Auditoria", "Fraude e Erro", "Responsabilidade do Auditor Quanto à Fraude", "Responsabilidade da Administração quanto à Fraude", "Documentação de Auditoria", "Formação da Opinião e Emissão do Relatório do Auditor Independente", "Tipos de Relatório/Opinião do Auditor", "Formato do Relatório e Parecer", "Auditoria Independente", "Independência"]
      },
      {
        id: "contabilidade_geral",
        nome: "Contabilidade Geral",
        totalQuestoes: 1149,
        temas: ["Objeto, Finalidade, Técnicas Contábeis, Equação Patrimonial", "Teoria das Contas", "Estrutura Conceitual Básica", "Princípios de Contabilidade", "Fatos Contábeis", "Regime de Competência", "Regime de Caixa", "Método das Partidas Dobradas", "Livros de Escrituração", "Livro Diário", "Livro Razão", "Lançamentos", "Contas", "Plano de Contas", "Balancete de Verificação", "Resultado", "Regime de Contabilização", "Operações com Mercadorias", "Estoques", "PEPS", "Média Ponderada Móvel", "UEPS", "Operações com Pessoal", "Operações Financeiras", "Operações com Duplicatas", "Balanço Patrimonial", "Demonstração do Resultado do Exercício", "Demonstração do Fluxo de Caixa", "Demonstração das Mutações do Patrimônio Líquido", "Elaboração e Apresentação das Demonstrações Contábeis"]
      },
      {
        id: "contabilidade_pública",
        nome: "Contabilidade Pública",
        totalQuestoes: 1103,
        temas: ["Conceito de Contabilidade Aplicada ao Setor Público", "Normas Contábeis", "Campo de Aplicação da Contabilidade Pública", "Processo de Convergência às Normas Internacionais de Contabilidade", "Princípios de Contabilidade", "Princípio da Entidade", "Princípio da Competência", "Princípio da Prudência", "Elementos Orçamentários", "Etapas e estágio da receita", "Lançamento", "Arrecadação", "Etapa de controle e avaliação", "Classificações", "Classificação da receita quanto à natureza", "Classificação da receita por fonte", "Etapas e estágio da despesa", "Estágio do empenho", "Estágio da liquidação", "Estágio do pagamento", "Restos a Pagar", "Prescrição e cancelamento de restos a pagar", "Despesas de Exercícios Anteriores", "Escrituração Contábil", "Patrimônio Público", "Reconhecimento do Ativo", "Reconhecimento do Passivo", "Variações Patrimoniais", "Plano de Contas Aplicado ao Setor Público (PCASP)", "Aspectos Gerais das Demonstrações Contábeis (NBC TSP 11)", "Cumprimento da Regra de Ouro"]
      },
      {
        id: "direito_administrativo",
        nome: "Direito Administrativo",
        totalQuestoes: 944,
        temas: ["Introdução ao Direito Administrativo", "Administração Pública", "Fontes do Direito Administrativo", "Princípios da Administração Pública", "Organização Administrativa", "Administração Indireta", "Poderes da Administração", "Atos Administrativos", "Contratos Administrativos", "Licitações", "Serviços Públicos", "Responsabilidade Civil do Estado", "Controle da Administração", "Improbidade Administrativa", "Processo Administrativo - Lei 9.784/99", "Bens Públicos", "Intervenção do Estado na Propriedade e no Domínio Econômico", "Legislação Administrativa"]
      },
      {
        id: "direito_civil",
        nome: "Direito Civil",
        totalQuestoes: 1434,
        temas: ["Lei de Introdução às Normas do Direito Brasileiro - LINDB", "Vigência e Eficácia das Normas Jurídicas (Art. 1º)", "Eficácia da Lei no Tempo (Art. 2º)", "Critérios de Interpretação (hermenêutica) e Integração da Lei (Art. 3º ao 5º)", "Conflitos de Leis no Tempo - Conflito Intertemporal (Art. 6º)", "Eficácia, Aplicação e Conflito de Leis no Espaço - Conflito Interespacial (Art. 7º ao 19, LINDB)", "Teoria Geral do Direito Civil", "Conceito de Direito Civil", "Fontes do Direito Civil", "Pessoas (Art. 1º ao 78)", "Capacidade (Art. 1º, 3º e 4º)", "Incapacidade Absoluta (Art. 3º)", "Incapacidade Relativa (Art. 4º)", "Extinção da Personalidade", "Dos Direitos da Personalidade", "Fatos Jurídicos (Art. 104 a 232)", "Dos Negócios Jurídicos (Art. 104 ao 184)", "Classificação dos negócios jurídicos", "Da Prescrição e da Decadência (Art. 189 ao 211)", "Da Prova (Art. 212 ao 232)", "Direito das Obrigações (Art. 233 ao 420)", "Modalidades das Obrigações – Art. 233 ao 285", "Adimplemento e Extinção das Obrigações (Art. 304 a 388)", "Inadimplemento das Obrigações (Art. 389 ao 420)", "Várias Espécies de Contrato (Art. 481 ao 853)", "Responsabilidade Civil (Art. 927 ao 954)", "Direito das Coisas (Art. 1.196 ao 1.510)", "Posse (Art. 1196 ao 1.224)", "Direito à Usucapião", "Teoria Geral dos Direitos Reais", "Direito Real sobre Coisas Próprias - Propriedade (Art. 1.228 ao 1.276)", "Da Usucapião", "Direitos de Vizinhança (Art. 1.277 ao 1.313)", "Condomínio Geral (Art. 1.314 ao 1.330)", "Direito de Família (Art. 1.511 ao 1.783)", "Casamento (Art. 1.511 ao 1.582)", "União Estável (Art. 1.723 ao 1.727)", "Poder Familiar", "Dos Alimentos", "Direito das Sucessões (Art. 1.784 ao 2.027)", "Sucessão Legítima (Art. 1.829 ao 1.856)", "Sucessão Testamentária (Art. 1.857 ao 1.990)", "Inventário, Partilha e Arrolamento (Art. 1.991 ao 2.027)"]
      },
      {
        id: "direito_constitucional",
        nome: "Direito Constitucional",
        totalQuestoes: 1171,
        temas: ["Teoria Geral da Constituição", "Teoria geral do Estado: formas de Estado, formas de governo, sistemas de governo, regimes de governo e mecanismo de freios e contrapesos", "Constitucionalismo e Neoconstitucionalismo", "Poder Constituinte", "Aplicabilidade das normas constitucionais, eficácia e aplicabilidade das normas constitucionais", "Interpretação da Constituição ou hermenêutica constitucional", "Direitos e garantias fundamentais - Título II - Artigos 5º a 17 da CF", "Remédios constitucionais ou writs constitucionais", "Direitos sociais (artigos 6º a 11 da CF)", "Direitos Políticos (artigos 14 a 16 da CF)", "Organização do Estado - Título III - Artigos 18 a 43", "Administração Pública (artigos 37 a 43 da CF)", "Organização dos Poderes - Título IV da CF - Artigos 44 a 135", "Poder Legislativo (artigos 44 a 75 da CF)", "Poder Executivo (artigos 76 a 91 da CF)", "Poder Judiciário (artigos 92 a 126 da CF)", "Funções essenciais à Justiça (artigos 127 a 135 da CF)", "Defesa do Estado e das instituições democráticas - Título V da CF - artigos 136 a 144", "Tributação e Orçamento - Título VI da CF - artigos 145 a 169", "Ordem Econômica e Financeira - Título VII da CF - artigos 170 a 192", "Ordem Social - Título VIII da CF - artigos 193 a 232", "Controle de constitucionalidade ou controle de constitucionalidade das leis e dos atos normativos"]
      },
      {
        id: "direito_eleitoral",
        nome: "Direito Eleitoral",
        totalQuestoes: 253,
        temas: ["Conceito, Histórico, Fontes e Princípios do Direito Eleitoral", "Princípio da Anterioridade Eleitoral", "Justiça Eleitoral - Órgãos", "Ministério Público Eleitoral", "Sistemas Eleitorais", "Sistema Eleitoral Proporcional", "Sistema Eleitoral Majoritário", "Atos Preparatórios da Votação", "Apuração", "Nulidades", "Garantias Eleitorais", "Recursos Eleitorais", "Crimes Eleitorais e Processo Penal Eleitoral", "Crimes eleitorais previstos na Lei n. 9.504/97", "Rito processual penal", "Alistamento Eleitoral - Resolução n. 23.659/2021", "Elegibilidade", "Direitos Políticos", "Lei das Inelegibilidades - Lei Complementar n. 64/90", "Incompatibilidade e desincompatibilização", "Lei n. 6.091/74 - fornecimento gratuito de transporte, em dias de eleição, a eleitores residentes nas zonas rurais", "Lei das Eleições - Lei n. 9.504/97", "Coligações", "Da Arrecadação e da Aplicação de Recursos nas Campanhas Eleitorais", "Propaganda Eleitoral", "Captação Ilícita de Sufrágio", "Condutas Vedadas a Agentes Públicos", "Lei n. 9.096/95 - Partidos Políticos", "Criação e registro dos partidos políticos", "Das finanças e contabilidade dos partidos: prestação de contas (arts. 30 a 37-A)"]
      },
      {
        id: "direito_empresarial",
        nome: "Direito Empresarial",
        totalQuestoes: 1009,
        temas: ["Histórico, Conceito, Objeto e Fontes", "Do Empresário", "Da Empresa", "Sociedade Empresária", "Da Sociedade Limitada", "Da Sociedade Anônima", "Da Sociedade em Comandita por Ações", "Da Sociedade Cooperativa", "Das Sociedades Coligadas", "Operações Societárias", "Nome Empresarial", "Registro e Escrituração", "Do Estabelecimento empresarial", "Direito de Propriedade Industrial", "Requisitos para Registro e Patente", "Procedimento Administrativo", "Títulos de Crédito", "Conceitos, Características e Princípios", "Endosso, aval, protesto, saque e aceite", "Ações cambiárias", "Cheque", "Duplicata", "Da Recuperação Judicial", "Da Recuperação Extrajudicial", "Da Falência", "Dos Contratos Empresariais", "Compra e Venda Mercantil", "Leasing ou Arrendamento Mercantil", "Alienação Fiduciária", "Contrato de Seguro"]
      },
      {
        id: "direito_financeiro",
        nome: "Direito Financeiro",
        totalQuestoes: 794,
        temas: ["A atividade Financeira do Estado", "Princípios do Direito Financeiro", "Responsabilidade Fiscal", "Competência Legislativa", "Fontes", "Orçamento público", "Ciclo Orçamentário", "Leis Orçamentárias", "Plano Plurianual (PPA)", "Lei de Diretrizes Orçamentárias (LDO)", "Lei Orçamentária Anual (LOA)", "Processo Legislativo Orçamentário", "Emendas", "Créditos Adicionais", "Vedações Orçamentárias Constitucionais", "Despesa pública", "Definição e Classificações", "Estágios da Despesa Pública", "Restos a Pagar", "Despesas Públicas e a Lei de Responsabilidade Fiscal (LRF)", "Despesa com Pessoal", "Limites de Gasto com Pessoal", "Receita pública", "Estágios da Receita Pública", "Receita Corrente Líquida", "Fundos", "Dívida Ativa", "Dívida pública", "Limites para o Endividamento Público", "Espécies de Controle"]
      },
      {
        id: "direito_penal",
        nome: "Direito Penal",
        totalQuestoes: 699,
        temas: ["Fontes do Direito Penal", "Princípios do Direito Penal", "Aplicação da Lei Penal", "Teoria Geral do Crime", "Fato Típico", "Culpabilidade", "Do Concurso de Pessoas", "Teoria Geral das Penas", "Do Concurso de Crimes", "Crimes Contra a Vida", "Lesões Corporais", "Crimes Contra a Honra", "Crimes Contra o Patrimônio", "Crimes Contra a Administração Pública", "Crimes Contra a Administração da Justiça", "Crimes Contra as Finanças Públicas", "Crimes Contra a Incolumidade Pública", "Crimes Contra a Paz Pública", "Crimes Contra a Fé Pública", "Crimes Contra a Dignidade Sexual", "Crimes Contra o Sentimento Religioso e o Respeito aos Mortos", "Crimes Contra a Organização do Trabalho", "Crimes Contra a Propriedade Imaterial", "Legislação Especial"]
      },
      {
        id: "direito_previdenciário",
        nome: "Direito Previdenciário",
        totalQuestoes: 976,
        temas: ["Disposições constitucionais sobre Seguridade Social", "Princípios da Seguridade Social", "Distinção entre Saúde, Assistência e Previdência Social", "Previdência Social", "Regime Geral de Previdência Social - RGPS", "Legislação Previdenciária", "Emenda Constitucional nº 103/2019 - Reforma da Previdência de 2019", "Lei 8.213/91 - Lei de Benefícios da Previdência Social", "Decreto 3.048/99 - Regulamento da Previdência Social", "Equilíbrio financeiro da Previdência Social", "Natureza jurídica das contribuições à Seguridade Social", "Receitas das contribuições sociais", "Contribuição dos segurados", "Contribuição das empresas", "Contribuição sobre a folha salarial", "Contribuição adicional para o Seguro de Acidente do Trabalho - SAT", "Fator acidentário de prevenção - FAP", "Salário-de-contribuição", "Arrecadação e recolhimento das contribuições sociais", "Decadência e prescrição das contribuições sociais", "Segurados obrigatórios", "Dependentes", "Manutenção (período de graça), perda e restabelecimento da qualidade de segurado", "Benefícios do RGPS", "Aposentadoria por incapacidade permanente", "Aposentadoria programada", "Aposentadoria por idade do trabalhador rural", "Auxílio por incapacidade temporária", "Pensão por morte", "Cálculo do valor dos benefícios", "Processo Administrativo Previdenciário"]
      },
      {
        id: "direito_processual_civil",
        nome: "Direito Processual Civil",
        totalQuestoes: 803,
        temas: ["Normas fundamentais e aplicação das normas processuais civis", "Neoconstitucionalismo e Processo Civil", "Princípios do Direito Processual Civil", "Princípio do Devido Processo Legal", "Princípio do Contraditório", "Princípio da Ampla Defesa", "Princípio da Inafastabilidade da Jurisdição", "Princípio da Duração Razoável do Processo", "Princípio da Cooperação", "Princípio da Primazia da Decisão de Mérito", "Função jurisdicional", "Conceito de Jurisdição", "Autotutela", "Autocomposição", "Arbitragem", "Equivalentes jurisdicionais", "Sujeitos do processo", "Conceito e capacidade processual", "Demanda", "Interesse de agir", "Legitimidade ad causam", "Interesse de agir", "Ação", "Competência", "Competência absoluta e competência relativa", "Prorrogação", "Prevenção de competência", "Citação", "Intimação", "Prazos dos atos processuais", "Preclusão"]
      },
      {
        id: "direito_processual_penal",
        nome: "Direito Processual Penal",
        totalQuestoes: 689,
        temas: ["Fontes do Direito Processual Penal", "Sistemas Processuais Penais", "Princípios do Direito Processual Penal", "Presunção de Inocência", "Princípio do Contraditório", "Princípio da Ampla Defesa", "Princípio da Publicidade", "Princípio da Inadmissibilidade das Provas Ilícitas", "Princípio do Juiz Natural", "Princípio da Proporcionalidade", "Lei Processual Penal no Espaço", "Lei Processual Penal no Tempo", "Investigação e Inquérito Policial", "Acordo de Não Persecução Penal", "Ação Penal e Ação Civil Ex Delicto", "Jurisdição e Competência", "Das Provas", "Inutilização da Prova Ilícita", "Exame de Corpo Delito e Perícias", "Da Prisão e da Liberdade Provisória", "Da Prisão Temporária", "Da Liberdade Provisória, com ou sem Fiança", "Recursos", "Habeas Corpus", "Revisão Criminal", "Mandado de Segurança"]
      },
      {
        id: "direito_tributário",
        nome: "Direito Tributário",
        totalQuestoes: 1085,
        temas: ["Conceito de Tributo", "Princípios Constitucionais Tributários", "Princípio da Legalidade", "Princípio da Anterioridade Anual", "Princípio da Noventena", "Princípio da Irretroatividade", "Imunidades Tributárias", "Princípio da Progressividade", "Competência Tributária", "Espécies Tributárias", "Impostos", "Taxas", "Contribuições de melhoria", "Contribuições Sociais", "Obrigação tributária", "Obrigação Principal", "Obrigação Acessória", "Fato Gerador", "Contribuinte", "Lançamento", "Crédito tributário", "Lançamento", "Suspensão do crédito tributário", "Extinção do crédito tributário", "Isenção", "Garantias e privilégios do crédito tributário", "Dívida ativa", "Execução fiscal e processo tributário", "Processo Administrativo", "Lei Complementar nº 5.172/1966 (CTN)"]
      },
      {
        id: "direito_do_trabalho",
        nome: "Direito do Trabalho",
        totalQuestoes: 825,
        temas: ["Conceito do Direito do Trabalho", "Princípios do Direito do Trabalho", "Fontes do Direito do Trabalho", "Interpretação e Integração do Direito do Trabalho", "Da Relação de Trabalho e de Emprego - Distinção", "Trabalho: Requisitos", "Do Contrato de Trabalho", "Empregador", "Contrato individual de trabalho", "Terceirização", "Direitos do Trabalhador na Constituição Federal", "Alteração, Interrupção e Suspensão do Contrato de Trabalho", "Remuneração e Salário", "Equiparação Salarial", "Jornada de Trabalho", "Férias", "Trabalho extraordinário", "Aviso Prévio", "Terminação do contrato de trabalho", "Justa causa", "Indenização", "Estabilidade e FGTS", "FGTS", "Garantia no emprego e estabilidade", "Estabilidade da gestante", "Empregado que sofreu acidente de trabalho", "Direito Coletivo do Trabalho", "Convenção e acordo coletivo de trabalho", "Greve", "Reforma Trabalhista - Lei nº 13.467/2017"]
      },
      {
        id: "direitos_humanos",
        nome: "Direitos Humanos",
        totalQuestoes: 863,
        temas: ["Teoria geral dos direitos humanos", "Conceitos, terminologia, estrutura normativa e fundamentação", "Direito Internacional dos Direitos Humanos", "Direitos humanos, direito humanitário e direito dos refugiados", "Evolução histórica dos direitos humanos", "Características dos direitos humanos", "Categorias e gerações dos direitos humanos", "Sistema Global de Proteção dos Direitos Humanos: Instituições e Mecanismos", "Sistema Global de Proteção dos Direitos Humanos: Instrumentos Normativos", "Carta da ONU", "Declaração Universal dos Direitos Humanos", "Pacto Internacional de Direitos Civis e Políticos", "Pacto Internacional de Direitos Econômicos, Sociais e Culturais", "Convenção contra a Tortura e Outros Tratamentos ou Penas Cruéis, Desumanos e Degradantes", "Regras Mínimas para o Tratamento de Presos", "Convenção sobre os Direitos da Criança", "Convenção sobre os Direitos dos Refugiados", "Convenção para a Prevenção e Repressão do Crime de Genocídio", "Legislação internacional de direitos humanos em relação à orientação sexual e identidade de gênero", "Sistema Interamericano de Proteção aos Direitos Humanos: Instituições", "Corte Interamericana de Direitos Humanos", "Sistema Interamericano de Proteção aos Direitos Humanos: Instrumentos Normativos", "Convenção Americana sobre Direitos Humanos (Pacto de San José)", "Convenção Interamericana para Prevenir e Punir a Tortura", "Convenção Interamericana sobre o Desaparecimento Forçado de Pessoas", "Convenção Interamericana para a Eliminação de Todas as Formas de Discriminação contra as Pessoas Portadoras de Deficiência", "Organização Internacional do Trabalho", "Direito Internacional do Trabalho", "Liberdade sindical e a proteção do direito sindical", "Incorporação de tratados internacionais de direitos humanos no direito brasileiro (EC n.º 45)"]
      },
      {
        id: "economia",
        nome: "Economia",
        totalQuestoes: 1075,
        temas: ["Microeconomia", "Modelo de Oferta e Demanda", "Equilíbrio", "Determinantes da Oferta e Demanda", "Elasticidades", "Teoria do Consumidor", "Equilíbrio do Consumidor", "Teoria da Firma", "Custos Médios e Custo Marginal", "Condição geral de Maximização de Lucros", "Maximização de Lucros em Concorrência Perfeita", "Estruturas de Mercado", "Concorrência Perfeita", "Concorrência Monopolística", "Oligopólio", "Monopólio", "Peso Morto do Monopólio", "Falhas de Mercado", "Externalidades", "Teorema de Coase", "Assimetria de Informação", "Seleção Adversa", "Risco Moral", "Macroeconomia", "Contas Nacionais", "PIB - Definição", "PIB Nominal x Real", "Identidades Macroeconômicas Básicas", "Balanço de Pagamentos", "Introdução ao Papel do Estado na Economia", "Moeda e Agregados Monetários"]
      },
      {
        id: "estatística",
        nome: "Estatística",
        totalQuestoes: 992,
        temas: ["Conceitos Iniciais", "Ramos da Estatística", "Censo", "Amostra", "Proporção Amostral", "Tipos de variáveis", "Cálculo de Medidas Estatísticas", "Séries Estatísticas", "Distribuições de Frequências", "Tipos de Frequências", "Variáveis", "Histograma", "Medidas de Posição", "Mediana", "Moda", "Medidas de Variabilidade", "Variância", "Desvio Padrão", "Covariância e Correlação", "Correlação Linear", "Coeficiente de Correlação Linear", "Assimetria", "Curtose", "Amostragem", "Estatística Inferencial", "Intervalos de Confiança", "Testes de Hipóteses", "Testes de Hipóteses para a Média", "Usando a Distribuição Binomial", "Teste Qui-Quadrado"]
      },
      {
        id: "informática",
        nome: "Informática",
        totalQuestoes: 1121,
        temas: ["Conceitos básicos em Informática", "Conceitos sobre Processamento de Dados", "Bit e Byte", "Hardware", "UCP - Unidade Central de Processamento", "Unidade Lógica e Aritmética", "Tipos de Memórias", "Memória RAM", "Memória ROM", "Memórias Secundárias ou Memórias de Massa", "Disco Rígido ou HD", "Disco de Estado Sólido (SSD)", "Software", "Sistemas Operacionais", "Redes de Computadores", "Internet", "Modelo OSI/ISO", "Arquitetura TCP/IP", "IP", "IPv6", "Camada de Transporte", "TCP", "UDP", "SMTP", "DNS", "HTTP", "HTTPS", "Segurança na Internet", "Ransomware", "Phishing Scam", "Firewall"]
      },
      {
        id: "matemática_financeira",
        nome: "Matemática Financeira",
        totalQuestoes: 1097,
        temas: ["Introdução à Matemática Financeira", "Razões e proporções", "Regras de trêas", "Porcentagem", "Regimes de capitalização", "Juros Simples", "Juros Compostos", "Capitalização Simples", "Capitalização Composta", "Período de capitalização", "Fórmula do Montante na Capitalização Composta", "Taxas equivalentes", "Taxa efetiva", "Taxa nominal", "Taxa real", "Inflação acumulada", "A operação de desconto", "Desconto Simples", "Descontos compostos", "Equivalência de capitais", "Séries uniformes", "Valor futuro ou montante de uma renda certa", "Valor atual ou valor presente de uma renda certa", "Rendas certas perpétuas ou perpetuidades", "Rendas", "Sistema Francês de amortização (PRICE)", "Sistema de amortização constante (SAC)", "Análise de investimento", "Valor Presente Líquido (VPL)", "Taxa Interna de Retorno (TIR)", "Taxa Mínima de Atratividade (TMA)"]
      },
      {
        id: "portugues",
        nome: "Portugues",
        totalQuestoes: 2362,
        temas: ["Interpretação de Texto", "Pressupostos e subentendidos", "Inferência Textual", "Variação Linguística", "Dificuldades da língua portuguesa", "Tipologias e Gêneros Textuais", "Coesão e coerência", "Reescrita de frases e parágrafos do texto", "Figuras e Vícios de Linguagem", "Ortografia oficial e acentuação gráfica", "Morfologia", "Substantivos", "Verbos", "Advérbios", "Preposição", "Conjunções", "Morfossintaxe do período", "Pontuação", "Literatura", "Conhecimentos específicos de Língua Portuguesa"]
      },
      {
        id: "raciocínio_lógico-matemático",
        nome: "Raciocínio Lógico-Matemático",
        totalQuestoes: 837,
        temas: ["Tabelas Verdade", "Princípios Fundamentais da Lógica Proposicional ou Três Leis do Pensamento", "Proposições", "Operadores Lógicos", "Conectivos Lógicos", "Conjunção e", "Disjunção Inclusiva ou", "Condicional se então", "Bicondicional se e somente se", "Condição suficiente ou necessária", "Leis de Morgan", "Equivalências Lógicas", "Tautologia", "Contradição", "Quantificadores Lógicos", "Lógica de Argumentação", "Regras de Inferência", "Modus Ponens", "Modus Tollens", "Silogismo Hipotético", "Sofismas e Falácias", "Falácias Formais", "Verdade e Validade", "Análise Combinatória", "PFC Princípio Fundamental da Contagem", "Permutação simples", "Arranjo Simples", "Combinação Simples", "Probabilidade", "Probabilidade Condicional"]
      },
      {
        id: "redação_oficial",
        nome: "Redação Oficial",
        totalQuestoes: 1104,
        temas: ["As comunicações oficiais", "Aspectos gerais da redação oficial", "Atributos da Redação Oficial", "Clareza e precisão", "Objetividade", "Concisão", "Coesão e coerência", "Impessoalidade", "Formalidade e padronização", "Pronomes de Tratamento", "Signatários", "Padrão Ofício", "Partes do documento no Padrão Ofício", "Cabeçalho", "Identificação do expediente", "Endereçamento", "Assunto", "Texto do documento", "Fechos para comunicações", "Identificação do signatário", "Formatação e apresentação", "Ortografia e Gramática na Redação Oficial", "Ortografia", "Sintaxe", "Semântica", "Os atos normativos", "Questões fundamentais da elaboração normativa", "Clareza e determinação das normas", "Técnica legislativa e atos normativos", "O processo legislativo"]
      },
      {
        id: "ética_no_serviço_público",
        nome: "Ética no Serviço Público",
        totalQuestoes: 439,
        temas: ["Ética, moral, princípios e valores", "Ética na Administração Pública", "Ética: democracia, exercício de cidadania", "Decreto nº 1.171/94 - Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal", "Regras Deontológicas", "Principais deveres do servidor público", "Vedações ao servidor público", "Comissões de Ética", "Sistema de Gestão da Ética do Poder Executivo Federal - Decreto nº 6.029 de 2007", "Lei 8.429/92 - Improbidade Administrativa", "Lei nº 12.846/2013 - Responsabilização administrativa e civil de pessoas jurídicas"]
      },
    ]
  },
  {
    nome: "ENEM",
    materias: [
      {
        id: "artes",
        nome: "Artes",
        totalQuestoes: 22,
        temas: ["Arte na Pré-História e Antiguidade", "Movimentos Artísticos Europeus (Renascimento a Romantismo)", "Arte Moderna e Vanguardas", "Arte Contemporânea e Mídias Digitais", "Patrimônio Cultural e Arte Brasileira", "Elementos Visuais, Cênicos e Musicais"]
      },
      {
        id: "biologia",
        nome: "Biologia",
        totalQuestoes: 164,
        temas: ["Ecologia e Sustentabilidade", "Citologia e Metabolismo Energético", "Genética e Biotecnologia", "Fisiologia Humana e Saúde", "Evolução e Origem da Vida", "Botânica e Reino Vegetal", "Reino Animal", "Microbiologia e Doenças"]
      },
      {
        id: "educação_física",
        nome: "Educação Física",
        totalQuestoes: 20,
        temas: ["Esporte, Mídia e Espetáculo", "Práticas Corporais e Saúde", "Padrões Estéticos e a Ditadura da Beleza", "Danças, Lutas e Patrimônio Corporal"]
      },
      {
        id: "espanhol",
        nome: "Espanhol",
        totalQuestoes: 33,
        temas: ["Compreensão de Textos em Espanhol", "Falsos Cognatos e Vocabulário", "Aspectos Culturais Hispano-americanos", "Gramática Aplicada à Interpretação"]
      },
      {
        id: "filosofia",
        nome: "Filosofia",
        totalQuestoes: 46,
        temas: ["Filosofia Antiga: Pré-Socráticos, Sócrates, Platão e Aristóteles", "Filosofia Helenística e Medieval", "Filosofia Moderna: Racionalismo e Empirismo", "Iluminismo e Criticismo Kantiano", "Filosofia Contemporânea", "Ética, Moral e Filosofia Política"]
      },
      {
        id: "física",
        nome: "Física",
        totalQuestoes: 126,
        temas: ["Mecânica: Cinemática e Dinâmica", "Energia, Trabalho e Potência", "Termologia e Calorimetria", "Óptica Geométrica e Fenômenos Luminosos", "Ondulatória e Acústica", "Eletrodinâmica e Circuitos", "Eletrostática e Eletromagnetismo", "Física Moderna"]
      },
      {
        id: "geografia",
        nome: "Geografia",
        totalQuestoes: 128,
        temas: ["Geografia Física: Clima, Relevo e Vegetação", "Geografia Agrária e Estrutura Fundiária", "Demografia e Dinâmica Populacional", "Urbanização e Espaço Citadino", "Geopolítica e Globalização", "Geografia Econômica, Energia e Indústria", "Questões Ambientais e Sustentabilidade"]
      },
      {
        id: "história",
        nome: "História",
        totalQuestoes: 125,
        temas: ["Brasil Colônia", "Brasil Império", "Brasil República: Era Vargas e Populismo", "Brasil República: Ditadura Militar e Nova República", "Antiguidade Clássica e Idade Média", "Idade Moderna e Expansão Marítima", "Idade Contemporânea: Revoluções e Imperialismo", "Guerras Mundiais e Guerra Fria"]
      },
      {
        id: "inglês",
        nome: "Inglês",
        totalQuestoes: 28,
        temas: ["Compreensão de Textos em Inglês", "Vocabulário e Expressões Idiomáticas", "Aspectos Culturais e Textos Jornalísticos", "Gramática Aplicada à Interpretação"]
      },
      {
        id: "lingua_portuguesa",
        nome: "Lingua Portuguesa",
        totalQuestoes: 304,
        temas: ["Compreensão e Interpretação de Texto", "Gêneros e Tipologias Textuais", "Figuras de Linguagem", "Funções da Linguagem", "Variação Linguística", "Semântica e Relações de Sentido", "Coesão e Coerência Textual", "Sintaxe Aplicada ao Texto"]
      },
      {
        id: "literatura",
        nome: "Literatura",
        totalQuestoes: 0,
        temas: ["Quinhentismo, Barroco e Arcadismo", "Romantismo e Realismo", "Naturalismo, Parnasianismo e Simbolismo", "Pré-Modernismo e Vanguardas Europeias", "Modernismo no Brasil (1ª, 2ª e 3ª Geração)", "Literatura Contemporânea", "Intertextualidade e Análise Poética"]
      },
      {
        id: "matemática",
        nome: "Matemática",
        totalQuestoes: 397,
        temas: ["Matemática Básica: Razão, Proporção e Regra de Três", "Porcentagem e Matemática Financeira", "Estatística (Média, Moda, Mediana) e Gráficos", "Funções: Afim, Quadrática, Exponencial e Logarítmica", "Geometria Plana (Áreas e Perímetros)", "Geometria Espacial (Volumes e Superfícies)", "Probabilidade", "Análise Combinatória", "Trigonometria e Geometria Analítica", "Progressões (PA e PG)"]
      },
      {
        id: "química",
        nome: "Química",
        totalQuestoes: 116,
        temas: ["Química Geral e Propriedades da Matéria", "Físico-Química: Soluções e Estequiometria", "Físico-Química: Termoquímica", "Cinética e Equilíbrio Químico", "Eletroquímica: Pilhas e Eletrólise", "Química Orgânica: Funções e Reações", "Meio Ambiente e Química Verde", "Atomística e Tabela Periódica"]
      },
      {
        id: "sociologia",
        nome: "Sociologia",
        totalQuestoes: 48,
        temas: ["Surgimento da Sociologia e Clássicos (Marx, Durkheim, Weber)", "Cultura, Ideologia e Indústria Cultural", "Estratificação e Desigualdade Social", "Movimentos Sociais e Cidadania", "Sociologia Brasileira e Formação do Brasil", "O Mundo do Trabalho e a Globalização", "Estado, Poder e Política"]
      },
    ]
  },
  {
    nome: "OAB",
    materias: [
      {
        id: "direito_administrativo",
        nome: "Direito Administrativo",
        totalQuestoes: 38,
        temas: ["Princípios e Fontes do Direito Administrativo", "Acesso à Informação e LGPD", "Organização Administrativa e Terceiro Setor", "Poderes Administrativos", "Atos Administrativos", "Licitações e Contratos", "Serviços Públicos e Parcerias", "Agentes Públicos", "Domínio Público e Bens Públicos", "Intervenção do Estado na Propriedade", "Intervenção no Domínio Econômico", "Controle da Administração Pública", "Improbidade Administrativa", "Responsabilidade Civil do Estado", "Processo Administrativo", "Ações Constitucionais e Remédios Heróicos"]
      },
      {
        id: "direito_ambiental",
        nome: "Direito Ambiental",
        totalQuestoes: 16,
        temas: ["Princípios do Direito Ambiental", "Sistema Nacional de Meio Ambiente (SISNAMA)", "Política Nacional do Meio Ambiente e Instrumentos", "Licenciamento Ambiental", "Responsabilidade Ambiental (Civil, Administrativa e Penal)", "Sistema Nacional de Unidades de Conservação (SNUC)", "Código Florestal (APP e Reserva Legal)", "Tutela Jurídica dos Recursos Hídricos e Saneamento", "Ação Civil Pública em Matéria Ambiental"]
      },
      {
        id: "direito_civil",
        nome: "Direito Civil",
        totalQuestoes: 48,
        temas: ["Pessoa Natural e Direitos da Personalidade", "Pessoa Jurídica e Domicílio", "Bens", "Fatos, Atos e Negócios Jurídicos", "Prescrição e Decadência", "Teoria Geral das Obrigações", "Teoria Geral dos Contratos", "Contratos em Espécie", "Responsabilidade Civil", "Posse, Propriedade e Direitos Reais", "Direito de Família: Casamento e União Estável", "Direito de Família: Parentesco e Alimentos", "Sucessão Legítima", "Sucessão Testamentária"]
      },
      {
        id: "direito_constitucional",
        nome: "Direito Constitucional",
        totalQuestoes: 55,
        temas: ["Teoria da Constituição e Poder Constituinte", "Controle de Constitucionalidade (Concentrado e Difuso)", "Direitos e Garantias Fundamentais", "Remédios Constitucionais (HC, HD, MS, MI, AP)", "Organização Político-Administrativa do Estado", "Poder Legislativo e Processo Legislativo", "Poder Executivo", "Poder Judiciário e Súmula Vinculante", "Funções Essenciais à Justiça", "Sistema Tributário e Orçamento", "Defesa do Estado e das Instituições Democráticas", "Ordem Econômica, Financeira e Social"]
      },
      {
        id: "direito_eleitoral",
        nome: "Direito Eleitoral",
        totalQuestoes: 16,
        temas: ["Direitos Políticos: Alistamento e Elegibilidade", "Inelegibilidades e Lei da Ficha Limpa", "Partidos Políticos e Sistemas Eleitorais", "Organização e Competência da Justiça Eleitoral", "Arrecadação, Financiamento e Prestação de Contas", "Propaganda Eleitoral", "Ações e Recursos Eleitorais (AIME, AIJE, RP)", "Crimes Eleitorais"]
      },
      {
        id: "direito_empresarial",
        nome: "Direito Empresarial",
        totalQuestoes: 30,
        temas: ["Direito de Empresa e Perfil do Empresário", "Sociedades Empresárias: Disposições Gerais e Tipos", "Sociedade Limitada", "Sociedade Anônima", "Desconsideração da Personalidade Jurídica", "Estabelecimento Empresarial", "Propriedade Industrial (Marcas e Patentes)", "Teoria Geral dos Títulos de Crédito", "Títulos de Crédito em Espécie (Cheque, Duplicata, NP, Letra de Câmbio)", "Contratos Empresariais", "Recuperação Judicial e Extrajudicial", "Falência"]
      },
      {
        id: "direito_financeiro",
        nome: "Direito Financeiro",
        totalQuestoes: 14,
        temas: ["Direito Financeiro na Constituição Federal", "Lei de Responsabilidade Fiscal (LRF)", "Orçamento Público (PPA, LDO, LOA)", "Princípios Orçamentários e Processo Legislativo", "Receitas Públicas e Despesas Públicas", "Dívida Pública e Precatórios", "Controle da Execução Orçamentária e Tribunal de Contas"]
      },
      {
        id: "direito_internacional",
        nome: "Direito Internacional",
        totalQuestoes: 15,
        temas: ["Direito Internacional Público: Fontes e Tratados", "Sujeitos de Direito Internacional e Órgãos", "Nacionalidade e Condição Jurídica do Estrangeiro", "Asilo, Extradição, Deportação e Expulsão", "Direito Internacional Privado: Elementos de Conexão", "Lei de Introdução às Normas do Direito Brasileiro (LINDB)", "Homologação de Sentença Estrangeira e Cooperação Jurídica"]
      },
      {
        id: "direito_penal",
        nome: "Direito Penal",
        totalQuestoes: 51,
        temas: ["Princípios Penais e Interpretação da Lei Penal", "Aplicação da Lei Penal no Tempo e no Espaço", "Teoria Geral do Delito: Conduta, Tipicidade e Ilicitude", "Culpabilidade e Excludentes", "Iter Criminis: Consumação e Tentativa", "Erro de Tipo e Erro de Proibição", "Concurso de Pessoas", "Penas: Espécies, Aplicação e Concurso de Crimes", "Medidas de Segurança e Suspensão Condicional", "Causas Extintivas da Punibilidade e Prescrição", "Crimes Contra a Pessoa", "Crimes Contra o Patrimônio", "Crimes Contra a Dignidade Sexual e a Fé Pública", "Crimes Contra a Administração Pública", "Legislação Penal Especial (Drogas, Armas, Maria da Penha, Trânsito)"]
      },
      {
        id: "direito_previdenciário",
        nome: "Direito Previdenciário",
        totalQuestoes: 16,
        temas: ["Seguridade Social: Saúde, Assistência Social e Previdência Social", "Princípios e Organização da Seguridade Social", "Regime Geral de Previdência Social (RGPS) e Financiamento", "Segurados e Dependentes do RGPS", "Salário de Contribuição e Custeio", "Benefícios Previdenciários (Aposentadorias, Auxílios, Pensão por Morte)", "Acidente de Trabalho e Benefícios Decorrentes"]
      },
      {
        id: "direito_processual_civil",
        nome: "Direito Processual Civil",
        totalQuestoes: 48,
        temas: ["Teoria Geral do Processo e Normas Fundamentais", "Formas Alternativas de Solução de Conflitos", "Jurisdição, Ação e Competência", "Sujeitos do Processo e Intervenção de Terceiros", "Atos Processuais, Prazos e Nulidades", "Tutela Provisória (Urgência e Evidência)", "Formação, Suspensão e Extinção do Processo", "Procedimento Comum (Petição Inicial a Julgamento)", "Teoria Geral das Provas e Provas em Espécie", "Sentença, Coisa Julgada e Precedentes", "Teoria Geral dos Recursos e Recursos em Espécie", "Ações Autônomas de Impugnação (Ação Rescisória, Reclamação)", "Execução em Geral e Cumprimento de Sentença", "Procedimentos Especiais", "Juizados Especiais e Microssistema Coletivo"]
      },
      {
        id: "direito_processual_penal",
        nome: "Direito Processual Penal",
        totalQuestoes: 42,
        temas: ["Princípios e Sistemas Processuais Penais", "Inquérito Policial e Investigação Criminal", "Ação Penal", "Jurisdição e Competência", "Provas e Direito Probatório", "Sujeitos do Processo, Juiz, MP, Acusado e Defensor", "Prisão, Medidas Cautelares e Liberdade Provisória", "Citações, Intimações e Atos Judiciais", "Procedimento Comum Ordinário e Sumário", "Procedimento dos Juizados Especiais e Tribunal do Júri", "Nulidades no Processo Penal", "Teoria Geral dos Recursos e Recursos em Espécie", "Ações Autônomas de Impugnação (Habeas Corpus, Revisão Criminal)"]
      },
      {
        id: "direito_processual_do_trabalho",
        nome: "Direito Processual do Trabalho",
        totalQuestoes: 35,
        temas: ["Princípios, Fontes e Organização da Justiça do Trabalho", "Competência da Justiça do Trabalho", "Atos, Termos e Prazos Processuais", "Partes, Procuradores, Litisconsórcio e Honorários", "Audiência Trabalhista, Conciliação e Resposta do Réu", "Provas no Processo do Trabalho", "Ritos Trabalhistas (Ordinário, Sumário e Sumaríssimo)", "Sentença e Coisa Julgada", "Recursos Trabalhistas", "Execução Trabalhista", "Procedimentos Especiais (Inquérito para Apuração de Falta Grave, Mandado de Segurança)", "Ação Rescisória no Processo do Trabalho", "Dissídio Coletivo"]
      },
      {
        id: "direito_tributário",
        nome: "Direito Tributário",
        totalQuestoes: 40,
        temas: ["Fontes do Direito Tributário e Legislação", "Princípios Constitucionais Tributários", "Limitações ao Poder de Tributar (Imunidades)", "Competência Tributária e Repartição de Receitas", "Tributo: Conceito e Espécies (Impostos, Taxas, Contribuições, Empréstimo Compulsório)", "Obrigação Tributária Principal e Acessória", "Fato Gerador, Sujeito Ativo e Passivo", "Responsabilidade Tributária", "Crédito Tributário: Constituição (Lançamento)", "Suspensão, Extinção e Exclusão do Crédito Tributário", "Administração Tributária, Dívida Ativa e Certidões", "Processo Judicial Tributário (Execução Fiscal, Ações Tributárias)"]
      },
      {
        id: "direito_da_criança_e_do_adolescente_(eca)",
        nome: "Direito da Criança e do Adolescente (ECA)",
        totalQuestoes: 17,
        temas: ["Princípios e Direitos Fundamentais da Criança e do Adolescente", "Prevenção e Entidades de Atendimento", "Medidas de Proteção e Adoção", "Colocação em Família Substituta", "Prática de Ato Infracional e Direitos do Adolescente", "Medidas Socioeducativas", "Conselho Tutelar e Acesso à Justiça", "Crimes e Infrações Administrativas no ECA"]
      },
      {
        id: "direito_do_consumidor",
        nome: "Direito do Consumidor",
        totalQuestoes: 19,
        temas: ["Relação de Consumo: Consumidor, Fornecedor, Produto e Serviço", "Princípios e Direitos Básicos do Consumidor", "Qualidade de Produtos e Serviços, da Prevenção e da Reparação dos Danos", "Responsabilidade pelo Vício e Fato do Produto/Serviço", "Desconsideração da Personalidade Jurídica no CDC", "Práticas Comerciais: Oferta, Publicidade e Práticas Abusivas", "Proteção Contratual e Cláusulas Abusivas", "Defesa do Consumidor em Juízo e Sanções Administrativas"]
      },
      {
        id: "direito_do_trabalho",
        nome: "Direito do Trabalho",
        totalQuestoes: 45,
        temas: ["Princípios e Fontes do Direito do Trabalho", "Relação de Trabalho e Relação de Emprego", "Trabalhador Doméstico, Rural e Estagiário", "Contrato Individual de Trabalho e Terceirização", "Remuneração e Salário", "Duração do Trabalho: Jornada e Repousos", "Duração do Trabalho: Férias", "Alteração, Suspensão e Interrupção do Contrato", "Cessação do Contrato de Trabalho e Verbas Rescisórias", "Estabilidade e Garantias Provisórias no Emprego", "Fundo de Garantia do Tempo de Serviço (FGTS)", "Prescrição e Decadência Trabalhista", "Segurança, Higiene e Medicina do Trabalho", "Direito Coletivo do Trabalho e Negociação Coletiva"]
      },
      {
        id: "direitos_humanos",
        nome: "Direitos Humanos",
        totalQuestoes: 15,
        temas: ["Teoria Geral e Afirmação Histórica dos Direitos Humanos", "Sistema Global de Proteção dos Direitos Humanos (ONU)", "Sistema Interamericano de Proteção dos Direitos Humanos (OEA)", "Pacto de San José da Costa Rica", "Proteção de Grupos Vulneráveis e Tratados Internacionais", "Os Direitos Humanos na Constituição Federal Brasileira", "Incidente de Deslocamento de Competência (Federalização)"]
      },
      {
        id: "estatuto_da_ordem_dos_advogados_do_brasil",
        nome: "Estatuto da Ordem dos Advogados do Brasil",
        totalQuestoes: 27,
        temas: ["Disposições Gerais do Estatuto", "Fins e Organização da OAB", "Eleições e Mandatos na OAB", "Regulamento Geral do Estatuto da Advocacia"]
      },
      {
        id: "filosofia_do_direito",
        nome: "Filosofia do Direito",
        totalQuestoes: 15,
        temas: ["Jusnaturalismo x Positivismo Jurídico", "Contratualismo Clássico", "Teorias da Justiça e Utilitarismo", "Pensamento Jurídico Moderno e Contemporâneo", "Hans Kelsen e a Teoria Pura do Direito", "Hermenêutica e Interpretação Jurídica"]
      },
      {
        id: "ética_profissional",
        nome: "Ética Profissional",
        totalQuestoes: 38,
        temas: ["A Atividade de Advocacia", "Direitos e Prerrogativas do Advogado", "Inscrição na OAB e Impedimentos/Incompatibilidades", "Sociedade de Advogados e Advogado Empregado", "Honorários Advocatícios", "Deveres Éticos e Relação com o Cliente", "Publicidade na Advocacia", "Infrações e Sanções Disciplinares", "O Processo Disciplinar na OAB", "Órgãos da OAB (Conselho Federal, Seccionais, Subseções, Caixa de Assistência)"]
      },
    ]
  },
];
