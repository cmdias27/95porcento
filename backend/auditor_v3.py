# backend/auditor_v3.py
import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

def get_auditor_chain():
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        max_output_tokens=8192,
        response_mime_type="application/json" 
    )

    template = """
Você é um {persona_avaliador}, especialista em {materia}.
Realize uma auditoria técnica no tema "{tema}"{subtema_str}.

Analise a “Aula Simulada” do candidato cruzando o que ele disse com as PEGADINHAS DA BANCA abaixo.

AULA DO CANDIDATO:
{aula}

PEGADINHAS DA BANCA (Verifique se o aluno caiu nelas):
{dados_estaticos}

---
REGRAS DE AVALIAÇÃO:
1. ERROS E ACERTOS: Avalie normalmente o que foi dito. NÃO fragmente sentenças. Se cometeu dois erros na mesma frase, crie apenas UMA inconsistência integral.
2. PREDIÇÃO DE PROVA: Defina a probabilidade de acerto (0 a 100) baseada nos erros críticos e pegadinhas.
3. SEU RESULTADO: Escreva um parágrafo direto justificando o porquê de ele acertar ou errar questões, citando especificamente se ele dominou ou falhou nas 'Pegadinhas da Banca' apresentadas.

---
SAÍDA OBRIGATÓRIA:
Siga EXATAMENTE esta estrutura JSON:
{{
    "raciocinio_interno": "Breve avaliação",
    "porcentagem_conhecimento": 85,
    "probabilidade_acerto": 70,
    "seu_resultado": "Justificativa cruzando a aula com as pegadinhas fornecidas.",
    "checklist_acertos": ["Acerto 1", "Acerto 2"],
    "erros_cometidos": [
        {{
            "trecho_aluno": "Erro dito de forma integral",
            "correcao": "Correção direta"
        }}
    ],
    "temas_nao_abordados": [
        {{
            "tema": "Omissão",
            "resumo": "Explicação"
        }}
    ],
    "plano_de_estudo": [
        {{
            "titulo": "Tema",
            "foco": "Diretriz"
        }}
    ]
}}
    """
    prompt = ChatPromptTemplate.from_template(template)
    return prompt | llm | StrOutputParser()

def run_dynamic_audit(jornada, materia, tema, aula_text, subtema=None, dados_estaticos="Sem pegadinhas informadas."):
    if not os.getenv("GOOGLE_API_KEY"):
        return {"erro": "Chave GOOGLE_API_KEY não configurada."}

    if jornada == 'concurso':
        persona = "Examinador Sênior (FGV, CEBRASPE, FCC)"
    elif jornada == 'enem':
        persona = "Corretor Especialista do MEC"
    else:
        persona = "Especialista Acadêmico"

    subtema_str = f" (subtema: {subtema})" if subtema else ""
    chain = get_auditor_chain()
    
    try:
        texto_bruto = chain.invoke({
            "persona_avaliador": persona,
            "materia": materia,
            "tema": tema,
            "subtema_str": subtema_str,
            "aula": aula_text,
            "dados_estaticos": dados_estaticos
        })
        
        return json.loads(texto_bruto)

    except json.JSONDecodeError as e:
        print(f"❌ Erro de Parse do JSON: {e}")
        return {"erro": "A IA gerou um formato inválido. Tente enviar novamente."}
    except Exception as e:
        print(f"❌ Erro na execução: {e}")
        return {"erro": str(e)}