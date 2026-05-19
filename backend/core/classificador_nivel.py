# core/classificador_nivel.py
"""
Sistema de 4 níveis reais de dificuldade.
Substitui o parsing frágil de faixa_salarial por perfis pedagógicos precisos.
"""

NIVEIS_DIFICULDADE: dict[str, dict] = {
    "Inicial": {
        "label": "Inicial",
        "descricao_curta": "Fixação de conceitos fundamentais",
        "instrucao_llm": (
            "NÍVEL INICIAL — questão de fixação básica.\n"
            "- Foque na literalidade da lei e definições doutrinárias diretas.\n"
            "- Use casos práticos simples, sem ambiguidade.\n"
            "- Alternativas erradas devem ser claramente distinguíveis do gabarito.\n"
            "- Evite jurisprudência, exceções e cruzamentos entre institutos.\n"
            "- O candidato que leu o resumo básico do tema deve acertar."
        ),
        "complexidade_enunciado": "simples e direto",
        "uso_jurisprudencia": False,
        "uso_excecoes": False,
        "nivel_pegadinha": "mínimo",
    },

    "Intermediario": {
        "label": "Intermediário",
        "descricao_curta": "Aplicação e interpretação moderada",
        "instrucao_llm": (
            "NÍVEL INTERMEDIÁRIO — questão de aplicação.\n"
            "- Misture literalidade com interpretação de casos práticos moderados.\n"
            "- Inclua uma ou duas alternativas que exijam distinção entre institutos similares.\n"
            "- Pode usar doutrina majoritária e casos típicos de provas reais.\n"
            "- Evite jurisprudência recente específica (STF/STJ) ou exceções raras.\n"
            "- O candidato que estudou o tema com atenção deve acertar."
        ),
        "complexidade_enunciado": "moderado com caso prático",
        "uso_jurisprudencia": False,
        "uso_excecoes": True,
        "nivel_pegadinha": "moderado",
    },

    "Avancado": {
        "label": "Avançado",
        "descricao_curta": "Jurisprudência e interpretação aprofundada",
        "instrucao_llm": (
            "NÍVEL AVANÇADO — questão de interpretação profunda.\n"
            "- Exija conhecimento de jurisprudência recente (STF/STJ) ou súmulas aplicáveis.\n"
            "- Apresente casos com elementos de exceção, cumulação de regras ou conflito aparente.\n"
            "- As alternativas devem ser muito próximas, separadas por detalhe técnico.\n"
            "- Use linguagem técnica formal da área.\n"
            "- Somente candidatos que aprofundaram o estudo devem acertar."
        ),
        "complexidade_enunciado": "complexo com elementos de conflito normativo",
        "uso_jurisprudencia": True,
        "uso_excecoes": True,
        "nivel_pegadinha": "alto",
    },

    "Elite": {
        "label": "Elite",
        "descricao_curta": "Máxima dificuldade — cargo de alto escalão",
        "instrucao_llm": (
            "NÍVEL ELITE — questão de altíssima dificuldade.\n"
            "- Exija combinação de regra geral + exceção + exceção da exceção.\n"
            "- Use jurisprudência recente e controversa, divergências doutrina vs. tribunais.\n"
            "- O enunciado pode misturar dois ou três institutos que se intersectam.\n"
            "- As alternativas devem parecer todas corretas para quem estudou superficialmente.\n"
            "- Inclua armadilhas na escolha de palavras (responsabilidade objetiva vs subjetiva,\n"
            "  nulidade absoluta vs relativa, prazo decadencial vs prescricional).\n"
            "- Apenas especialistas no tema devem acertar com segurança."
        ),
        "complexidade_enunciado": "ultra-complexo, cruzamento de institutos",
        "uso_jurisprudencia": True,
        "uso_excecoes": True,
        "nivel_pegadinha": "máximo",
    },
}

# Mapeamento de retrocompatibilidade com faixa_salarial legada
_MAPA_LEGADO = {
    "Até R$ 5.000": "Inicial",
    "R$ 5.000 a R$ 12.000": "Intermediario",
    "Acima de R$ 12.000": "Elite",
    # novos valores diretos
    "Inicial": "Inicial",
    "Intermediario": "Intermediario",
    "Avancado": "Avancado",
    "Elite": "Elite",
}


def get_nivel(faixa_ou_nivel: str) -> dict:
    """
    Aceita tanto o novo formato ('Inicial', 'Intermediario', 'Avancado', 'Elite')
    quanto os antigos valores de faixa_salarial para retrocompatibilidade.
    """
    chave = _MAPA_LEGADO.get(faixa_ou_nivel, "Intermediario")
    return NIVEIS_DIFICULDADE[chave]
