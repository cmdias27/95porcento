# backend/auditor_v3.py
import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def limpar_json_ia(texto_ia):
    """Limpeza extrema: remove markdown e garante a captura do bloco JSON"""
    try:
        texto = str(texto_ia).strip()
        texto = re.sub(r"^```json\s*", "", texto, flags=re.IGNORECASE)
        texto = re.sub(r"^```\s*", "", texto)
        texto = re.sub(r"\s*```$", "", texto)
        inicio = texto.find('{')
        fim = texto.rfind('}')
        if inicio != -1 and fim != -1: 
            texto = texto[inicio:fim+1]
        return texto
    except: 
        return texto_ia

def gerar_checklist(
    jornada: str,
    materia: str,
    tema: str,
    faixa_salarial: str,
    contexto_personalizado: list | None = None,
) -> dict:
    """
    Gera checklist adaptado ao nível do aluno.
    Retorna {"topicos": [...], "nivel_elite": bool}
    """
    # Detectar nível
    faixa = (faixa_salarial or "").lower()
    if "elite" in faixa:
        return {"topicos": [], "nivel_elite": True}
    is_inicial = "até" in faixa or ("5.000" in faixa and "a r$" not in faixa)

    if is_inicial:
        instrucao_nivel = (
            "Gere um checklist DETALHADO com tópicos principais E subtópicos. "
            "Para cada tópico principal inclua de 2 a 4 subtópicos relevantes. "
            "Prefixe cada subtópico com '→ ' (ex: '→ Conceito de X'). "
            "Total: entre 20 e 30 itens (tópicos + subtópicos). "
            "Ordem lógica e progressiva."
        )
    else:
        instrucao_nivel = (
            "Gere um checklist SIMPLIFICADO com apenas os tópicos gerais, SEM subtópicos. "
            "Máximo de 10 tópicos diretos e objetivos. "
            "Cada tópico deve estimular recuperação ativa, sem dar a resposta pronta."
        )

    prompt = f"""Você é um professor especialista em {materia}.

Gere um checklist para guiar a explicação oral do tema "{tema}" em uma jornada de {jornada}.

{instrucao_nivel}

Regras obrigatórias:
- Seja 100% específico para "{tema}" em "{materia}" — não gere tópicos genéricos
- Cada tópico deve ser um CONCEITO ou ASPECTO a ser explicado (ex: "Conceito e natureza jurídica", "Elementos constitutivos", "Efeitos da nulidade")
- NÃO mencione provas, bancas, frequência de cobrança ou estratégia de concurso — isso não é relevante aqui
- Priorize: definições, fundamentos, classificações, distinções importantes, aplicações e consequências práticas
- Subtópicos (se houver) devem começar EXATAMENTE com '→ '

Retorne JSON estrito:
{{"topicos": ["Tópico Principal", "→ Subtópico", "→ Subtópico", "Próximo Tópico", ...]}}"""

    if contexto_personalizado:
        topicos_str = "\n".join(f"- {t}" for t in contexto_personalizado)
        prompt += f"""

PERSONALIZAÇÃO — HISTÓRICO DO ALUNO:
Este aluno já apresentou erros ou omissões nos seguintes pontos:
{topicos_str}

INSTRUÇÃO OBRIGATÓRIA:
- Inclua esses pontos no checklist sempre que forem compatíveis com o tema.
- Dê prioridade a distinções conceituais, exceções e pegadinhas relacionadas a esses pontos.
- Não entregue respostas prontas; transforme as lacunas em itens que o aluno precise explicar ativamente.
"""

    if not os.getenv("OPENAI_API_KEY"):
        return {"topicos": [], "nivel_elite": False}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {"topicos": resultado.get("topicos", []), "nivel_elite": False}
    except Exception as e:
        print(f"⚠️ Checklist IA: {e}")
        return {"topicos": [], "nivel_elite": False}


def extrair_assunto(texto: str, jornada: str) -> dict:
    """
    Extrai matéria e tema a partir de texto livre do usuário.
    Retorna {"materia": str, "tema": str}
    """
    if not os.getenv("OPENAI_API_KEY"):
        return {"materia": "", "tema": ""}
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    prompt = f"""O usuário quer estudar algo específico. Texto dele: "{texto}"
Jornada de estudo: {jornada}

Extraia a matéria (disciplina/área) e o tema específico (tópico dentro da matéria) do que o usuário quer estudar.
Exemplos: materia="Direito Constitucional", tema="Princípios Fundamentais"
         materia="Matemática", tema="Frações"
         materia="Português", tema="Concordância Verbal"

Retorne JSON: {{"materia": "...", "tema": "..."}}"""
    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {
            "materia": resultado.get("materia", ""),
            "tema": resultado.get("tema", ""),
        }
    except Exception as e:
        print(f"⚠️ Extrair Assunto: {e}")
        return {"materia": "", "tema": ""}


def _nivel_desc(faixa_salarial: str) -> str:
    faixa = (faixa_salarial or "").lower()
    if "avancado" in faixa or "avançado" in faixa or "elite" in faixa:
        return "Avançado: exija profundidade máxima, múltiplas conexões entre conceitos, alto rigor técnico e abstração."
    if "intermediar" in faixa:
        return "Intermediário: exija conexão entre conceitos, menor apoio contextual, profundidade progressiva."
    return "Iniciante: linguagem acessível, apoio contextual, conceitos diretos e progressivos."


def gerar_perguntas_guiado(jornada: str, materia: str, tema: str, faixa_salarial: str,
                            contexto_personalizado: list | None = None) -> dict:
    """
    Gera N assuntos x 4 fases = N*4 perguntas para o Modo Guiado.
    Retorna {"perguntas": [{id, assunto_idx, assunto, fase, pergunta, dificuldade}], "total_assuntos": N}
    contexto_personalizado: lista de tópicos prioritários do histórico cognitivo do aluno.
    """
    n_assuntos = 5
    nivel_desc = _nivel_desc(faixa_salarial)

    bloco_personalizado = ""
    if contexto_personalizado:
        topicos_str = "\n".join(f"- {t}" for t in contexto_personalizado)
        n_personalizados = min(len(contexto_personalizado), max(1, n_assuntos // 2))
        bloco_personalizado = f"""
PERSONALIZAÇÃO — HISTÓRICO DO ALUNO:
Este aluno tem dificuldades recorrentes nos seguintes tópicos:
{topicos_str}

INSTRUÇÃO OBRIGATÓRIA DE PERSONALIZAÇÃO:
- Inclua OBRIGATORIAMENTE pelo menos {n_personalizados} assuntos relacionados a essas dificuldades.
- Para esses assuntos personalizados: aumente a profundidade nas fases 3 e 4, explorando especificamente os conceitos listados acima.
- Complete os assuntos restantes com tópicos variados do tema para manter equilíbrio e não tornar a sessão repetitiva.
- Os assuntos personalizados devem se misturar naturalmente com os variados — não agrupe todos no início.
"""

    prompt = f"""Você é um professor especialista em {materia}, conduzindo uma sessão de recuperação ativa sobre "{tema}" (jornada: {jornada}).

TAREFA: Gere exatamente {n_assuntos} assuntos distintos e relevantes do tema "{tema}". Para cada assunto, gere exatamente 4 perguntas — uma por fase cognitiva.

FASES (aplicar nesta ordem para CADA assunto):
1 - Conceito Direto: definição e conhecimento básico
2 - Comparação: diferenciação conceitual
3 - Aplicação: uso prático do conhecimento
4 - Análise Crítica: profundidade e raciocínio

NÍVEL DO ALUNO: {nivel_desc}
{bloco_personalizado}
REGRAS:
- Os {n_assuntos} assuntos devem ser DISTINTOS entre si e específicos para "{tema}" em "{materia}"
- Cada assunto deve ter EXATAMENTE 4 perguntas (uma por fase), totalizando {n_assuntos * 4} perguntas
- Perguntas abertas, sem alternativas — o aluno responde oralmente
- "dificuldade": fase 1 = "Básica", fases 2-3 = "Média", fase 4 = "Alta"
- IDs no formato "a{{assunto_idx}}f{{fase}}" (ex: "a0f1", "a0f2", ..., "a1f1", ...)
- Funciona para qualquer área de conhecimento

Retorne JSON estrito com TODAS as {n_assuntos * 4} perguntas em ordem (todos os itens do assunto 0, depois todos do assunto 1, etc.):
{{"total_assuntos": {n_assuntos}, "perguntas": [
  {{"id": "a0f1", "assunto_idx": 0, "assunto": "Nome do 1º assunto", "fase": 1, "pergunta": "Texto aqui?", "dificuldade": "Básica"}},
  {{"id": "a0f2", "assunto_idx": 0, "assunto": "Nome do 1º assunto", "fase": 2, "pergunta": "Texto aqui?", "dificuldade": "Média"}},
  {{"id": "a0f3", "assunto_idx": 0, "assunto": "Nome do 1º assunto", "fase": 3, "pergunta": "Texto aqui?", "dificuldade": "Média"}},
  {{"id": "a0f4", "assunto_idx": 0, "assunto": "Nome do 1º assunto", "fase": 4, "pergunta": "Texto aqui?", "dificuldade": "Alta"}},
  {{"id": "a1f1", "assunto_idx": 1, "assunto": "Nome do 2º assunto", "fase": 1, ...}},
  ...
]}}"""

    if not os.getenv("OPENAI_API_KEY"):
        return {"perguntas": [], "total_assuntos": 0}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {
            "perguntas": resultado.get("perguntas", []),
            "total_assuntos": resultado.get("total_assuntos", n_assuntos),
        }
    except Exception as e:
        print(f"⚠️ Perguntas Guiado: {e}")
        return {"perguntas": [], "total_assuntos": 0}


def avaliar_sessao_guiada(jornada: str, materia: str, tema: str, banca: str,
                           faixa_salarial: str, perguntas_respostas: list) -> dict:
    """
    Avalia as respostas do Modo Guiado via IA.
    Retorna {resumo_geral, avaliacoes, omissoes} — question linking feito em api.py.
    perguntas_respostas: [{id, fase, assunto, pergunta, resposta_aluno, pulada}]
    """
    if not os.getenv("OPENAI_API_KEY"):
        return {"erro": "Chave OPENAI_API_KEY não configurada."}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    faixa = (faixa_salarial or "").lower()
    if "elite" in faixa:
        nivel = "Elite"
    elif "intermediar" in faixa:
        nivel = "Intermediário"
    else:
        nivel = "Inicial"

    itens_str = json.dumps(perguntas_respostas, ensure_ascii=False)

    prompt_sistema = f"""Você é um professor avaliador especialista em {materia}, nível de rigor {nivel}.
Avalie as respostas de uma sessão de estudo ativo oral sobre "{tema}" (jornada: {jornada}, banca: {banca}).

CRITÉRIOS DE CLASSIFICAÇÃO — aplique com rigor, sem condescendência:

"Pulada"     → "pulada" é true. Não avalie o conteúdo.
"Superficial" → Resposta com menos de 10 palavras, ou que apenas repete a pergunta, ou vazia de conteúdo real.
"Acerto"     → Resposta correta E suficientemente completa. O aluno demonstra domínio real do conceito. Pequenas omissões de detalhe são toleradas, desde que o núcleo esteja certo.
"Parcial"    → Use SOMENTE quando o aluno acertou a direção geral do conceito MAS omitiu elemento essencial ou foi impreciso em ponto secundário. Exige que a base conceitual esteja correta.
"Erro"       → Use quando: (a) o conceito central está errado ou invertido; (b) o aluno confundiu conceitos distintos; (c) a resposta é correta na forma mas completamente equivocada no conteúdo; (d) há afirmação tecnicamente falsa; (e) a resposta está correta em algum detalhe periférico mas erra o ponto principal. Em caso de dúvida entre "Parcial" e "Erro", classifique como "Erro".

REGRA CRÍTICA: Não use "Parcial" como zona de conforto para evitar dar "Erro". Se o aluno errou o conceito central, é "Erro", independentemente de ter citado algo relacionado.

SAÍDA OBRIGATÓRIA (JSON estrito):
{{
  "resumo_geral": {{
    "desempenho": "texto 2-3 frases sobre o desempenho geral",
    "profundidade_media": "Alta|Média|Baixa",
    "clareza": "Alta|Média|Baixa",
    "retencao_percebida": "Alta|Média|Baixa"
  }},
  "avaliacoes": [
    {{
      "id": "p1",
      "assunto": "Nome do conceito",
      "status": "Acerto|Parcial|Erro|Superficial|Pulada",
      "feedback": "1-2 frases de feedback direto e honesto sobre a resposta do aluno",
      "ponto_forte": "O que o aluno acertou (deixe vazio se Erro ou Pulada)",
      "ponto_fraco": "O que estava errado ou faltou — seja específico (deixe vazio se Acerto pleno)"
    }}
  ],
  "omissoes": [
    {{"conceito": "Nome do conceito omitido", "importancia": "Por que era esperado"}}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[
                {"role": "system", "content": prompt_sistema},
                {"role": "user", "content": f"PERGUNTAS E RESPOSTAS:\n{itens_str}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {
            "resumo_geral": resultado.get("resumo_geral", {}),
            "avaliacoes": resultado.get("avaliacoes", []),
            "omissoes": resultado.get("omissoes", []),
        }
    except Exception as e:
        print(f"❌ [LOG INTERNO] Avaliação Guiada: {e}")
        return {"erro": "Ocorreu um erro interno ao avaliar a sessão. Tente novamente."}


def gerar_questoes_autorais(itens: list, banca: str, materia: str) -> dict:
    """
    Gera questões autorais no estilo da banca para uma lista de itens.
    itens: [{id, topico, contexto}]
    Retorna {id: {enunciado, alternativas, gabarito, comentario}}
    """
    if not itens or not os.getenv("OPENAI_API_KEY"):
        return {}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    banca_norm = (banca or "").lower().strip()

    if any(x in banca_norm for x in ["cespe", "cebraspe", "unb"]):
        formato_instrucao = (
            "Estilo CESPE/CEBRASPE: escreva uma assertiva afirmativa (frase declarativa, não uma pergunta). "
            "Questão do tipo Certo/Errado. Escolha gabarito C (Certo) ou E (Errado). "
            'Use EXATAMENTE: "alternativas": {"C": "Certo", "E": "Errado"}'
        )
    elif "fgv" in banca_norm:
        formato_instrucao = (
            "Estilo FGV: questão interpretativa com enunciado contextualizado (situação ou trecho). "
            "5 alternativas (A-E). Exige raciocínio e aplicação, não memorização literal."
        )
    elif "fcc" in banca_norm:
        formato_instrucao = (
            "Estilo FCC: questão objetiva e técnica, enunciado direto. "
            "5 alternativas (A-E), foco em definições, classificações e conceitos literais. "
            "Uma alternativa claramente correta, distratores tecnicamente plausíveis."
        )
    elif "vunesp" in banca_norm:
        formato_instrucao = (
            "Estilo VUNESP: questão contextualizada com situação hipotética no enunciado. "
            "5 alternativas (A-E), mistura aplicação prática com conceito teórico."
        )
    elif "iades" in banca_norm:
        formato_instrucao = (
            "Estilo IADES: questão objetiva com enunciado claro. "
            "5 alternativas (A-E), uma correta e quatro distratores bem elaborados."
        )
    elif "quadrix" in banca_norm:
        formato_instrucao = (
            "Estilo QUADRIX: questão objetiva baseada em legislação e normativos. "
            "5 alternativas (A-E), enunciado com base em texto legal ou situação normativa."
        )
    else:
        formato_instrucao = (
            "Questão de múltipla escolha de alta qualidade, padrão concurso público. "
            "5 alternativas (A-E), enunciado claro e objetivo, uma alternativa correta, "
            "distratores tecnicamente plausíveis."
        )

    itens_str = json.dumps(itens, ensure_ascii=False)

    prompt = f"""Você é um elaborador de questões especialista em {materia}.

Gere UMA questão autoral para CADA item da lista abaixo. Cada questão deve testar o "topico" do item, com relação direta ao "contexto" fornecido.

FORMATO: {formato_instrucao}

REGRAS OBRIGATÓRIAS:
- Gere exatamente uma questão por item — mesmo número de itens na saída
- O campo "id" de cada questão deve ser IDÊNTICO ao "id" do item de entrada
- Questão 100% original — não copie enunciados de provas conhecidas
- Inclua comentário objetivo (1-2 frases) justificando o gabarito
- Para questões A-E: gabarito é uma única letra maiúscula (A, B, C, D ou E)
- Para questões C/E: gabarito é "C" ou "E"

Retorne JSON estrito:
{{"questoes": [
  {{
    "id": "id_do_item",
    "enunciado": "Texto completo da questão",
    "alternativas": {{}},
    "gabarito": "X",
    "comentario": "Justificativa objetiva do gabarito"
  }}
]}}

ITENS:
{itens_str}"""

    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {q["id"]: q for q in resultado.get("questoes", []) if q.get("id")}
    except Exception as e:
        print(f"⚠️ Questões Autorais: {e}")
        return {}


def gerar_comentarios_questoes(questoes: list, materia: str) -> dict:
    """
    Recebe questões vinculadas. Retorna {id: comentario_reescrito}.
    Se houver comentario original, reescreve. Se não houver, gera do zero.
    """
    if not questoes or not os.getenv("OPENAI_API_KEY"):
        return {}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    itens = [
        {
            "id": q.get("id", ""),
            "enunciado": q.get("enunciado", "")[:500],
            "gabarito": q.get("gabarito", ""),
            "comentario_original": q.get("comentario", "")
        }
        for q in questoes if q.get("id")
    ]

    if not itens:
        return {}

    prompt = f"""Você é um professor de concursos públicos especialista em {materia}.

Para cada questão abaixo, escreva um comentário didático direto (2 a 4 frases) no estilo dos professores de cursinho de concurso — objetivo, preciso, sem enrolação.
- Se "comentario_original" não estiver vazio: reescreva com suas próprias palavras sem copiar nenhuma frase inteira. Preserve o conteúdo técnico, mas use linguagem nova.
- Se "comentario_original" estiver vazio: crie um comentário explicando por que o gabarito é correto e o conceito-chave que o aluno deve dominar.

Retorne JSON estrito:
{{"comentarios": [{{"id": "id_da_questao", "comentario": "texto aqui"}}]}}

QUESTÕES:
{json.dumps(itens, ensure_ascii=False)}"""

    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {c["id"]: c["comentario"] for c in resultado.get("comentarios", []) if c.get("id")}
    except Exception as e:
        print(f"⚠️ Comentários IA: {e}")
        return {}


def gerar_cenario_simulado(jornada: str, materia: str, tema: str, faixa_salarial: str,
                            contexto_personalizado: list | None = None) -> dict:
    """
    Gera 1 cenário contextualizado + 5 perguntas progressivas para o Modo Simulado.
    Retorna {"cenario": {titulo, descricao, complexidade}, "perguntas": [{id, fase, objetivo, pergunta}]}
    contexto_personalizado: lista de tópicos prioritários do histórico cognitivo do aluno.
    """
    faixa = (faixa_salarial or "").lower()
    if "elite" in faixa:
        complexidade = "Elite"
        nivel_desc = (
            "ELITE: crie um cenário COMPLEXO com múltiplos elementos, ambiguidades intencionais, "
            "conexões avançadas entre conceitos e situações que exijam análise crítica profunda. "
            "Simule situações reais difíceis que um profissional especialista enfrentaria."
        )
    elif "intermediar" in faixa:
        complexidade = "Intermediário"
        nivel_desc = (
            "INTERMEDIÁRIO: crie um cenário com múltiplos elementos que exija interpretação cuidadosa, "
            "identificação de causas e efeitos, e aplicação de conceitos em contexto real. "
            "Profundidade progressiva e maior exigência analítica."
        )
    else:
        complexidade = "Inicial"
        nivel_desc = (
            "INICIAL: crie um cenário simples e direto com poucos elementos, linguagem clara e acessível. "
            "O problema deve ser objetivo e a solução alcançável com conhecimento básico do tema."
        )

    bloco_personalizado = ""
    if contexto_personalizado:
        topicos_str = "\n".join(f"- {t}" for t in contexto_personalizado)
        bloco_personalizado = f"""
PERSONALIZAÇÃO — HISTÓRICO DO ALUNO:
Este aluno tem dificuldades recorrentes nos seguintes tópicos:
{topicos_str}

INSTRUÇÃO OBRIGATÓRIA DE PERSONALIZAÇÃO:
- O cenário DEVE envolver naturalmente esses conceitos — construa a situação de forma que eles sejam centrais.
- As perguntas progressivas devem explorar especificamente esses pontos fracos, exigindo que o aluno os aplique no contexto do cenário.
- Mantenha o equilíbrio: não abandone outros aspectos do tema. O objetivo é aprofundar, não punir.
"""

    prompt = f"""Você é um professor especialista em {materia}, criando uma simulação de estudo ativo sobre "{tema}" (jornada: {jornada}).

TAREFA: Crie 1 cenário contextualizado + 5 perguntas progressivas sobre esse cenário.

NÍVEL: {nivel_desc}
{bloco_personalizado}
ESTRUTURA DO CENÁRIO:
- "titulo": título curto e impactante do caso (máx. 10 palavras)
- "descricao": descrição detalhada do cenário (4-8 frases). Apresente: contexto, situação atual, problema central, elementos relevantes. Seja específico para "{tema}" em "{materia}".
- "complexidade": "{complexidade}"

FASES DAS PERGUNTAS (5 obrigatórias, em ordem):
Fase 1 — Interpretação: avaliar compreensão do cenário
Fase 2 — Identificação do Problema: avaliar capacidade analítica
Fase 3 — Aplicação do Conhecimento: avaliar domínio prático
Fase 4 — Solução / Decisão: avaliar capacidade de resolver problemas
Fase 5 — Análise Crítica: avaliar profundidade e consequências

REGRAS:
- O cenário deve ser específico para "{tema}" em "{materia}" — não genérico
- As 5 perguntas devem ser contextualmente ligadas ao cenário apresentado
- Perguntas abertas, sem alternativas — o aluno responde oralmente
- Funciona para qualquer área de conhecimento
- IDs: "f1", "f2", "f3", "f4", "f5"

Retorne JSON estrito:
{{"cenario": {{"titulo": "Título do caso", "descricao": "Descrição detalhada em 4-8 frases.", "complexidade": "{complexidade}"}},
"perguntas": [
  {{"id": "f1", "fase": 1, "objetivo": "Interpretação", "pergunta": "Pergunta sobre o cenário?"}},
  {{"id": "f2", "fase": 2, "objetivo": "Identificação do Problema", "pergunta": "Pergunta sobre o cenário?"}},
  {{"id": "f3", "fase": 3, "objetivo": "Aplicação do Conhecimento", "pergunta": "Pergunta sobre o cenário?"}},
  {{"id": "f4", "fase": 4, "objetivo": "Solução / Decisão", "pergunta": "Pergunta sobre o cenário?"}},
  {{"id": "f5", "fase": 5, "objetivo": "Análise Crítica", "pergunta": "Pergunta sobre o cenário?"}}
]}}"""

    if not os.getenv("OPENAI_API_KEY"):
        return {"cenario": {}, "perguntas": []}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {
            "cenario": resultado.get("cenario", {}),
            "perguntas": resultado.get("perguntas", []),
        }
    except Exception as e:
        print(f"⚠️ Cenário Simulado: {e}")
        return {"cenario": {}, "perguntas": []}


def avaliar_sessao_simulada(jornada: str, materia: str, tema: str, banca: str,
                             faixa_salarial: str, cenario: dict, perguntas_respostas: list) -> dict:
    """
    Avalia as respostas do Modo Simulado via IA, considerando o cenário.
    Retorna {resumo_geral, diagnostico_cognitivo, avaliacoes, omissoes}
    """
    if not os.getenv("OPENAI_API_KEY"):
        return {"erro": "Chave OPENAI_API_KEY não configurada."}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    faixa = (faixa_salarial or "").lower()
    if "elite" in faixa:
        nivel = "Elite"
    elif "intermediar" in faixa:
        nivel = "Intermediário"
    else:
        nivel = "Inicial"

    cenario_str = json.dumps(cenario, ensure_ascii=False)
    itens_str = json.dumps(perguntas_respostas, ensure_ascii=False)

    prompt_sistema = f"""Você é um professor avaliador especialista em {materia}, nível de rigor {nivel}.
Avalie as respostas de uma sessão de simulado sobre "{tema}" (jornada: {jornada}, banca: {banca}).

CENÁRIO APRESENTADO AO ALUNO:
{cenario_str}

CRITÉRIOS DE CLASSIFICAÇÃO — aplique com rigor, sem condescendência:

"Pulada"      → "pulada" é true. Não avalie o conteúdo.
"Superficial" → Resposta com menos de 10 palavras, ou que apenas repete a pergunta, ou vazia de conteúdo real.
"Acerto"      → Resposta correta E suficientemente completa. O aluno demonstra domínio real do conceito. Pequenas omissões de detalhe são toleradas, desde que o núcleo esteja certo.
"Parcial"     → Use SOMENTE quando o aluno acertou a direção geral do conceito MAS omitiu elemento essencial ou foi impreciso em ponto secundário. Exige que a base conceitual esteja correta.
"Erro"        → Use quando: (a) o raciocínio sobre o cenário está fundamentalmente equivocado; (b) o aluno confundiu conceitos distintos; (c) a resposta erra o ponto principal da pergunta; (d) há afirmação tecnicamente falsa; (e) a solução proposta é inviável ou contraproducente no contexto do cenário. Em caso de dúvida entre "Parcial" e "Erro", classifique como "Erro".

REGRA CRÍTICA: Não use "Parcial" como zona de conforto para evitar dar "Erro". Se o aluno errou o conceito central ou o raciocínio principal sobre o cenário, é "Erro", independentemente de ter citado algo tangencialmente relacionado.

DIAGNÓSTICO COGNITIVO: avalie o desempenho global nas 5 dimensões com base no conjunto das respostas.
Use "Alta", "Média" ou "Baixa" para cada dimensão — sem inflacionar. Se o conjunto de respostas foi fraco, reflita isso.

SAÍDA OBRIGATÓRIA (JSON estrito):
{{
  "resumo_geral": {{
    "desempenho": "texto 2-3 frases sobre o desempenho na simulação — honesto e direto",
    "profundidade_media": "Alta|Média|Baixa",
    "clareza": "Alta|Média|Baixa",
    "retencao_percebida": "Alta|Média|Baixa"
  }},
  "diagnostico_cognitivo": {{
    "clareza": "Alta|Média|Baixa",
    "profundidade": "Alta|Média|Baixa",
    "interpretacao": "Alta|Média|Baixa",
    "logica": "Alta|Média|Baixa",
    "argumentacao": "Alta|Média|Baixa"
  }},
  "avaliacoes": [
    {{
      "id": "f1",
      "objetivo": "Interpretação",
      "status": "Acerto|Parcial|Erro|Superficial|Pulada",
      "feedback": "1-2 frases de feedback direto e honesto sobre a resposta do aluno",
      "ponto_forte": "O que o aluno acertou (deixe vazio se Erro ou Pulada)",
      "ponto_fraco": "O que estava errado ou faltou — seja específico (deixe vazio se Acerto pleno)"
    }}
  ],
  "omissoes": [
    {{"conceito": "Nome do conceito omitido", "importancia": "Por que era esperado"}}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[
                {"role": "system", "content": prompt_sistema},
                {"role": "user", "content": f"PERGUNTAS E RESPOSTAS:\n{itens_str}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        resultado = json.loads(limpar_json_ia(response.choices[0].message.content), strict=False)
        return {
            "resumo_geral": resultado.get("resumo_geral", {}),
            "diagnostico_cognitivo": resultado.get("diagnostico_cognitivo", {}),
            "avaliacoes": resultado.get("avaliacoes", []),
            "omissoes": resultado.get("omissoes", []),
        }
    except Exception as e:
        print(f"❌ [LOG INTERNO] Avaliação Simulada: {e}")
        return {"erro": "Ocorreu um erro interno ao avaliar a sessão simulada. Tente novamente."}


def run_dynamic_audit(jornada, materia, tema, aula_text, banca='Livre', dados_auditoria="",
                      contexto_personalizado: list | None = None):
    if not os.getenv("OPENAI_API_KEY"):
        return {"erro": "Chave OPENAI_API_KEY não configurada."}

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    is_livre = banca.lower() == 'livre'
    nome_banca_prompt = "principais bancas do país" if is_livre else f"banca {banca}"

    j = jornada.lower()
    if j == 'oab':
        persona = "Examinador Sênior especialista na OAB (banca FGV) e em Ética Jurídica"
        nome_banca_prompt = "OAB/FGV — provas casuísticas, sempre com caso concreto e 4 alternativas plausíveis"
    elif j == 'enem':
        persona = "Corretor Especialista do INEP/MEC, com domínio em competências e habilidades interdisciplinares"
    elif j == 'concurso':
        persona = "Examinador Sênior e Especialista nas principais bancas" if is_livre else f"Examinador Sênior e Especialista na banca {banca}"
    else:
        persona = "Examinador Sênior especialista em concursos públicos"

    bloco_personalizado = ""
    if contexto_personalizado:
        topicos_str = "\n".join(f"- {t}" for t in contexto_personalizado)
        bloco_personalizado = f"""
--- HISTÓRICO DO ALUNO (ATENÇÃO REDOBRADA) ---
Este aluno tem histórico de erros e omissões nos tópicos abaixo. Durante a auditoria, seja ESPECIALMENTE rigoroso ao avaliar estes itens — não aceite explicações superficiais como suficientes:
{topicos_str}
-----------------------------------------------
"""

    template_sistema = f"""
Você é um {persona}, atuando como um MENTOR DE ELITE especialista na matéria de {materia}.
Sua missão é atuar como um SCANNER DE EVIDÊNCIAS da "Aula" do candidato sobre o tema "{tema}" (foco: {nome_banca_prompt}).

ATENÇÃO: VOCÊ NÃO FARÁ CÁLCULOS MATEMÁTICOS NEM DARÁ NOTAS. O SEU TRABALHO É APENAS MAPEAR A PRESENÇA OU AUSÊNCIA DOS ITENS.
{bloco_personalizado}
--- BASE DE INTELIGÊNCIA TÉCNICA (SEU GABARITO OFICIAL) ---
{dados_auditoria}
----------------------------------------------------------------

--- INSTRUÇÕES DE MAPEAMENTO (CRÍTICO - NÃO INVENTE DADOS) ---
1. ANALISE DO MENTOR: Escreva OBRIGATORIAMENTE 1 parágrafo direto e preciso, com entre 5 e 7 linhas. Resuma o domínio geral do candidato sobre "{tema}": o que foi explicado com qualidade, quais as lacunas mais críticas identificadas e o nível geral de preparo para prova. Não repita itens individualmente — sintetize o perfil.
2. AUDITORIA DO ROTEIRO: Para ABSOLUTAMENTE TODOS os itens do "[ROTEIRO TÉCNICO IDEAL]", classifique como:
   - "Dominado": O aluno explicou o NÚCLEO ESSENCIAL deste tópico de forma correta. Não exija perfeição absoluta — basta que a ideia principal esteja certa e desenvolvida com alguma substância.
   - "Parcial": Abordou a ideia principal corretamente, mas omitiu aspectos relevantes ou não desenvolveu suficientemente para uma prova.
   - "Superficial": Apenas citou ou mencionou o tópico de passagem, sem nenhuma explicação real do conceito.
   - "Incorreto": Afirmou algo tecnicamente FALSO sobre este tópico especificamente — confundiu conceitos ou inverteu a regra.
   - "Omitido": Não mencionou este tópico em nenhum momento da aula.
   REGRA DE INDEPENDÊNCIA (CRÍTICA): Avalie cada tópico de forma ISOLADA. O fato de o aluno ter errado OUTRO tópico NÃO contamina a avaliação deste. Se o aluno explicou corretamente o conceito X mas errou o conceito Y, X é "Dominado" e Y é "Incorreto" — nunca marque X como "Incorreto" por causa de Y.
   REGRA DE ESCALA: Prefira "Dominado" a "Parcial" quando o aluno acertou o núcleo e apenas faltou detalhe secundário. Prefira "Parcial" a "Superficial" quando desenvolveu minimamente além de citar. Prefira "Superficial" a "Omitido" quando ao menos mencionou.
3. AUDITORIA DE INCIDÊNCIA (ATENÇÃO MÁXIMA): Copie EXATAMENTE os itens listados no bloco "[PESOS DE INCIDÊNCIA NA PROVA]". É ESTRITAMENTE PROIBIDO inventar assuntos ou alterar os percentuais. Preencha 'explicou_bem' como true ou false.
4. AUDITORIA DE PEGADINHAS: Para cada item em "[ANATOMIA E PEGADINHAS DA BANCA]", marque 'caiu_na_pegadinha' como true se ele explicou errado ou se OMITIU a explicação dessa exceção/pegadinha.
5. INCONSISTÊNCIAS: Cite apenas trechos onde o aluno afirmou algo TECNICAMENTE FALSO — uma "mentira conceitual" verificável. Não inclua omissões ou simplificações, apenas afirmações incorretas.
6. OMISSÕES INTELIGENTES: Com base no seu conhecimento especializado sobre "{tema}" para {nome_banca_prompt}, identifique conceitos, aplicações, variações ou subtópicos que um candidato de alto desempenho DEVERIA ter abordado mas que NÃO aparecem na aula — independentemente do roteiro fornecido. Liste apenas omissões relevantes e cobráveis em prova. Seja específico: não repita o que já está no roteiro como "Omitido", adicione apenas o que vai ALÉM do roteiro.
7. ACERTOS DO CONHECIMENTO GERAL: Identifique os conceitos ou tópicos que o aluno explicou CORRETAMENTE na aula e que NÃO estão cobertos pelo [ROTEIRO TÉCNICO IDEAL] acima. Estes são pontos positivos do conhecimento geral do aluno sobre "{tema}". Liste APENAS afirmações corretas e relevantes — ignore erros. Se nada além do roteiro foi explicado corretamente, retorne lista vazia.

--- SAÍDA OBRIGATÓRIA (Formato JSON Estrito) ---
{{
    "analise_mentor": "Parágrafo 1...",
    "auditoria_roteiro": [
        {{ "topico": "Nome exato do item da base", "status": "Dominado", "justificativa": "Detalhe..." }}
    ],
    "auditoria_incidencia": [
        {{ "assunto": "COPIE O NOME DO GABARITO", "percentual_peso": <COPIE O NÚMERO EXATO DO GABARITO>, "explicou_bem": true }}
    ],
    "auditoria_pegadinhas": [
        {{ "pegadinha": "Descrição da pegadinha", "caiu_na_pegadinha": true }}
    ],
    "inconsistencias_criticas": [
        {{ "trecho_aluno": "citação exata do erro com aspas simples", "correcao": "..." }}
    ],
    "omissoes_inteligentes": [
        {{ "tema": "Nome do conceito omitido", "resumo": "Por que era esperado e o que o candidato perdeu ao não abordar." }}
    ],
    "acertos_gerais": [
        {{ "topico": "Conceito explicado corretamente", "justificativa": "Por que está correto e qual aspecto o aluno dominou." }}
    ]
}}
    """
    
    try:
        # Retornamos para o gpt-4o para garantir a capacidade cognitiva de seguir regras longas sem alucinar
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[
                {"role": "system", "content": template_sistema},
                {"role": "user", "content": f"AULA DO CANDIDATO:\n{aula_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        texto_bruto = response.choices[0].message.content
        texto_limpo = limpar_json_ia(texto_bruto)
        return json.loads(texto_limpo, strict=False)

    except Exception as e:
        print(f"❌ [LOG INTERNO] Erro na auditoria dinâmica: {e}")
        return {"erro": "Ocorreu um erro interno ao processar a auditoria. Tente novamente."}
