# backend/api.py
import os
import uuid
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from openai import OpenAI
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

import firebase_admin
from firebase_admin import credentials, firestore

import auditor_v3

load_dotenv()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)

try:
    if not firebase_admin._apps:
        cred = credentials.Certificate('firebase_key.json')
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    FIREBASE_ON = True
except Exception as e:
    print(f"⚠️ Atenção: Firebase não inicializado. Erro: {e}")
    FIREBASE_ON = False

PASTA_TEMP = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(PASTA_TEMP, exist_ok=True)

@app.route('/api/gerar-guia', methods=['POST'])
def gerar_guia_instantaneo():
    try:
        dados = request.get_json()
        materia = dados.get('materia')
        tema = dados.get('tema')
        subtema = dados.get('subtema', None)

        if not materia or not tema: return jsonify({"erro": "Matéria e tema obrigatórios"}), 400

        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
        prompt = """
        Você é um Arquiteto de Planos de Estudo.
        Crie o "Guia da Aula" definitivo para o aluno estudar: {materia} > {tema} {subtema_str}.
        
        REGRAS:
        1. Máximo de 10 palavras por tópico.
        2. NÃO use Markdown (* ou **).
        3. Liste de 7 a 12 TÓPICOS VITAIS.
        
        Retorne APENAS JSON: {{"topicos": ["Tópico 1", "Tópico 2"]}}
        """
        str_subtema = f" > {subtema}" if subtema else ""

        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser

        chain = ChatPromptTemplate.from_template(prompt) | llm | JsonOutputParser()
        resultado = chain.invoke({"materia": materia, "tema": tema, "subtema_str": str_subtema})
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# --- LÓGICA DE DADOS ESTÁTICOS HÍBRIDOS ---
def carregar_dados_estaticos(jornada, materia, tema):
    caminho = os.path.join(os.path.dirname(__file__), "questoes", jornada.capitalize(), materia, tema, "analise_estatica.json")
    if os.path.exists(caminho):
        try:
            with open(caminho, 'r', encoding='utf-8') as f:
                dados = json.load(f)
                
                # Monta a string limpa de Incidência (Custo Zero de IA)
                incidencias = []
                for item in dados.get("assuntos_maior_incidencia", []):
                    incidencias.append(f"{item['posicao']}º {item['assunto']} ({item['incidencia_aproximada']}%): {', '.join(item['subtemas'])}")
                texto_incidencia = "\n".join(incidencias)

                # Monta a string limpa de Pegadinhas
                pegadinhas = []
                for item in dados.get("pegadinhas_frequentes", []):
                    pegadinhas.append(f"- {item['pegadinha']}: {item['detalhe']}")
                texto_pegadinhas = "\n".join(pegadinhas)
                
                return texto_incidencia, texto_pegadinhas
        except Exception as e:
            print(f"Erro ao carregar analise_estatica: {e}")
    return "Sem dados de incidência cadastrados para este tema.", "Sem pegadinhas cadastradas para este tema."

def processar_e_salvar_auditoria(jornada, materia, tema, subtema, texto_aula, notas_manuais):
    
    # 1. Lê os arquivos fixos locais
    texto_incidencia, texto_pegadinhas = carregar_dados_estaticos(jornada, materia, tema)

    # 2. Manda para a IA APENAS as pegadinhas para ela avaliar se o aluno caiu nelas
    json_resultado = auditor_v3.run_dynamic_audit(
        jornada=jornada,
        materia=materia,
        tema=tema,
        aula_text=texto_aula,
        subtema=subtema,
        dados_estaticos=texto_pegadinhas
    )

    if not json_resultado or "erro" in json_resultado:
        raise Exception(json_resultado.get("erro", "Falha no Auditor"))

    # 3. INTERCEPTAÇÃO: Monta o objeto perfeito para o Frontend sem gastar tokens da IA
    seu_resultado_ia = json_resultado.pop("seu_resultado", "Análise preditiva não gerada.")
    
    json_resultado['analise_banca'] = {
        "maior_incidencia": texto_incidencia,
        "pegadinhas": texto_pegadinhas,
        "seu_resultado": seu_resultado_ia
    }

    json_resultado['jornada'] = jornada
    json_resultado['materia'] = materia
    json_resultado['tema'] = tema
    json_resultado['subtema'] = subtema
    json_resultado['texto_transcrito'] = texto_aula
    json_resultado['anotacoes_manuais'] = notas_manuais

    relatorio_id = str(uuid.uuid4())
    if FIREBASE_ON:
        db.collection('relatorios').document(relatorio_id).set(json_resultado)
        print(f"✅ Relatório {relatorio_id} salvo com sucesso no Firestore.")

    return {"relatorio_id": relatorio_id, "relatorio": json_resultado}

@app.route('/api/processar-audio', methods=['POST'])
def processar_audio():
    try:
        jornada = request.form.get('jornada', 'concurso')
        materia = request.form.get('materia')
        tema = request.form.get('tema')
        subtema = request.form.get('subtema')
        notas_manuais = request.form.get('anotacoes_manuais', '')

        if 'audio' not in request.files: return jsonify({"erro": "Sem áudio"}), 400
        
        arquivo_audio = request.files['audio']
        caminho_audio = os.path.join(PASTA_TEMP, secure_filename(arquivo_audio.filename or "gravacao.webm"))
        arquivo_audio.save(caminho_audio)
        
        print("\n[WHISPER] Transcrevendo áudio...")
        with open(caminho_audio, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
        
        if os.path.exists(caminho_audio): os.remove(caminho_audio)

        resultado = processar_e_salvar_auditoria(jornada, materia, tema, subtema, transcription.text, notas_manuais)
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({"erro": str(e)}), 500

@app.route('/api/processar-texto', methods=['POST'])
def processar_texto():
    try:
        jornada = request.form.get('jornada', 'concurso')
        materia = request.form.get('materia')
        tema = request.form.get('tema')
        subtema = request.form.get('subtema')
        texto_aula = request.form.get('texto')
        notas_manuais = request.form.get('anotacoes_manuais', '')

        if not texto_aula: return jsonify({"erro": "Texto vazio"}), 400

        print(f"\n[TEXTO] Auditando submissão escrita...")
        resultado = processar_e_salvar_auditoria(jornada, materia, tema, subtema, texto_aula, notas_manuais)
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)