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
        id: "direito_administrativo",
        nome: "Direito Administrativo",
        totalQuestoes: 944,
        temas: ["Agentes Públicos E Lei 8.112 De 1990", "Atos Administrativos", "Bens Públicos Na Administração Pública", "Conceitos Iniciais De Direito Administrativo - Histórico, Funções De Estado E Fontes", "Contratos Administrativos", "Controle Da Administração Pública", "Improbidade Administrativa - Lei Nº 8.429 De 1992 E Lei Nº 14.230 De 2021", "Intervenção Do Estado Na Propriedade", "Licitação Nas Empresas Estatais - Lei Nº 13.303 De 2016", "Licitações E Lei 8.666 De 1993", "Licitações E Lei Nº 14.133 De 2021", "Organização Da Administração Pública", "Poderes Da Administração", "Processo Administrativo - Lei Nº 9.784 De 1999 E Lei Nº 14.210 De 2021", "Regime Jurídico Administrativo", "Responsabilidade Civil Do Estado", "Serviços Públicos"]
      },
      {
        id: "direito_constitucional",
        nome: "Direito Constitucional",
        totalQuestoes: 1171,
        temas: ["Administração Pública – Disposições Gerais e Servidores Públicos", "Constituições Estaduais", "Controle de Constitucionalidade", "Defesa do Estado e das Instituições Democráticas", "Direitos Individuais", "Direitos Individuais - Remédios Constitucionais e Garantias Processuais", "Direitos Políticos", "Direitos Sociais", "Direitos da Nacionalidade", "Disposições Constitucionais Gerais", "Funções Essenciais à Justiça", "Ordem Econômica e Financeira", "Ordem Social", "Organização Político-Administrativa do Estado", "Organização dos Poderes", "Partidos Políticos", "Poder Executivo", "Poder Judiciário", "Poder Legislativo", "Princípios Fundamentais da República", "Processo Legislativo", "Teoria da Constituição", "Teoria dos Direitos Fundamentais"]
      },
    ]
  },
];
