# backend/gerador_analise.py
import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

def gerar_analises_por_materia():
    print("=" * 60)
    print("ANALISTA ESTÁTICO TURBO (COM ESTATÍSTICA) - 95PORCENTO")
    print("=" * 60)
    
    jornada = input("🎯 Jornada (ex: Concurso): ").strip().capitalize()
    materia = input("📚 Matéria (ex: Portugues): ").strip()
    
    caminho_questoes = os.path.join(os.path.dirname(__file__), "questoes", jornada, materia, "questoes.json")
    caminho_saida = os.path.join(os.path.dirname(__file__), "questoes", jornada, materia, "analise_estatica.json")
    
    if not os.path.exists(caminho_questoes):
        print(f"❌ Banco de questões não encontrado em:\n{caminho_questoes}")
        return

    with open(caminho_questoes, 'r', encoding='utf-8') as f:
        banco_questoes = json.load(f)

    analises_existentes = {}
    if os.path.exists(caminho_saida):
        with open(caminho_saida, 'r', encoding='utf-8') as f:
            analises_existentes = json.load(f)

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1, model_kwargs={"response_format": {"type": "json_object"}})
    
    # PROMPT ATUALIZADO PARA EXIGIR PORCENTAGENS E EXPLICAÇÕES DETALHADAS
    template = """
    Você é um Auditor Estatístico de Concursos Públicos. 
    Sua missão é analisar matematicamente e pedagogicamente as questões do tema "{tema}".
    
    QUESTÕES EXTRAÍDAS DA BANCA:
    {texto_questoes}
    
    Sua tarefa é extrair 2 listas e retornar ESTRITAMENTE em formato JSON.
    
    1. "assuntos_maior_incidencia": 
       - Agrupe as questões por assunto.
       - Calcule a PORCENTAGEM aproximada de incidência de cada assunto com base no total de questões desta amostra.
       - Formato OBRIGATÓRIO de cada item da lista: "Nome do Assunto (XX%)". Ex: "Regra geral de Crase (45%)".
       
    2. "pegadinhas_frequentes": 
       - Identifique as armadilhas comuns que a banca usou nessas questões para confundir o candidato.
       - EXPLIQUE como a armadilha funciona na prática.
       - Formato OBRIGATÓRIO de cada item da lista: "Nome da Pegadinha: Explicação de como a banca induz ao erro."
    
    Retorne o JSON exato:
    {{
        "assuntos_maior_incidencia": [],
        "pegadinhas_frequentes": []
    }}
    """
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()

    print(f"\n⚙️ Iniciando análise dos Temas de {materia}...")
    
    for tema, lista_questoes in banco_questoes.items():
        # Se quiser forçar a reanálise de temas antigos, comente as 3 linhas abaixo:
        if tema in analises_existentes:
            print(f"⏭️ Tema '{tema}' já foi analisado anteriormente. Pulando.")
            continue
            
        print(f"▶️ Analisando: {tema} ({len(lista_questoes)} questões) - Calculando estatísticas...")
        
        texto_questoes = ""
        for i, q in enumerate(lista_questoes):
            texto_questoes += f"Q{i+1}: {q.get('enunciado')}\nGab: {q.get('gabarito')}\nComentário: {q.get('comentario')}\n\n"
            
        try:
            resultado_str = chain.invoke({"tema": tema, "texto_questoes": texto_questoes})
            resultado_json = json.loads(resultado_str)
            
            analises_existentes[tema] = resultado_json
            
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                json.dump(analises_existentes, f, ensure_ascii=False, indent=2)
                
            print(f"   ✅ Análise Estatística de '{tema}' salva com sucesso!")
        except Exception as e:
            print(f"   ❌ Erro ao analisar '{tema}': {e}")

    print(f"\n🎉 TODAS AS ANÁLISES CONCLUÍDAS! Salvo em:\n{caminho_saida}")

if __name__ == "__main__":
    gerar_analises_por_materia()