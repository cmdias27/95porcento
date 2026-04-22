# backend/pdf_to_questions.py
import os
import json
import glob
import pdfplumber
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

def extrair_texto_pdf(caminho_pdf):
    """Extrai todo o texto do PDF para enviar à IA."""
    print(f"📖 Lendo PDF: {os.path.basename(caminho_pdf)}...")
    texto_completo = ""
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                texto_completo += pagina.extract_text() + "\n"
        return texto_completo
    except Exception as e:
        print(f"❌ Erro ao ler PDF {os.path.basename(caminho_pdf)}: {e}")
        return None

def converter_pdf_para_json(caminho_pdf):
    # 1. Extração do texto
    texto_bruto = extrair_texto_pdf(caminho_pdf)
    if not texto_bruto: return

    print("🤖 Enviando para o Gemini processar as questões... (Isso pode levar alguns segundos)")

    # 2. Configuração da IA
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.1,
        response_mime_type="application/json"
    )

    # 3. Prompt estruturado
    prompt = ChatPromptTemplate.from_template("""
        Você é um especialista em processamento de materiais didáticos para concursos.
        Seu objetivo é extrair APENAS as questões comentadas do texto fornecido abaixo.

        REGRAS DE EXTRAÇÃO:
        1. Localize seções como "questões para fixação", "questões comentadas" ou "lista de questões".
        2. Ignore textos teóricos, apresentações ou sumários.
        3. Identifique se a questão é "Múltipla Escolha" ou "Certo/Errado".
        4. Capture o enunciado completo, as alternativas (se houver), o gabarito e o comentário detalhado do professor.

        TEXTO DO PDF:
        {texto}

        ---
        RETORNO OBRIGATÓRIO (JSON):
        {{
          "questoes": [
            {{
              "tipo": "Múltipla Escolha ou Certo/Errado",
              "enunciado": "Texto da pergunta.",
              "alternativas": {{"A": "texto A", "B": "texto B", "C": "texto C", "D": "texto D", "E": "texto E"}}, 
              "gabarito": "Letra ou Certo/Errado",
              "comentario": "Explicação técnica do professor."
            }}
          ]
        }}
    """)

    chain = prompt | llm | StrOutputParser()

    try:
        # Chamada da IA
        resposta_json_str = chain.invoke({"texto": texto_bruto})
        dados_questoes = json.loads(resposta_json_str)

        # 4. Salvando o arquivo ESTRITAMENTE como questoes.json na mesma pasta do PDF
        pasta_destino = os.path.dirname(caminho_pdf)
        caminho_saida = os.path.join(pasta_destino, "questoes.json")

        with open(caminho_saida, 'w', encoding='utf-8') as f:
            json.dump(dados_questoes, f, ensure_ascii=False, indent=2)

        print(f"✅ SUCESSO! {len(dados_questoes.get('questoes', []))} questões extraídas e salvas em:\n{caminho_saida}")

    except Exception as e:
        print(f"❌ Erro no processamento da IA para o arquivo {os.path.basename(caminho_pdf)}: {e}")

def processar_pasta_pdfs(pasta_raiz):
    """Busca todos os PDFs na pasta e subpastas e processa um por um."""
    print(f"🔎 Buscando arquivos PDF na pasta: {pasta_raiz}")
    
    # O '**/*.pdf' com recursive=True busca na pasta raiz e em todas as subpastas
    padrao_busca = os.path.join(pasta_raiz, "**", "*.pdf")
    arquivos_pdf = glob.glob(padrao_busca, recursive=True)
    
    if not arquivos_pdf:
        print("⚠️ Nenhum arquivo PDF encontrado no diretório informado.")
        return
        
    print(f"📑 Encontrados {len(arquivos_pdf)} arquivo(s) PDF. Iniciando extração...\n")
    
    for i, caminho_pdf in enumerate(arquivos_pdf, 1):
        print(f"{'-'*50}")
        print(f"▶️ Processando arquivo {i} de {len(arquivos_pdf)}")
        converter_pdf_para_json(caminho_pdf)
        
    print(f"\n{'-'*50}")
    print("🎉 PROCESSAMENTO EM LOTE CONCLUÍDO!")

if __name__ == "__main__":
    # COLOQUE O CAMINHO DA PASTA RAIZ AQUI
    # O script vai procurar PDFs nesta pasta e em todas as pastas dentro dela.
    pasta_alvo = r"C:\Users\cassio\Desktop\Materiais"
    
    processar_pasta_pdfs(pasta_alvo)