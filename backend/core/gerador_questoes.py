# core/gerador_questoes.py
"""
Constrói o prompt estruturado e chama o LLM para gerar questões inéditas.
Recebe todos os insumos já processados pelos outros módulos.
"""

import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from .fingerprint_banca import get_perfil_banca
from .classificador_nivel import get_nivel


def _montar_bloco_exemplos(exemplos: list[dict]) -> str:
    if not exemplos:
        return "Nenhum exemplo disponível. Use seu conhecimento para criar questões autênticas."
    saida = []
    for i, q in enumerate(exemplos, 1):
        saida.append(f"EXEMPLO {i}:")
        saida.append(f"  Enunciado: {q.get('enunciado', '')[:400]}")
        alts = q.get("alternativas", {})
        if alts:
            for letra, texto in list(alts.items())[:3]:
                saida.append(f"  {letra}) {str(texto)[:120]}")
        saida.append(f"  Gabarito: {q.get('gabarito', '')}")
        saida.append("")
    return "\n".join(saida)


def _montar_bloco_microtemas(contexto: dict) -> str:
    if not contexto:
        return ""
    linhas = []
    if contexto.get("microtemas_prioritarios"):
        linhas.append("Subtópicos de maior peso nesta matéria:")
        for mt in contexto["microtemas_prioritarios"]:
            linhas.append(f"  • {mt}")
    if contexto.get("armadilhas_mapeadas"):
        linhas.append("\nArmadilhas reais mapeadas no banco desta banca:")
        for arm in contexto["armadilhas_mapeadas"]:
            linhas.append(f"  ⚠ {arm}")
    if contexto.get("palavras_gatilho"):
        gatilhos = ", ".join(contexto["palavras_gatilho"])
        linhas.append(f"\nPalavras-gatilho típicas desta banca: {gatilhos}")
    return "\n".join(linhas)


def _formato_saida(tipo_questao: str) -> str:
    if tipo_questao == "Certo/Errado":
        return (
            'O campo "alternativas" DEVE ser um objeto vazio {}. '
            'O gabarito DEVE ser exatamente "Certo" ou "Errado".'
        )
    return (
        'O campo "alternativas" DEVE conter exatamente 5 opções: A, B, C, D, E. '
        'O gabarito DEVE ser uma única letra: A, B, C, D ou E.'
    )


TEMPLATE_PROMPT = """Você é um elaborador sênior de questões para concursos públicos e exames nacionais, \
com 15 anos de experiência e profundo conhecimento do estilo de cada banca examinadora.

════════════════════════════════════
MISSÃO: Gerar {quantidade} questão(ões) INÉDITA(S) sobre o tema "{tema}" (matéria: {materia}).
════════════════════════════════════

━━━ PERFIL DA BANCA ━━━
Banca-alvo: {nome_banca}
{instrucao_banca}

━━━ NÍVEL DE DIFICULDADE ━━━
{instrucao_nivel}

━━━ INTELIGÊNCIA DO BANCO REAL ━━━
{bloco_microtemas}

━━━ EXEMPLOS REAIS PARA CALIBRAGEM ━━━
(Use como referência de estilo, tamanho e pegadinhas — NÃO copie)
{bloco_exemplos}

━━━ REGRAS DE GERAÇÃO ━━━
1. NUNCA copie ou parafraseie os exemplos acima. Crie situações, personagens e contextos totalmente novos.
2. Aplique as armadilhas mapeadas de forma autêntica — não óbvia.
3. Calibre o tamanho do enunciado conforme o estilo da banca.
4. {formato_saida}
5. O comentário deve ser escrito como um professor experiente de cursinho: \
explique POR QUÊ o gabarito está certo e POR QUÊ cada alternativa errada parece correta mas não é. \
Use linguagem direta e didática, sem ser prolixo.

━━━ FORMATO DE RETORNO (JSON ESTRITO) ━━━
{{
    "questoes": [
        {{
            "enunciado": "Texto completo da questão...",
            "alternativas": {{}},
            "gabarito": "...",
            "nivel": "{nivel_label}",
            "banca_estilo": "{nome_banca}",
            "comentario": "Comentário pedagógico do professor..."
        }}
    ]
}}"""


def gerar_questoes(
    jornada: str,
    materia: str,
    tema: str,
    faixa_ou_nivel: str,
    banca: str,
    tipo_questao: str,
    quantidade: int,
    exemplos: list[dict],
    contexto_microtemas: dict,
) -> dict:
    """
    Constrói o prompt completo e chama o LLM.
    Retorna {"questoes": [...]}.
    """
    perfil_banca = get_perfil_banca(banca)
    perfil_nivel = get_nivel(faixa_ou_nivel)

    bloco_exemplos = _montar_bloco_exemplos(exemplos)
    bloco_microtemas = _montar_bloco_microtemas(contexto_microtemas)
    formato_saida = _formato_saida(tipo_questao)

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.55,
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    prompt = ChatPromptTemplate.from_template(TEMPLATE_PROMPT)
    chain = prompt | llm | StrOutputParser()

    try:
        resposta = chain.invoke({
            "quantidade": quantidade,
            "tema": tema,
            "materia": materia,
            "nome_banca": perfil_banca["nome_completo"],
            "instrucao_banca": perfil_banca["instrucao_geracao"],
            "instrucao_nivel": perfil_nivel["instrucao_llm"],
            "nivel_label": perfil_nivel["label"],
            "bloco_exemplos": bloco_exemplos,
            "bloco_microtemas": bloco_microtemas,
            "formato_saida": formato_saida,
        })

        inicio = resposta.find("{")
        fim = resposta.rfind("}")
        if inicio != -1 and fim != -1:
            resposta = resposta[inicio:fim + 1]

        dados = json.loads(resposta)
        questoes = dados.get("questoes", [])

        # Filtro de qualidade: remove questões com enunciado muito curto
        questoes = [q for q in questoes if len(q.get("enunciado", "")) >= 60]

        return {"questoes": questoes}

    except Exception as e:
        print(f"[gerador_questoes] Erro: {e}")
        return {"questoes": []}
