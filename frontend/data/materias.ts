// ARQUIVO GERADO AUTOMATICAMENTE PELO BACKEND
// PONTO DE PARTIDA: temas.json de cada matéria

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
        id: "portugues",
        nome: "Portugues",
        totalQuestoes: 0,
        temas: ["Compreensão e Interpretação de Textos", "Tipologia e Gêneros Textuais", "Ortografia Oficial e Acentuação Gráfica", "Mecanismos de Coesão Textual", "Emprego de Tempos e Modos Verbais", "Classes de Palavras", "Sintaxe da Oração e do Período (Coordenação e Subordinação)", "Pontuação", "Concordância Verbal e Nominal", "Regência Verbal e Nominal", "Crase", "Colocação Pronominal", "Reescrita de Frases e Parágrafos", "Significação das Palavras (Semântica)"]
      },
    ]
  },
];
