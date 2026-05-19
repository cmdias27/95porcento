# core/analisador_banca.py
"""
Analisa o banco de questões (questoes.json + analise_estatica.json) e extrai
métricas estruturais reais para enriquecer o prompt do gerador.
"""

import os
import json
import random
from typing import Optional


def _caminho_questoes(jornada: str, materia: str) -> str:
    return os.path.join("./questoes", jornada.capitalize(), materia.strip())


def carregar_banco_questoes(jornada: str, materia: str) -> dict:
    """Carrega questoes.json retornando dict {tema: [questões]}."""
    caminho = os.path.join(_caminho_questoes(jornada, materia), "questoes.json")
    if not os.path.exists(caminho):
        return {}
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def carregar_analise_estatica(jornada: str, materia: str) -> dict:
    """Carrega analise_estatica.json retornando dict {tema: análise}."""
    caminho = os.path.join(_caminho_questoes(jornada, materia), "analise_estatica.json")
    if not os.path.exists(caminho):
        return {}
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def extrair_metricas_estruturais(questoes: list[dict]) -> dict:
    """
    Calcula métricas estruturais de um conjunto de questões reais:
    - comprimento médio de enunciado
    - frequência de questões negativas (NÃO, EXCETO, INCORRETO)
    - distribuição de bancas
    - tem alternativas longas ou curtas
    """
    if not questoes:
        return {}

    tamanhos = [len(q.get("enunciado", "")) for q in questoes]
    total = len(questoes)

    negativos = sum(
        1 for q in questoes
        if any(p in q.get("enunciado", "").upper() for p in ["NÃO É CORRETO", "INCORRETO", "EXCETO", "NÃO SE", "NÃO CONSTITUI"])
    )

    bancas: dict[str, int] = {}
    for q in questoes:
        b = q.get("banca", "desconhecida")
        bancas[b] = bancas.get(b, 0) + 1

    alt_lengths = []
    for q in questoes:
        for alt in q.get("alternativas", {}).values():
            alt_lengths.append(len(str(alt)))

    return {
        "total_questoes": total,
        "comprimento_medio_enunciado": int(sum(tamanhos) / total) if total else 0,
        "pct_questoes_negativas": round(negativos / total * 100, 1) if total else 0,
        "bancas_presentes": bancas,
        "comprimento_medio_alternativas": int(sum(alt_lengths) / len(alt_lengths)) if alt_lengths else 0,
    }


def selecionar_exemplos(
    banco: dict,
    tema: str,
    banca: Optional[str],
    quantidade: int = 5,
) -> list[dict]:
    """
    Seleciona exemplos reais do banco para o prompt.
    Prioriza questões da banca solicitada; usa aleatório se não houver.
    """
    questoes_tema: list[dict] = banco.get(tema, [])
    if not questoes_tema:
        return []

    # Tenta priorizar questões da banca solicitada
    if banca and banca.lower() not in ("livre", "outra", ""):
        banca_normalizada = banca.lower()
        priorizadas = [
            q for q in questoes_tema
            if banca_normalizada in q.get("banca", "").lower()
        ]
        if len(priorizadas) >= quantidade:
            return random.sample(priorizadas, quantidade)
        # Complementa com outras bancas se não houver suficientes
        resto = [q for q in questoes_tema if q not in priorizadas]
        random.shuffle(resto)
        return (priorizadas + resto)[:quantidade]

    return random.sample(questoes_tema, min(quantidade, len(questoes_tema)))


def extrair_contexto_microtemas(analise: dict, tema: str) -> dict:
    """
    Extrai informações pedagógicas da analise_estatica para o tema:
    - microtemas por peso percentual (ordenados)
    - fingerprint da banca
    - armadilhas mapeadas
    """
    dados_tema = analise.get(tema, {})
    if not dados_tema:
        return {}

    microtemas = sorted(
        dados_tema.get("microtemas_mapeados", []),
        key=lambda x: x.get("peso_percentual", 0),
        reverse=True,
    )

    fingerprint = dados_tema.get("fingerprint_banca", {})

    armadilhas = [m["armadilha_favorita"] for m in microtemas if m.get("armadilha_favorita")]

    return {
        "microtemas_prioritarios": [m["nome_microtema"] for m in microtemas[:5]],
        "armadilhas_mapeadas": armadilhas[:6],
        "estilo_cobranca": fingerprint.get("estilo_cobranca", ""),
        "palavras_gatilho": fingerprint.get("palavras_gatilho", []),
        "total_questoes_banco": dados_tema.get("total_questoes_analisadas", 0),
    }
