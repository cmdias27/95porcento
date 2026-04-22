// frontend/data/materias.ts

export interface Subtema {
  id: string;
  nome: string;
}

export interface Tema {
  id: string;
  nome: string;
  subtemas: Subtema[];
}

export interface Materia {
  id: string;
  nome: string;
  temas: Tema[];
}

export interface Jornada {
  id: 'enem' | 'concurso' | 'livre';
  titulo: string;
  materias: Materia[];
}

export const JORNADAS_ESTUDO: Jornada[] = [
  {
    id: 'enem',
    titulo: "Enem e Vestibulares",
    materias: [
      {
        id: "e1",
        nome: "Língua Portuguesa",
        temas: [
          { id: "et1", nome: "Interpretação de Texto", subtemas: [] },
          { id: "et2", nome: "Gramática", subtemas: [] },
          { id: "et3", nome: "Gêneros Textuais", subtemas: [] },
          { id: "et4", nome: "Literatura", subtemas: [] },
          { id: "et5", nome: "Artes", subtemas: [] },
          { id: "et6", nome: "Educação Física", subtemas: [] },
        ]
      },
      {
        id: "e2",
        nome: "Matemática",
        temas: [
          { id: "et7", nome: "Aritmética", subtemas: [] },
          { id: "et8", nome: "Álgebra", subtemas: [] },
          { id: "et9", nome: "Geometria Plana e Espacial", subtemas: [] },
          { id: "et10", nome: "Trigonometria", subtemas: [] },
          { id: "et11", nome: "Estatística e Probabilidade", subtemas: [] },
          { id: "et12", nome: "Matemática Financeira", subtemas: [] },
          { id: "et13", nome: "Funções", subtemas: [
            { id: "es6", nome: "1º e 2º grau" }, 
            { id: "es7", nome: "Exponencial" }, 
            { id: "es8", nome: "Logarítmica" }
          ]},
        ]
      },
      {
        id: "e3",
        nome: "Ciências da Natureza",
        temas: [
          { id: "et14", nome: "Física", subtemas: [
            { id: "es9", nome: "Mecânica" }, { id: "es10", nome: "Termologia" }, 
            { id: "es11", nome: "Óptica" }, { id: "es12", nome: "Ondulatória" }, 
            { id: "es13", nome: "Eletromagnetismo" }
          ]},
          { id: "et15", nome: "Química", subtemas: [
            { id: "es14", nome: "Química Geral" }, { id: "es15", nome: "Físico-química" }, 
            { id: "es16", nome: "Química Orgânica" }, { id: "es17", nome: "Estequiometria" }
          ]},
          { id: "et16", nome: "Biologia", subtemas: [
            { id: "es19", nome: "Citologia" }, { id: "es20", nome: "Genética" }, 
            { id: "es22", nome: "Ecologia" }, { id: "es23", nome: "Fisiologia Humana" }
          ]},
        ]
      }
    ]
  },
  {
    id: 'concurso',
    titulo: "Concursos Públicos",
    materias: [
      {
        id: "c1",
        nome: "Língua Portuguesa",
        temas: [
          { id: "ct1", nome: "Compreensão e Interpretação de Textos", subtemas: [] },
          { id: "ct2", nome: "Ortografia e Acentuação", subtemas: [] },
          { id: "ct3", nome: "Morfologia (Classes de Palavras)", subtemas: [] },
          { id: "ct4", nome: "Sintaxe da Oração e do Período", subtemas: [] },
          { id: "ct5", nome: "Concordância Verbal e Nominal", subtemas: [] },
          { id: "ct6", nome: "Regência e Crase", subtemas: [] },
          { id: "ct7", nome: "Pontuação", subtemas: [] }
        ]
      },
      {
        id: "c2",
        nome: "Raciocínio Lógico e Matemático",
        temas: [
          { id: "ct8", nome: "Lógica de Proposições", subtemas: [] },
          { id: "ct9", nome: "Conjuntos Numéricos", subtemas: [] },
          { id: "ct10", nome: "Razão, Proporção e Regra de Três", subtemas: [] },
          { id: "ct11", nome: "Porcentagem e Juros", subtemas: [] },
          { id: "ct12", nome: "Análise Combinatória e Probabilidade", subtemas: [] }
        ]
      },
      {
        id: "c4",
        nome: "Direito Constitucional",
        temas: [
          { id: "ct13", nome: "Princípios Fundamentais", subtemas: [] },
          { id: "ct14", nome: "Direitos e Garantias Fundamentais", subtemas: [
            { id: "cs29", nome: "Direitos Individuais e Coletivos" },
            { id: "cs30", nome: "Direitos Sociais" },
            { id: "cs31", nome: "Nacionalidade e Direitos Políticos" }
          ]},
          { id: "ct15", nome: "Organização do Estado", subtemas: [] },
          { id: "ct16", nome: "Administração Pública (Art. 37 a 41)", subtemas: [] },
          { id: "ct17", nome: "Poder Executivo e Legislativo", subtemas: [] },
          { id: "ct18", nome: "Poder Judiciário e Funções Essenciais", subtemas: [] }
        ]
      },
      {
        id: "c5",
        nome: "Direito Administrativo",
        temas: [
          { id: "ct19", nome: "Estado, Governo e Administração Pública", subtemas: [] },
          { id: "ct20", nome: "Princípios da Administração", subtemas: [] },
          { id: "ct21", nome: "Organização Administrativa", subtemas: [
            { id: "cs38", nome: "Administração Direta e Indireta" },
            { id: "cs39", nome: "Autarquias, Fundações, Empresas Públicas e Sociedades de Economia Mista" }
          ]},
          { id: "ct22", nome: "Atos Administrativos", subtemas: [] },
          { id: "ct23", nome: "Poderes Administrativos", subtemas: [] },
          { id: "ct24", nome: "Licitações e Contratos (Lei 14.133/21)", subtemas: [] },
          { id: "ct25", nome: "Agentes Públicos", subtemas: [] },
          { id: "ct26", nome: "Responsabilidade Civil do Estado", subtemas: [] }
        ]
      },
      {
        id: "c6",
        nome: "Administração Geral",
        temas: [
          { id: "ct27", nome: "Evolução da Administração", subtemas: [] },
          { id: "ct28", nome: "Processo Administrativo (PODC)", subtemas: [
            { id: "cs42", nome: "Planejamento" }, { id: "cs43", nome: "Organização" },
            { id: "cs44", nome: "Direção" }, { id: "cs45", nome: "Controle" }
          ]},
          { id: "ct29", nome: "Gestão de Pessoas", subtemas: [] },
          { id: "ct30", nome: "Comportamento Organizacional", subtemas: [
            { id: "cs46", nome: "Liderança" }, { id: "cs47", nome: "Motivação" }
          ]},
          { id: "ct31", nome: "Gestão de Processos e Projetos", subtemas: [] }
        ]
      },
      {
        id: "c7",
        nome: "Administração Pública",
        temas: [
          { id: "ct32", nome: "Modelos de Gestão Pública (Patrimonialista, Burocrático, Gerencial)", subtemas: [] },
          { id: "ct33", nome: "Novas Tecnologias na Gestão Pública", subtemas: [] },
          { id: "ct34", nome: "Governança e Accountability", subtemas: [] },
          { id: "ct35", nome: "Gestão de Resultados no Setor Público", subtemas: [] }
        ]
      }
    ]
  }
];