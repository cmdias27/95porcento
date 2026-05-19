# core/simulador.py
"""
Orquestrador do simulador de questões inéditas.
Coordena análise do banco, seleção de exemplos e geração via LLM.
"""

from .analisador_banca import (
    carregar_banco_questoes,
    carregar_analise_estatica,
    selecionar_exemplos,
    extrair_contexto_microtemas,
)
from .gerador_questoes import gerar_questoes


def gerar_questoes_ineditas(
    jornada: str,
    materia: str,
    tema: str,
    faixa_salarial: str,
    banca: str,
    tipo_questao: str,
    quantidade: int,
) -> dict:
    """
    Gera questões inéditas com DNA real da banca e nível de dificuldade preciso.

    Parâmetros
    ----------
    jornada       : 'Concurso', 'ENEM', 'OAB'
    materia       : nome da matéria (ex: 'Direito Administrativo')
    tema          : tema específico dentro da matéria
    faixa_salarial: 'Inicial' | 'Intermediario' | 'Avancado' | 'Elite'
                    (aceita também os valores legados de faixa salarial)
    banca         : 'Cebraspe' | 'FGV' | 'FCC' | 'Vunesp' | 'ENEM' | 'OAB' | 'Livre'
    tipo_questao  : 'Certo/Errado' | 'Múltipla Escolha'
    quantidade    : número de questões a gerar
    """
    banco = carregar_banco_questoes(jornada, materia)
    analise = carregar_analise_estatica(jornada, materia)

    exemplos = selecionar_exemplos(banco, tema, banca, quantidade=6)
    contexto_microtemas = extrair_contexto_microtemas(analise, tema)

    return gerar_questoes(
        jornada=jornada,
        materia=materia,
        tema=tema,
        faixa_ou_nivel=faixa_salarial,
        banca=banca,
        tipo_questao=tipo_questao,
        quantidade=quantidade,
        exemplos=exemplos,
        contexto_microtemas=contexto_microtemas,
    )
