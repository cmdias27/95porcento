# backend/gerador_analise.py
import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Carrega as chaves do .env (certifique-se de ter OPENAI_API_KEY lá)
load_dotenv()

def gerar_analise_estatica(caminho_questoes):
    print(f"\n🔍 Buscando arquivo em: {caminho_questoes}")
    
    # 1. Verifica se o arquivo de questões existe
    if not os.path.exists(caminho_questoes):
        print("❌ Erro: Arquivo questoes.json não encontrado neste caminho.")
        return

    pasta_base = os.path.dirname(caminho_questoes)
    caminho_saida = os.path.join(pasta_base, "analise_estatica.json")

    # 2. Lê e otimiza as questões (Corta as alternativas para economizar Tokens)
    with open(caminho_questoes, 'r', encoding='utf-8') as f:
        dados = json.load(f)

    questoes = dados.get("questoes", [])
    if not questoes:
        print("❌ Nenhuma questão encontrada no JSON.")
        return

    texto_questoes = ""
    for i, q in enumerate(questoes):
        # Passamos apenas enunciado, gabarito e comentário para a IA mapear as pegadinhas
        texto_questoes += f"Q{i+1}: {q.get('enunciado')}\nGabarito: {q.get('gabarito')}\nComentário: {q.get('comentario')}\n\n"

    print(f"✅ {len(questoes)} questões carregadas. Enviando para o ChatGPT (GPT-4o)...")

    # 3. Configura a IA da OpenAI com JSON Mode travado
    llm = ChatOpenAI(
        model="gpt-4o", # Você pode mudar para "gpt-4o-mini" se quiser baratear os testes
        temperature=0.2,
        model_kwargs={"response_format": {"type": "json_object"}}
    )

    template = """
    Você é um especialista em concursos públicos e análise de bancas (FGV, CEBRASPE, FCC).
    Abaixo está um banco de questões reais sobre um tema específico.
    Sua tarefa é analisar as questões e comentários para mapear a incidência dos assuntos e as pegadinhas mais frequentes.

    QUESTÕES FORNECIDAS:
    {questoes}

    ---
    REGRAS DE EXTRAÇÃO:
    1. "assuntos_maior_incidencia": Extraia os 5 a 7 assuntos mais abordados. "incidencia_aproximada" deve ser um número inteiro (a soma não precisa ser 100%, reflete a frequência no lote).
    2. "pegadinhas_frequentes": Extraia de 5 a 7 pegadinhas conceituais citadas nos comentários das questões.

    SAÍDA OBRIGATÓRIA:
    Você deve retornar EXATAMENTE a estrutura JSON abaixo, sem blocos markdown.
    {{
      "assuntos_maior_incidencia": [
        {{
          "posicao": 1,
          "assunto": "Nome do Assunto",
          "incidencia_aproximada": 15,
          "subtemas": ["Subtema 1", "Subtema 2"]
        }}
      ],
      "pegadinhas_frequentes": [
        {{
          "posicao": 1,
          "pegadinha": "Nome Curto da Pegadinha",
          "incidencia_aproximada": 8,
          "detalhe": "Explicação de como a banca tenta confundir o candidato."
        }}
      ]
    }}
    """

    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()

    try:
        # Executa a chamada
        resultado_str = chain.invoke({"questoes": texto_questoes})
        resultado_json = json.loads(resultado_str)

        # 4. Salva o novo arquivo na mesma pasta do questoes.json
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            json.dump(resultado_json, f, ensure_ascii=False, indent=2)

        print(f"🎯 SUCESSO! Inteligência gerada e salva em:\n{caminho_saida}\n")

    except Exception as e:
        print(f"❌ Erro crítico ao processar e salvar a análise: {e}")

if __name__ == "__main__":
    # COLOQUE AQUI O CAMINHO DA PASTA ONDE ESTÃO AS SUAS QUESTÕES
    # Use o 'r' antes das aspas para que o Python entenda o formato de diretório do Windows
    
    caminho_alvo = r"C:\Users\cassio\Desktop\Projetos Pyhton\AprendizadoAtivo_v5\backend\questoes\Concurso\Direito Administrativo\Poderes Administrativos\questoes.json"
    
    gerar_analise_estatica(caminho_alvo)