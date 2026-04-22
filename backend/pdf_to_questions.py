# backend/pdf_to_questions.py
import os
import json
import glob
import re
import pdfplumber
import threading
import concurrent.futures
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Trava de segurança para impedir que duas threads salvem o JSON ao mesmo tempo (Race Condition)
lock_salvamento = threading.Lock()

def normalizar_texto(texto):
    """Cria uma 'assinatura' do texto para evitar duplicatas."""
    return re.sub(r'\W+', '', str(texto).lower())

def limpar_json_ia(texto_ia):
    """Isola o JSON puro ignorando textos extras da IA."""
    try:
        inicio = texto_ia.find('{')
        fim = texto_ia.rfind('}')
        if inicio != -1 and fim != -1:
            return texto_ia[inicio:fim+1]
        return texto_ia
    except Exception:
        return texto_ia

def extrair_lote_seguro(lote_paginas, chain_extrator):
    """Tenta extrair um lote. Se estourar o limite de tokens, divide ao meio e tenta de novo."""
    texto_lote = "\n".join(lote_paginas)
    if not texto_lote.strip(): 
        return []
        
    try:
        res_extrator = chain_extrator.invoke({"texto": texto_lote})
        return json.loads(limpar_json_ia(res_extrator)).get("questoes", [])
    except Exception as e:
        if len(lote_paginas) > 1:
            meio = len(lote_paginas) // 2
            print(f"      ⚠️ Lote denso. Dividindo para evitar corte de tokens...")
            metade1 = extrair_lote_seguro(lote_paginas[:meio], chain_extrator)
            metade2 = extrair_lote_seguro(lote_paginas[meio:], chain_extrator)
            return metade1 + metade2
        else:
            print(f"      ❌ Erro irrecuperável na página (muito texto): {e}")
            return []

def processar_pasta_pdfs():
    print("=" * 60)
    print("EXTRATOR MULTITHREAD TURBO MULTI-TEMA - 95PORCENTO")
    print("=" * 60)
    
    pasta_pdfs = input("📁 Pasta com PDFs: ").strip()
    jornada = input("🎯 Jornada (ex: Concurso): ").strip().capitalize()
    materia = input("📚 Matéria (ex: Portugues): ").strip()
    
    if pasta_pdfs.startswith(('"', "'")): pasta_pdfs = pasta_pdfs[1:-1]
    
    pasta_destino = os.path.join(os.path.dirname(__file__), "questoes", jornada, materia)
    os.makedirs(pasta_destino, exist_ok=True)
    caminho_json_central = os.path.join(pasta_destino, "questoes.json")
    caminho_temas = os.path.join(pasta_destino, "temas.json")
    
    if not os.path.exists(caminho_temas):
        print(f"\n❌ ERRO: O arquivo 'temas.json' não foi encontrado em: {caminho_temas}")
        return

    with open(caminho_temas, 'r', encoding='utf-8') as f:
        lista_temas_oficiais = json.load(f).get("temas", [])
        print(f"📚 Lista oficial fixa carregada com {len(lista_temas_oficiais)} temas.")
    
    banco_questoes = {}
    assinaturas_existentes = set()
    
    if os.path.exists(caminho_json_central):
        with open(caminho_json_central, 'r', encoding='utf-8') as f:
            banco_questoes = json.load(f)
            for tema, questoes in banco_questoes.items():
                for q in questoes:
                    assinaturas_existentes.add(normalizar_texto(q.get("enunciado", "")))
        print(f"📂 Banco carregado: {len(assinaturas_existentes)} questões existentes.")

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, model_kwargs={"response_format": {"type": "json_object"}})
    
    # 🧠 IA Mapeadora (Agora lida com múltiplos blocos por PDF)
    prompt_mapeador = ChatPromptTemplate.from_template("""
        Você é um classificador de apostilas de estudos. 
        Lista de temas oficiais permitidos: {lista_temas}
        
        TEXTO DO SUMÁRIO (ÍNDICE) DO PDF:
        {texto_sumario}
        
        Sua tarefa:
        Identifique TODOS os blocos de "Questões Comentadas" (ou "Exercícios Comentados") presentes neste sumário.
        Para CADA bloco encontrado, determine:
        1. A página numérica onde o bloco começa.
        2. A página numérica onde o bloco termina (geralmente onde começa o próximo assunto ou a lista seca de gabarito).
        3. O tema da lista oficial que melhor o represente (escolha EXATAMENTE UM nome da lista por bloco).
        
        Retorne OBRIGATORIAMENTE em JSON contendo uma lista de blocos:
        {{"blocos": [
            {{"pagina_inicio": 41, "pagina_fim": 58, "tema_oficial": "Nome Exato da Lista"}},
            {{"pagina_inicio": 62, "pagina_fim": 81, "tema_oficial": "Outro Nome Exato da Lista"}}
        ]}}
    """)
    chain_mapeador = prompt_mapeador | llm | StrOutputParser()

    # 🤖 IA Extratora
    prompt_extrator = ChatPromptTemplate.from_template("""
        Extraia as questões comentadas (enunciado, gabarito e comentário) deste trecho.
        Ignore o que for apenas teoria ou lista seca. Se não houver, retorne lista vazia.
        Formato OBRIGATÓRIO em JSON: {{"questoes": [{{"tipo": "Banca / Ano", "enunciado": "...", "alternativas": {{}}, "gabarito": "...", "comentario": "..."}}]}}
        TEXTO: {texto}
    """)
    chain_extrator = prompt_extrator | llm | StrOutputParser()

    arquivos_pdf = glob.glob(os.path.join(pasta_pdfs, "*.pdf"))
    
    for caminho_pdf in arquivos_pdf:
        nome_arquivo = os.path.basename(caminho_pdf)
        print(f"\n🚀 Analisando PDF: {nome_arquivo}")
        
        blocos_processamento = [] # Guarda os textos separados por tema
        
        try:
            # FASE 1: MAPEAMENTO E EXTRAÇÃO PARA A RAM
            with pdfplumber.open(caminho_pdf) as pdf:
                total_paginas = len(pdf.pages)
                print("   🔎 Enviando sumário para a IA Mapeadora (Buscando múltiplos temas)...")
                
                texto_sumario = pdf.pages[1].extract_text() or ""
                if total_paginas > 2:
                    texto_sumario += "\n" + (pdf.pages[2].extract_text() or "")
                
                if texto_sumario.strip():
                    res_map = chain_mapeador.invoke({
                        "lista_temas": json.dumps(lista_temas_oficiais, ensure_ascii=False),
                        "texto_sumario": texto_sumario
                    })
                    
                    dados_map = json.loads(limpar_json_ia(res_map))
                    blocos = dados_map.get("blocos", [])
                    
                    if not blocos:
                        print("      ⚠️ Nenhum bloco estruturado encontrado. Usando fallback.")
                        blocos = [{"pagina_inicio": max(1, total_paginas - 60), "pagina_fim": total_paginas, "tema_oficial": "Não Classificado"}]
                    
                    for bloco in blocos:
                        p_in = bloco.get("pagina_inicio")
                        p_fi = bloco.get("pagina_fim")
                        tema_oficial = bloco.get("tema_oficial", "Não Classificado")
                        
                        if tema_oficial not in lista_temas_oficiais:
                            tema_oficial = "Não Classificado"
                            
                        pg_inicio = int(p_in) - 1 if p_in else 0
                        pg_fim = int(p_fi) - 1 if p_fi else total_paginas
                        
                        # Trava de segurança para não ultrapassar os limites do PDF
                        pg_inicio = max(0, min(pg_inicio, total_paginas - 1))
                        pg_fim = max(0, min(pg_fim, total_paginas))
                        
                        if pg_fim <= pg_inicio: pg_fim = total_paginas
                        
                        print(f"      🎯 Bloco Detectado -> Gaveta: '{tema_oficial}' (Págs {pg_inicio+1} a {pg_fim})")
                        
                        if tema_oficial not in banco_questoes: 
                            banco_questoes[tema_oficial] = []

                        # Extrai o texto alvo do bloco para a memória RAM
                        paginas_alvo = pdf.pages[pg_inicio:pg_fim]
                        textos_paginas = [p.extract_text() for p in paginas_alvo if p.extract_text()]
                        
                        blocos_processamento.append({
                            "tema": tema_oficial,
                            "textos": textos_paginas
                        })
            # Fecha o PDF (Memória liberada)
            
            # FASE 2: PROCESSAMENTO PARALELO POR BLOCO
            for bloco_info in blocos_processamento:
                tema_atual = bloco_info["tema"]
                textos = bloco_info["textos"]
                
                if not textos: continue
                
                tamanho_lote = 4
                lotes = [textos[i:i+tamanho_lote] for i in range(0, len(textos), tamanho_lote)]
                
                print(f"   ⚡ Extraindo [{tema_atual}]: {len(lotes)} lotes com multithread...")
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                    futuros = {executor.submit(extrair_lote_seguro, lote, chain_extrator): idx for idx, lote in enumerate(lotes)}
                    
                    for futuro in concurrent.futures.as_completed(futuros):
                        idx_lote = futuros[futuro]
                        try:
                            dados_extraidos = futuro.result()
                            
                            with lock_salvamento:
                                adicionadas = 0
                                for q in dados_extraidos:
                                    assinatura = normalizar_texto(q.get("enunciado", ""))
                                    if assinatura and assinatura not in assinaturas_existentes:
                                        banco_questoes[tema_atual].append(q)
                                        assinaturas_existentes.add(assinatura)
                                        adicionadas += 1
                                
                                if adicionadas > 0:
                                    with open(caminho_json_central, 'w', encoding='utf-8') as f:
                                        json.dump(banco_questoes, f, ensure_ascii=False, indent=2)
                                    print(f"      ✅ +{adicionadas} salvas em '{tema_atual}' (Lote {idx_lote+1})")
                                    
                        except Exception as e:
                            print(f"      ❌ Erro no lote {idx_lote+1} de '{tema_atual}': {e}")

        except Exception as e:
            print(f"❌ Erro crítico no PDF {nome_arquivo}: {e}")

    print(f"\n🎉 CONCLUÍDO! Banco centralizado atualizado. Total de questões únicas: {len(assinaturas_existentes)}")

if __name__ == "__main__":
    processar_pasta_pdfs()