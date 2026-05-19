# core/fingerprint_banca.py
"""
Perfis comportamentais semânticos por banca examinadora.
Cada perfil instrui o LLM sobre como a banca cobra, quais armadilhas usa
e qual o estilo estrutural das questões.
"""

PERFIS_BANCA: dict[str, dict] = {
    "Cebraspe": {
        "nome_completo": "CEBRASPE / CESPE",
        "tipo_questao_preferido": "Certo/Errado",
        "estilo_enunciado": (
            "Enunciados longos com texto-base (notícia, trecho legal ou caso prático) "
            "seguido de assertiva única para julgamento. A assertiva costuma conter "
            "uma única palavra-chave alterada (somente, vedado, jamais, sempre, nunca) "
            "que a transforma em erro sutil."
        ),
        "armadilhas_favoritas": [
            "Trocar 'poderá' por 'deverá' ou vice-versa",
            "Absolutizar com 'sempre', 'nunca', 'somente', 'exclusivamente'",
            "Inverter o sujeito da obrigação (quem deve fazer o quê)",
            "Misturar prazo correto com prazo errado em legislação",
            "Afirmar exceção como regra geral",
            "Confundir conceitos de institutos similares (ex: concessão vs permissão)",
        ],
        "nivel_interpretacao": "alto — exige leitura cuidadosa de cada palavra",
        "frequencia_negativas": "baixa — raramente usa NÃO/INCORRETO/EXCETO",
        "tamanho_enunciado": "longo (150–350 palavras com texto-base)",
        "instrucao_geracao": (
            "Crie uma questão de Certo/Errado no estilo CEBRASPE. "
            "Escreva um texto-base de 3–5 frases sobre um caso prático ou trecho normativo, "
            "depois apresente UMA assertiva para ser julgada. "
            "A armadilha deve estar em um único detalhe semântico: "
            "troque um advérbio, inverta uma obrigação ou absolutize uma regra relativa. "
            "O gabarito deve ser 'Certo' ou 'Errado'."
        ),
    },

    "FGV": {
        "nome_completo": "Fundação Getulio Vargas (FGV)",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Enunciados longos com caso prático bem contextualizado. "
            "As alternativas são muito semelhantes entre si, exigindo interpretação refinada. "
            "Costuma usar situações envolvendo nomes fictícios de personagens (João, Maria, etc.) "
            "em cenários específicos da área cobrada."
        ),
        "armadilhas_favoritas": [
            "Alternativas quase idênticas com uma única palavra diferente",
            "Misturar prazo correto com prazo ligeiramente errado",
            "Apresentar consequência jurídica trocada (nulo vs anulável, por exemplo)",
            "Incluir uma alternativa doutrinariamente correta mas inaplicável ao caso concreto",
            "Exigir combinação de regra geral + exceção específica",
        ],
        "nivel_interpretacao": "muito alto — alternativas deliberadamente confundíveis",
        "frequencia_negativas": "média — usa EXCETO e NÃO ocasionalmente",
        "tamanho_enunciado": "longo (200–400 palavras com caso concreto elaborado)",
        "instrucao_geracao": (
            "Crie uma questão de múltipla escolha no estilo FGV. "
            "Elabore um caso prático detalhado com 3–5 frases, use nomes fictícios e contexto específico. "
            "As 5 alternativas devem ser muito próximas entre si — altere apenas uma palavra ou "
            "troque uma consequência jurídica entre alternativas. "
            "Apenas uma alternativa é absolutamente correta; as outras devem ser plausíveis mas erradas."
        ),
    },

    "FCC": {
        "nome_completo": "Fundação Carlos Chagas (FCC)",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Questões mais diretas e objetivas, com forte base na literalidade da lei e na doutrina clássica. "
            "Linguagem técnica formal. Enunciados moderados sem grande contextualização. "
            "Favorece quem estudou o texto da norma ipsis litteris."
        ),
        "armadilhas_favoritas": [
            "Modificar numerais ou prazos da legislação",
            "Trocar artigo de lei por outro semelhante",
            "Incluir conceito doutrinário minoritário como se fosse majoritário",
            "Misturar regimes jurídicos distintos (CLT vs estatuto, por ex.)",
            "Alterar quórum exigido (maioria simples vs absoluta vs qualificada)",
        ],
        "nivel_interpretacao": "médio — foco em memorização e literalidade",
        "frequencia_negativas": "alta — frequentemente usa NÃO, INCORRETO, EXCETO",
        "tamanho_enunciado": "médio (80–180 palavras, objetivo e direto)",
        "instrucao_geracao": (
            "Crie uma questão de múltipla escolha no estilo FCC. "
            "Seja direto e objetivo, sem grande contextualização. "
            "Baseie-se na literalidade da lei ou doutrina clássica. "
            "Pode usar a estrutura 'NÃO é correto afirmar que' ou 'EXCETO' para variar. "
            "As alternativas erradas devem modificar prazos, quóruns ou artigos de lei por valores próximos."
        ),
    },

    "Vunesp": {
        "nome_completo": "Fundação VUNESP",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Questões com texto-base moderado, focadas em aplicação prática da lei estadual e municipal. "
            "Cobram muito o conhecimento específico de São Paulo (TJ-SP, MP-SP, PGE-SP). "
            "Alternativas bem separadas, menos confusas que FGV."
        ),
        "armadilhas_favoritas": [
            "Confundir competência federal com estadual ou municipal",
            "Trocar prazos processuais específicos",
            "Incluir legislação estadual que modifica a federal",
            "Usar jurisprudência do TJ-SP em vez de STJ/STF",
        ],
        "nivel_interpretacao": "médio — foco em aplicação da norma ao caso",
        "frequencia_negativas": "média",
        "tamanho_enunciado": "médio (100–200 palavras)",
        "instrucao_geracao": (
            "Crie uma questão de múltipla escolha no estilo VUNESP. "
            "Use texto-base moderado com caso prático. "
            "Foque em aplicação da norma a situações concretas, com alternativas bem distintas. "
            "Pode abordar especificidades do cargo (judicial, ministerial, etc.)."
        ),
    },

    "ENEM": {
        "nome_completo": "ENEM — Exame Nacional do Ensino Médio",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Contextualização interdisciplinar obrigatória. Sempre começa com um texto-base "
            "(trecho literário, notícia, gráfico descrito, trecho histórico) longo e contextualizado. "
            "A questão exige habilidades de interpretação, não memorização de fórmulas. "
            "Conecta o conteúdo a situações sociais reais e cotidianas."
        ),
        "armadilhas_favoritas": [
            "Alternativa correta exige integração de dois conceitos diferentes",
            "Alternativas erradas são verdadeiras mas não respondem ao que foi perguntado",
            "Confundir correlação com causalidade em gráficos/dados",
            "Ignorar o contexto do texto-base e responder pela memória",
        ],
        "nivel_interpretacao": "muito alto — competências e habilidades, não memorização",
        "frequencia_negativas": "baixa",
        "tamanho_enunciado": "muito longo (300–500 palavras incluindo texto-base)",
        "instrucao_geracao": (
            "Crie uma questão no estilo ENEM. "
            "Comece com um texto-base contextualizado (trecho de notícia, dado estatístico ou situação cotidiana) "
            "relacionado ao tema. "
            "A questão deve exigir interpretação e aplicação do conhecimento, não memorização. "
            "As alternativas incorretas devem ser parcialmente verdadeiras mas não responder à pergunta principal."
        ),
    },

    "OAB": {
        "nome_completo": "OAB — Ordem dos Advogados do Brasil (FGV)",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Casos práticos obrigatórios com clientes fictícios consultando advogados. "
            "Sempre apresenta uma situação (cliente X procura advogado com o seguinte problema...) "
            "e pergunta qual a resposta juridicamente correta. "
            "Cobram Estatuto da OAB, Código de Ética, e legislação substantiva e adjetiva."
        ),
        "armadilhas_favoritas": [
            "Misturar prazo correto com prazo vencido ou contado errado",
            "Confundir recurso adequado (apelação vs agravo, por ex.)",
            "Incluir conduta que viola o Código de Ética da OAB",
            "Trocar a legitimidade ativa ou passiva na ação",
            "Alternativa correta exige conhecimento combinado (direito material + processual)",
        ],
        "nivel_interpretacao": "alto — orientação ao caso, não à norma abstrata",
        "frequencia_negativas": "baixa",
        "tamanho_enunciado": "longo (200–350 palavras com narrativa do caso)",
        "instrucao_geracao": (
            "Crie uma questão no estilo OAB/FGV. "
            "Apresente um cliente com nome fictício em uma situação problemática específica. "
            "A pergunta deve ser 'qual a conduta juridicamente correta' ou 'qual recurso cabível'. "
            "As alternativas devem incluir opções plausíveis mas erradas por detalhe processual ou material."
        ),
    },

    "Livre": {
        "nome_completo": "Abordagem Livre (Geral)",
        "tipo_questao_preferido": "Múltipla Escolha",
        "estilo_enunciado": (
            "Questões equilibradas, sem vícios específicos de bancas. "
            "Foco puro na fixação do conteúdo. Enunciados claros e diretos."
        ),
        "armadilhas_favoritas": [
            "Alternativas que confundem conceitos similares",
            "Generalizar exceções como regras",
        ],
        "nivel_interpretacao": "médio",
        "frequencia_negativas": "média",
        "tamanho_enunciado": "médio (100–200 palavras)",
        "instrucao_geracao": (
            "Crie uma questão de múltipla escolha bem estruturada, focada em fixar o conceito central do tema. "
            "Seja claro e direto. As alternativas erradas devem confundir conceitos próximos ao correto."
        ),
    },
}


def get_perfil_banca(banca: str) -> dict:
    """Retorna o perfil da banca, com fallback para 'Livre'."""
    return PERFIS_BANCA.get(banca, PERFIS_BANCA["Livre"])
