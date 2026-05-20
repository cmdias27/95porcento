# api.py
import os
import re
import json
import uuid
import random
import unicodedata
import traceback
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from datetime import datetime

import auditor_v3

load_dotenv()

app = Flask(__name__)

# CORS — origens permitidas
ORIGENS_PERMITIDAS = [
    "http://localhost:3000",
    "https://95porcento.com.br",
    "https://www.95porcento.com.br",
    "https://95porcento.vercel.app",
    "https://95porcento-dpoqh9neu-cassio-s-projects2.vercel.app",
    "https://95porcento.com.br",
    "https://www.95porcento.com.br"
]
CORS(app, resources={r"/api/*": {"origins": ORIGENS_PERMITIDAS}})

# 🔒 Rate limiting — protege rotas de IA contra abuso e custo excessivo
# Chave por UID (quando disponível) ou IP como fallback
def _chave_por_uid_ou_ip():
    """Usa o UID do token JWT como chave de limite; cai no IP se não autenticado."""
    uid = getattr(request, "uid_seguro", None)
    return uid if uid else get_remote_address()

limiter = Limiter(
    app=app,
    key_func=_chave_por_uid_ou_ip,
    default_limits=[],  # sem limite global — só por rota
    storage_uri="memory://",
)

# Limite máximo de payload para rotas que enviam texto longo à IA (50KB)
MAX_PAYLOAD_BYTES = 50 * 1024

# FIREBASE — carrega do arquivo local em dev ou da variável de ambiente em produção
def _init_firebase():
    if firebase_admin._apps:
        return firestore.client()
    firebase_key_json = os.getenv("FIREBASE_KEY_JSON")
    if firebase_key_json:
        import json as _json
        cred = credentials.Certificate(_json.loads(firebase_key_json))
    elif os.path.exists("firebase_key.json"):
        cred = credentials.Certificate("firebase_key.json")
    else:
        return None
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = _init_firebase()

# ---------------------------------------------------------------------------
# 🔒 Decorator de autenticação Firebase JWT
# ---------------------------------------------------------------------------

def validar_token_firebase(f):
    """Valida o Bearer Token do Firebase em todas as rotas protegidas."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Permite OPTIONS passar livremente (CORS preflight)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"erro": "Acesso não autorizado. Token ausente."}), 401

        token = auth_header.split(" ")[1]
        try:
            # Valida criptograficamente: token emitido pelo Firebase e não expirado
            decoded_token = firebase_auth.verify_id_token(token)
            # Injeta o UID e email seguros na request para as rotas usarem
            request.uid_seguro   = decoded_token["uid"]
            request.email_seguro = decoded_token.get("email", "")
        except Exception:
            return jsonify({"erro": "Token inválido ou expirado."}), 401

        return f(*args, **kwargs)
    return decorated_function

# ---------------------------------------------------------------------------
# Helper — logging de eventos para o painel admin
# ---------------------------------------------------------------------------

def registrar_evento(
    tipo: str,
    uid: str = "",
    jornada: str = "",
    materia: str = "",
    tema: str = "",
    modo: str = "",
    tokens_input: int = 0,
    tokens_output: int = 0,
):
    """Grava um evento assíncrono na coleção eventos_sistema."""
    if not db:
        return
    try:
        db.collection("eventos_sistema").add({
            "tipo":          tipo,       # sessao_explicacao | simulado_gerado
            "uid":           uid,
            "jornada":       jornada,
            "materia":       materia,
            "tema":          tema,
            "modo":          modo,
            "tokens_input":  tokens_input,
            "tokens_output": tokens_output,
            "timestamp":     datetime.now().isoformat(),
        })
    except Exception as e:
        print(f"⚠️  registrar_evento falhou (não crítico): {e}")


# ---------------------------------------------------------------------------
# Score cognitivo
# ---------------------------------------------------------------------------

def calcular_score_cognitivo(acertos: int, erros: int, omissoes: int) -> dict:
    """Retorna score 0-10 a partir de acertos/erros/omissões."""
    total = acertos + erros + omissoes
    if total == 0:
        return {"score_cognitivo": 0.0, "quantidade_acertos": 0,
                "quantidade_erros": 0, "quantidade_omissoes": 0}
    raw = acertos / total
    if total < 5:
        raw *= 0.8  # redutor para explicações muito pequenas
    score = round(raw * 10, 1)
    return {
        "score_cognitivo": score,
        "quantidade_acertos": acertos,
        "quantidade_erros": erros,
        "quantidade_omissoes": omissoes,
    }

# ---------------------------------------------------------------------------
# Helpers para matching de banco de questões
# ---------------------------------------------------------------------------

QUESTOES_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "questoes")

def caminho_eh_seguro(caminho_base: str, caminho_testado: str) -> bool:
    """Verifica se o caminho final não tentou escapar da pasta raiz."""
    caminho_base_abs   = os.path.abspath(caminho_base)
    caminho_testado_abs = os.path.abspath(caminho_testado)
    return caminho_testado_abs.startswith(caminho_base_abs)


def _pasta_materia(jornada: str, materia: str) -> str:
    """Resolve o caminho absoluto da pasta da matéria, bloqueando Path Traversal."""
    # 🔒 Sanitização: remove barras e sequências de escape maliciosas ANTES do title()
    materia_segura = materia.replace("/", "").replace("\\", "").replace("..", "").strip().title()

    j = jornada.lower()
    if j == "enem":
        base = os.path.join(QUESTOES_BASE, "ENEM")
        if os.path.isdir(base):
            for area in os.listdir(base):
                area_path = os.path.join(base, area)
                if os.path.isdir(area_path):
                    candidato = os.path.join(area_path, materia_segura)
                    if os.path.isdir(candidato) and caminho_eh_seguro(QUESTOES_BASE, candidato):
                        return candidato
        resultado = os.path.join(base, materia_segura)
    elif j == "oab":
        resultado = os.path.join(QUESTOES_BASE, "OAB", materia_segura)
    else:
        resultado = os.path.join(QUESTOES_BASE, "Concurso", materia_segura)

    # 🔒 Última linha de defesa: garante prisão no diretório base
    if not caminho_eh_seguro(QUESTOES_BASE, resultado):
        raise ValueError("Tentativa de Path Traversal bloqueada!")

    return resultado

def _e_questao_visual(questao: dict) -> bool:
    """Detecta questões que dependem de imagem ou recurso visual não disponível em texto."""
    texto_aux = questao.get("texto_auxiliar", "") or ""
    return bool(re.search(r"Disponível\s+em:\s*www\.", texto_aux, re.IGNORECASE))

def _carregar_pool_questoes(jornada: str, materia: str) -> list:
    """Carrega todas as questões de um banco (dict ou list) como lista plana, filtrando questões visuais."""
    pasta = _pasta_materia(jornada, materia)
    caminho = os.path.join(pasta, "questoes.json")
    if not os.path.exists(caminho):
        return []
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            banco = json.load(f)
        if isinstance(banco, dict):
            todas = []
            for v in banco.values():
                if isinstance(v, list):
                    todas.extend(v)
        elif isinstance(banco, list):
            todas = banco
        else:
            return []
        return [q for q in todas if not _e_questao_visual(q)]
    except Exception as e:
        print(f"⚠️ Questões não carregadas ({caminho}): {e}")
    return []

def _norm(texto: str) -> str:
    return unicodedata.normalize("NFD", str(texto)).encode("ascii", "ignore").decode().lower().strip()

BANCA_ALIASES: dict[str, list[str]] = {
    "cebraspe": ["cespe", "cebraspe", "unb"],
    "cespe":    ["cespe", "cebraspe", "unb"],
    "fgv":      ["getulio vargas", "fgv"],
    "fcc":      ["carlos chagas", "fcc"],
    "vunesp":   ["vunesp"],
    "cesgranrio": ["cesgranrio"],
    "quadrix":  ["quadrix"],
    "iades":    ["iades"],
    "aocp":     ["aocp"],
    "consulplan": ["consulplan"],
    "idecan":   ["idecan"],
    "ibfc":     ["ibfc"],
    "funrio":   ["funrio"],
    "esaf":     ["esaf"],
    "fepese":   ["fepese"],
}

def _banca_match(banca_questao: str, banca_aluno: str) -> bool:
    if not banca_aluno or _norm(banca_aluno) in ("livre", ""):
        return True
    b_aluno   = _norm(banca_aluno)
    b_questao = _norm(banca_questao)
    if b_aluno in b_questao or b_questao in b_aluno:
        return True
    for aliases in BANCA_ALIASES.get(b_aluno, [b_aluno]):
        if aliases in b_questao:
            return True
    return False

def _score_relevancia(questao: dict, topico: str) -> int:
    if not topico:
        return 0
    palavras = {p for p in _norm(topico).split() if len(p) > 3}
    texto = _norm(questao.get("enunciado", "") + " " + questao.get("comentario", ""))
    return sum(1 for p in palavras if p in texto)

def _sortear_questao(pool: list, banca_aluno: str, ids_usados: set, topico: str = "") -> dict | None:
    if not pool:
        return None
    # Determina o subconjunto preferido por banca (independente de ids_usados)
    por_banca = [q for q in pool if _banca_match(q.get("banca", ""), banca_aluno)]
    fonte = por_banca if por_banca else pool  # só usa outras bancas se 0 questões da banca existirem

    # Tenta questões ainda não usadas; se esgotadas, reutiliza dentro da mesma banca
    candidatos = [q for q in fonte if q.get("id") not in ids_usados]
    if not candidatos:
        candidatos = fonte  # reusa da banca certa antes de trocar de banca

    # Seleciona por relevância temática quando possível
    if topico:
        scored = sorted(candidatos, key=lambda q: _score_relevancia(q, topico), reverse=True)
        com_score = [q for q in scored[:5] if _score_relevancia(q, topico) > 0]
        escolhida = random.choice(com_score if com_score else candidatos)
    else:
        escolhida = random.choice(candidatos)

    ids_usados.add(escolhida.get("id"))
    q = {k: escolhida[k] for k in ("id", "banca", "ano", "texto_auxiliar", "enunciado", "alternativas", "gabarito", "comentario") if k in escolhida}
    if q.get("texto_auxiliar", "").strip().lower() in ("sem texto auxiliar", ""):
        q.pop("texto_auxiliar", None)
    return q

# ---------------------------------------------------------------------------
# Helpers para ID de perfil cognitivo
# ---------------------------------------------------------------------------

def _slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s)).encode("ascii", "ignore").decode()
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')[:80]

def _doc_id_perfil(user_id: str, jornada: str, materia: str, tema: str) -> str:
    return f"{user_id}_{_slugify(jornada)}_{_slugify(materia)}_{_slugify(tema)}"

# ---------------------------------------------------------------------------
# Perfil Cognitivo — erros e omissões acumulados por sessão
# ---------------------------------------------------------------------------

def extrair_metadados_cognitivos(
    user_id: str,
    modo: str,
    jornada: str,
    materia: str,
    tema: str,
    resultado_ia: dict,
    relatorio_completo: dict,
) -> None:
    """Salva erros e omissões do relatório em perfis_cognitivos/{uid_jornada_materia_tema}."""
    if not db or not user_id:
        print(f"[perfil] abortado — db={bool(db)} user_id={user_id!r}")
        return
    doc_id = _doc_id_perfil(user_id, jornada, materia, tema)
    print(f"[perfil] salvando — {doc_id}")
    try:
        erros_sessao: list = []
        omissoes_sessao: list = []
        dominados_sessao: set = set()  # tópicos corretamente explicados nesta sessão

        if modo in ("guiado", "simulado"):
            for av in relatorio_completo.get("avaliacoes", []):
                assunto = (av.get("assunto") or "").strip()
                if not assunto:
                    continue
                status = av.get("status", "")
                if status in ("Erro", "Parcial", "Superficial"):
                    descricao = (av.get("ponto_fraco") or av.get("feedback") or "")[:200].strip()
                    erros_sessao.append({"topico": assunto, "descricao": descricao})
                elif status == "Acerto":
                    dominados_sessao.add(_norm(assunto))
            for om in resultado_ia.get("omissoes", []):
                topico = (om.get("tema") or om.get("topico") or (str(om) if not isinstance(om, dict) else "")).strip()
                if topico:
                    omissoes_sessao.append({"topico": topico})

        elif modo == "livre":
            for item in resultado_ia.get("auditoria_roteiro", []):
                topico = (item.get("topico") or "").strip()
                if not topico:
                    continue
                status = item.get("status", "")
                if status in ("Incorreto", "Raso", "Parcial", "Superficial"):
                    descricao = (item.get("justificativa") or "")[:200].strip()
                    erros_sessao.append({"topico": topico, "descricao": descricao})
                elif status == "Omitido":
                    omissoes_sessao.append({"topico": topico})
                elif status == "Dominado":
                    dominados_sessao.add(_norm(topico))
            for om in resultado_ia.get("omissoes_inteligentes", []):
                topico = (om.get("tema") or om.get("topico") or "").strip()
                if topico:
                    omissoes_sessao.append({"topico": topico})

        # Carregar pesos da analise_estatica para enriquecer o perfil
        pesos_map: dict = {}
        try:
            caminho_ae = os.path.join(_pasta_materia(jornada, materia), "analise_estatica.json")
            if os.path.exists(caminho_ae):
                with open(caminho_ae, 'r', encoding='utf-8') as f:
                    banco_ae = json.load(f)
                dados_tema_ae = banco_ae.get(tema, {})
                if not dados_tema_ae:
                    banco_ae_norm = {_norm(k): v for k, v in banco_ae.items()}
                    dados_tema_ae = banco_ae_norm.get(_norm(tema), {})
                for m in dados_tema_ae.get("microtemas_mapeados", []):
                    nome = m.get("nome_microtema", "")
                    if nome:
                        pesos_map[_norm(nome)] = m.get("peso_percentual", 0)
        except Exception:
            pass  # pesos são opcionais

        # Ler perfil existente
        doc_ref = db.collection("perfis_cognitivos").document(doc_id)
        snap = doc_ref.get()
        perfil = snap.to_dict() if snap.exists else {}
        agora = datetime.now().isoformat()

        total_sessoes_novo = perfil.get("total_sessoes", 0) + 1

        # Coletar versão legível dos tópicos dominados nesta sessão
        dominados_readable: dict[str, str] = {}  # norm -> legível
        if modo in ("guiado", "simulado"):
            for av in relatorio_completo.get("avaliacoes", []):
                if av.get("status") == "Acerto":
                    topico = (av.get("assunto") or "").strip()
                    if topico:
                        dominados_readable[_norm(topico)] = topico
        elif modo == "livre":
            for item in resultado_ia.get("auditoria_roteiro", []):
                if item.get("status") == "Dominado":
                    topico = (item.get("topico") or "").strip()
                    if topico:
                        dominados_readable[_norm(topico)] = topico

        # Mesclar erros — remove tópicos dominados nesta sessão
        erros_map: dict = {}
        for e in perfil.get("erros", []):
            key = _norm(e.get("topico", ""))
            if key and key not in dominados_sessao:
                erros_map[key] = {
                    "topico": e["topico"],
                    "descricao": e.get("descricao", ""),
                    "count": e.get("count", 1),
                    "ultima_sessao": e.get("ultima_sessao", total_sessoes_novo),
                }
        for e in erros_sessao:
            key = _norm(e.get("topico", ""))
            if not key or key in dominados_sessao:
                continue
            if key in erros_map:
                erros_map[key]["count"] += 1
                erros_map[key]["ultima_sessao"] = total_sessoes_novo
                if e.get("descricao"):
                    erros_map[key]["descricao"] = e["descricao"]
            else:
                erros_map[key] = {
                    "topico": e["topico"],
                    "descricao": e.get("descricao", ""),
                    "count": 1,
                    "ultima_sessao": total_sessoes_novo,
                }
        if pesos_map:
            for key, e in erros_map.items():
                e["peso_percentual"] = pesos_map.get(key, 0)
        erros = sorted(erros_map.values(), key=lambda x: x["count"], reverse=True)[:15]

        # Mesclar omissões — remove tópicos dominados nesta sessão
        omissoes_map: dict = {}
        for o in perfil.get("omissoes", []):
            key = _norm(o.get("topico", ""))
            if key and key not in dominados_sessao:
                omissoes_map[key] = {
                    "topico": o["topico"],
                    "count": o.get("count", 1),
                    "ultima_sessao": o.get("ultima_sessao", total_sessoes_novo),
                }
        for o in omissoes_sessao:
            key = _norm(o.get("topico", ""))
            if not key or key in dominados_sessao:
                continue
            if key in omissoes_map:
                omissoes_map[key]["count"] += 1
                omissoes_map[key]["ultima_sessao"] = total_sessoes_novo
            else:
                omissoes_map[key] = {
                    "topico": o["topico"],
                    "count": 1,
                    "ultima_sessao": total_sessoes_novo,
                }
        if pesos_map:
            for key, o in omissoes_map.items():
                o["peso_percentual"] = pesos_map.get(key, 0)
        omissoes = sorted(omissoes_map.values(), key=lambda x: x["count"], reverse=True)[:10]

        # Mesclar dominados — acumula tópicos já dominados pelo aluno
        dominados_map: dict[str, dict] = {}
        for d in perfil.get("dominados", []):
            if isinstance(d, dict):
                key = _norm(d.get("topico", ""))
                if key:
                    dominados_map[key] = {"topico": d["topico"], "count": d.get("count", 1)}
            elif isinstance(d, str):
                key = _norm(d)
                if key:
                    dominados_map[key] = {"topico": d, "count": 1}
        for key, topico_leg in dominados_readable.items():
            if key in dominados_map:
                dominados_map[key]["count"] = dominados_map[key].get("count", 1) + 1
            else:
                dominados_map[key] = {"topico": topico_leg, "count": 1}
        dominados = list(dominados_map.values())[-30:]

        # Peso total dos tópicos problemáticos (sem dupla contagem)
        peso_total = 0
        if pesos_map:
            vistos: set = set()
            for item in list(erros_map.keys()) + list(omissoes_map.keys()):
                if item not in vistos:
                    vistos.add(item)
                    peso_total += pesos_map.get(item, 0)
            peso_total = min(int(peso_total), 100)

        doc_ref.set({
            "user_id":                user_id,
            "jornada":                jornada,
            "materia":                materia,
            "tema":                   tema,
            "ultima_atualizacao":     agora,
            "total_sessoes":          total_sessoes_novo,
            "erros":                  erros,
            "omissoes":               omissoes,
            "dominados":              dominados,
            "peso_total_prioritario": peso_total,
        })

        print(f"✅ Perfil salvo — {doc_id} | erros={len(erros)} omissoes={len(omissoes)} dominados={len(dominados_sessao)} peso={peso_total}%")

    except Exception as e:
        print(f"⚠️ Perfil não salvo: {e}")
        traceback.print_exc()

# ---------------------------------------------------------------------------
# Rota principal
# ---------------------------------------------------------------------------

@app.route('/api/gerar-perguntas-guiado', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("20 per minute")
def gerar_perguntas_guiado_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        dados = request.json
        ctx = dados.get("contexto_personalizado") or None
        resultado = auditor_v3.gerar_perguntas_guiado(
            jornada=dados.get("jornada", "concurso"),
            materia=dados.get("materia", ""),
            tema=dados.get("tema", ""),
            faixa_salarial=dados.get("faixa_salarial", ""),
            contexto_personalizado=ctx,
        )
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Perguntas Guiado: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/avaliar-sessao-guiada', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("15 per minute")
def avaliar_sessao_guiada_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        dados = request.json
        jornada       = dados.get("jornada", "concurso").lower()
        materia       = dados.get("materia", "").strip().title()
        tema          = dados.get("tema", "").strip().title()
        banca         = dados.get("banca", "Livre").strip().title()
        faixa_salarial = dados.get("faixa_salarial", "").strip()
        user_id       = request.uid_seguro  # 🔒 UID validado pelo Firebase JWT
        perguntas_respostas = dados.get("perguntas_respostas", [])

        if not materia or not tema or not perguntas_respostas:
            return jsonify({"erro": "Dados insuficientes no payload."}), 400

        # 🔒 Limita tamanho total das respostas para evitar uso excessivo de tokens
        respostas_texto = json.dumps(perguntas_respostas)
        if len(respostas_texto.encode()) > MAX_PAYLOAD_BYTES:
            return jsonify({"erro": "Payload de respostas excede o limite permitido."}), 413

        pool_questoes = _carregar_pool_questoes(jornada, materia)

        resultado_ia = auditor_v3.avaliar_sessao_guiada(
            jornada=jornada,
            materia=materia,
            tema=tema,
            banca=banca,
            faixa_salarial=faixa_salarial,
            perguntas_respostas=perguntas_respostas,
        )

        if "erro" in resultado_ia:
            return jsonify({"erro": resultado_ia["erro"]}), 500

        # Mergear pergunta + resposta_aluno + fase de volta nas avaliações da IA
        pr_map = {pr.get("id"): pr for pr in perguntas_respostas}
        ids_usados: set = set()
        avaliacoes = resultado_ia.get("avaliacoes", [])
        for av in avaliacoes:
            pr = pr_map.get(av.get("id"), {})
            av["pergunta"]       = pr.get("pergunta", "")
            av["resposta_aluno"] = pr.get("resposta_aluno", "")
            av["pulada"]         = pr.get("pulada", False)
            av["fase"]           = pr.get("fase", av.get("fase", 1))
            av["assunto_idx"]    = pr.get("assunto_idx", 0)
            av["questao_vinculada"] = _sortear_questao(
                pool_questoes, banca, ids_usados, topico=av.get("assunto", "")
            )

        # Reescrever comentários das questões vinculadas
        questoes_vinculadas = [av["questao_vinculada"] for av in avaliacoes if av.get("questao_vinculada")]
        if questoes_vinculadas:
            comentarios_ia = auditor_v3.gerar_comentarios_questoes(questoes_vinculadas, materia)
            for av in avaliacoes:
                q = av.get("questao_vinculada")
                if q and q.get("id") in comentarios_ia:
                    q["comentario"] = comentarios_ia[q["id"]]

        # Gerar questões autorais no estilo da banca
        itens_autorais = [
            {"id": av.get("id"), "topico": av.get("assunto", ""), "contexto": av.get("feedback", "")}
            for av in avaliacoes
        ]
        questoes_autorais = auditor_v3.gerar_questoes_autorais(itens_autorais, banca, materia)
        for av in avaliacoes:
            q = questoes_autorais.get(av.get("id"))
            if q:
                q["id"] = f"autoral_{av.get('id')}"
            av["questao_autoral"] = q

        # Score cognitivo — guiado
        n_acertos  = sum(1 for av in avaliacoes if av.get("status") == "Acerto")
        n_erros    = sum(1 for av in avaliacoes if av.get("status") in ("Erro", "Parcial", "Superficial"))
        n_omissoes = len(resultado_ia.get("omissoes", []))
        score_data_g = calcular_score_cognitivo(n_acertos, n_erros, n_omissoes)

        relatorio_id = str(uuid.uuid4())
        relatorio_completo = {
            "relatorio_id": relatorio_id,
            "user_id": user_id,
            "jornada": jornada,
            "modo": "guiado",
            "data": datetime.now().isoformat(),
            "materia": materia,
            "tema": tema,
            "banca_escolhida": banca,
            "faixa_salarial_alvo": faixa_salarial,
            "resumo_geral": resultado_ia.get("resumo_geral", {}),
            "avaliacoes": avaliacoes,
            "omissoes": resultado_ia.get("omissoes", []),
            **score_data_g,
        }

        if db:
            db.collection("relatorios_guiados").document(relatorio_id).set(relatorio_completo)

        registrar_evento(
            tipo="sessao_explicacao",
            uid=user_id,
            jornada=jornada,
            materia=materia,
            tema=tema,
            modo="guiado",
            tokens_input=sum(len(pr.get("resposta_aluno", "")) for pr in perguntas_respostas) // 4,
            tokens_output=len(json.dumps(resultado_ia, ensure_ascii=False)) // 4,
        )

        extrair_metadados_cognitivos(
            user_id=user_id,
            modo="guiado",
            jornada=jornada,
            materia=materia,
            tema=tema,
            resultado_ia=resultado_ia,
            relatorio_completo=relatorio_completo,
        )

        return jsonify(relatorio_completo), 200

    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Sessão Guiada: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/gerar-cenario-simulado', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("20 per minute")
def gerar_cenario_simulado_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        dados = request.json
        ctx = dados.get("contexto_personalizado") or None
        resultado = auditor_v3.gerar_cenario_simulado(
            jornada=dados.get("jornada", "concurso"),
            materia=dados.get("materia", ""),
            tema=dados.get("tema", ""),
            faixa_salarial=dados.get("faixa_salarial", ""),
            contexto_personalizado=ctx,
        )
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Cenário Simulado: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/avaliar-sessao-simulada', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("15 per minute")
def avaliar_sessao_simulada_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        dados = request.json
        jornada        = dados.get("jornada", "concurso").lower()
        materia        = dados.get("materia", "").strip().title()
        tema           = dados.get("tema", "").strip().title()
        banca          = dados.get("banca", "Livre").strip().title()
        faixa_salarial = dados.get("faixa_salarial", "").strip()
        user_id        = request.uid_seguro  # 🔒 UID validado pelo Firebase JWT
        cenario        = dados.get("cenario", {})
        perguntas_respostas = dados.get("perguntas_respostas", [])

        if not materia or not tema or not perguntas_respostas:
            return jsonify({"erro": "Dados insuficientes no payload."}), 400

        # 🔒 Limita tamanho total das respostas
        respostas_texto = json.dumps(perguntas_respostas)
        if len(respostas_texto.encode()) > MAX_PAYLOAD_BYTES:
            return jsonify({"erro": "Payload de respostas excede o limite permitido."}), 413

        pool_questoes = _carregar_pool_questoes(jornada, materia)

        resultado_ia = auditor_v3.avaliar_sessao_simulada(
            jornada=jornada,
            materia=materia,
            tema=tema,
            banca=banca,
            faixa_salarial=faixa_salarial,
            cenario=cenario,
            perguntas_respostas=perguntas_respostas,
        )

        if "erro" in resultado_ia:
            return jsonify({"erro": resultado_ia["erro"]}), 500

        # Mergear pergunta + resposta_aluno + fase de volta nas avaliações
        pr_map = {pr.get("id"): pr for pr in perguntas_respostas}
        ids_usados: set = set()
        avaliacoes = resultado_ia.get("avaliacoes", [])
        for av in avaliacoes:
            pr = pr_map.get(av.get("id"), {})
            av["pergunta"]       = pr.get("pergunta", "")
            av["resposta_aluno"] = pr.get("resposta_aluno", "")
            av["pulada"]         = pr.get("pulada", False)
            av["fase"]           = pr.get("fase", av.get("fase", 1))
            av["questao_vinculada"] = _sortear_questao(
                pool_questoes, banca, ids_usados, topico=av.get("objetivo", "")
            )

        # Reescrever comentários das questões vinculadas
        questoes_vinculadas = [av["questao_vinculada"] for av in avaliacoes if av.get("questao_vinculada")]
        if questoes_vinculadas:
            comentarios_ia = auditor_v3.gerar_comentarios_questoes(questoes_vinculadas, materia)
            for av in avaliacoes:
                q = av.get("questao_vinculada")
                if q and q.get("id") in comentarios_ia:
                    q["comentario"] = comentarios_ia[q["id"]]

        # Gerar questões autorais no estilo da banca
        itens_autorais = [
            {"id": av.get("id"), "topico": av.get("objetivo", ""), "contexto": av.get("feedback", "")}
            for av in avaliacoes
        ]
        questoes_autorais = auditor_v3.gerar_questoes_autorais(itens_autorais, banca, materia)
        for av in avaliacoes:
            q = questoes_autorais.get(av.get("id"))
            if q:
                q["id"] = f"autoral_{av.get('id')}"
            av["questao_autoral"] = q

        # Score cognitivo — simulado
        n_ac_s  = sum(1 for av in avaliacoes if av.get("status") == "Acerto")
        n_er_s  = sum(1 for av in avaliacoes if av.get("status") in ("Erro", "Parcial", "Superficial"))
        n_om_s  = len(resultado_ia.get("omissoes", []))
        score_data_s = calcular_score_cognitivo(n_ac_s, n_er_s, n_om_s)

        relatorio_id = str(uuid.uuid4())
        relatorio_completo = {
            "relatorio_id": relatorio_id,
            "user_id": user_id,
            "jornada": jornada,
            "modo": "simulado",
            "data": datetime.now().isoformat(),
            "materia": materia,
            "tema": tema,
            "banca_escolhida": banca,
            "faixa_salarial_alvo": faixa_salarial,
            "cenario": cenario,
            "resumo_geral": resultado_ia.get("resumo_geral", {}),
            "diagnostico_cognitivo": resultado_ia.get("diagnostico_cognitivo", {}),
            "avaliacoes": avaliacoes,
            "omissoes": resultado_ia.get("omissoes", []),
            **score_data_s,
        }

        if db:
            db.collection("relatorios_simulados").document(relatorio_id).set(relatorio_completo)

        registrar_evento(
            tipo="sessao_explicacao",
            uid=user_id,
            jornada=jornada,
            materia=materia,
            tema=tema,
            modo="simulado",
            tokens_input=sum(len(pr.get("resposta_aluno", "")) for pr in perguntas_respostas) // 4,
            tokens_output=len(json.dumps(resultado_ia, ensure_ascii=False)) // 4,
        )

        extrair_metadados_cognitivos(
            user_id=user_id,
            modo="simulado",
            jornada=jornada,
            materia=materia,
            tema=tema,
            resultado_ia=resultado_ia,
            relatorio_completo=relatorio_completo,
        )

        return jsonify(relatorio_completo), 200

    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Sessão Simulada: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/gerar-simulado', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("5 per minute")
def gerar_simulado_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        from core.simulador import gerar_questoes_ineditas
        dados = request.json
        jornada_s  = dados.get("jornada", "concurso")
        materia_s  = dados.get("materia", "")
        tema_s     = dados.get("tema", "")
        uid_s      = request.uid_seguro  # 🔒 UID validado pelo Firebase JWT
        resultado = gerar_questoes_ineditas(
            jornada=jornada_s,
            materia=materia_s,
            tema=tema_s,
            faixa_salarial=dados.get("faixa_salarial", "Intermediario"),
            banca=dados.get("banca", "Livre"),
            tipo_questao=dados.get("tipo", "Múltipla Escolha"),
            quantidade=int(dados.get("quantidade", 5)),
        )
        registrar_evento(
            tipo="simulado_gerado",
            uid=uid_s,
            jornada=jornada_s,
            materia=materia_s,
            tema=tema_s,
            modo="simulador",
            tokens_output=len(json.dumps(resultado, ensure_ascii=False)) // 4,
        )
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Gerar Simulado: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/gerar-checklist', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("20 per minute")
def gerar_checklist_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        dados = request.json
        ctx = dados.get("contexto_personalizado") or None
        resultado = auditor_v3.gerar_checklist(
            jornada=dados.get("jornada", "concurso"),
            materia=dados.get("materia", ""),
            tema=dados.get("tema", ""),
            faixa_salarial=dados.get("faixa_salarial", ""),
            contexto_personalizado=ctx,
        )
        return jsonify(resultado), 200
    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO Checklist: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500


@app.route('/api/processar-texto', methods=['POST', 'OPTIONS'])
@validar_token_firebase
@limiter.limit("10 per minute")
def processar_e_salvar_auditoria():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        dados = request.json

        jornada    = dados.get("jornada", "concurso").lower()
        materia    = dados.get("materia", "").strip().title()
        tema       = dados.get("tema", "").strip().title()
        banca      = dados.get("banca", "Livre").strip().title()
        faixa_salarial = dados.get("faixa_salarial", "").strip()
        user_id    = request.uid_seguro  # 🔒 UID validado pelo Firebase JWT
        aula_texto = dados.get("texto_aula", "")
        anotacoes  = dados.get("anotacoes_manuais", "")

        if not materia or not tema or not aula_texto:
            return jsonify({"erro": "Dados insuficientes no payload."}), 400

        # 🔒 Limita tamanho da aula enviada pelo aluno (Ex: evita colar um livro inteiro)
        if len(aula_texto.encode()) > MAX_PAYLOAD_BYTES:
            return jsonify({"erro": "O texto da explicação excede o limite máximo permitido (50KB)."}), 413

        caminho_analise = os.path.join(_pasta_materia(jornada, materia), "analise_estatica.json")

        if not os.path.exists(caminho_analise):
            return jsonify({"erro": f"Dossiê não encontrado para {materia}"}), 404

        with open(caminho_analise, 'r', encoding='utf-8') as f:
            banco_analise = json.load(f)

        # Tentativa 1: chave exata
        dados_tema = banco_analise.get(tema, {})

        # Tentativa 2: match normalizado (sem acento, minúsculo)
        if not dados_tema:
            banco_norm = {_norm(k): v for k, v in banco_analise.items()}
            dados_tema = banco_norm.get(_norm(tema), {})

        # Tentativa 3: prefixo — o tema do UI pode ter "(artigos...)" ou "- Título..." extras
        if not dados_tema:
            tema_norm = _norm(tema)
            for chave_norm, val in banco_norm.items():
                if tema_norm.startswith(chave_norm) or chave_norm.startswith(tema_norm):
                    dados_tema = val
                    break

        if not dados_tema:
            return jsonify({"erro": f"Tema '{tema}' não mapeado."}), 404

        fingerprint_banca = dados_tema.get("fingerprint_banca", {})

        microtemas = dados_tema.get("microtemas_mapeados", [])
        roteiro  = [m.get("nome_microtema", "") for m in microtemas]
        anatomia = [f"{m.get('nome_microtema')}: {m.get('armadilha_favorita', '')}" for m in microtemas]
        pesos    = [{"assunto": m.get("nome_microtema", ""), "peso": str(m.get("peso_percentual", 0))} for m in microtemas]

        roteiro_str  = "\n".join(f"- {r}" for r in roteiro)
        anatomia_str = "\n".join(f"- {a}" for a in anatomia)
        pesos_str    = "\n".join(f"- {p['assunto']}: {p['peso']}%" for p in pesos)

        dados_auditoria = (
            f"[ROTEIRO TÉCNICO IDEAL]\n{roteiro_str}\n\n"
            f"[ANATOMIA E PEGADINHAS DA BANCA]\n{anatomia_str}\n\n"
            f"[PESOS DE INCIDÊNCIA NA PROVA]\n{pesos_str}"
        )

        pool_questoes = _carregar_pool_questoes(jornada, materia)

        print(f"🚀 Iniciando auditoria forense para: {tema}...")

        ctx = dados.get("contexto_personalizado") or None

        resultado_ia = auditor_v3.run_dynamic_audit(
            jornada=jornada,
            materia=materia,
            tema=tema,
            aula_text=aula_texto,
            banca=banca,
            dados_auditoria=dados_auditoria,
            contexto_personalizado=ctx,
        )

        print(f"🔍 Resultado IA bruto: {json.dumps(resultado_ia, ensure_ascii=False)}")

        if "erro" in resultado_ia:
            return jsonify({"erro": resultado_ia["erro"]}), 500

        # --- Processar auditoria_roteiro ---
        auditoria_roteiro = resultado_ia.get("auditoria_roteiro", [])
        itens_dominados  = [i for i in auditoria_roteiro if i.get("status") == "Dominado"]
        itens_rasos      = [i for i in auditoria_roteiro if i.get("status") in ("Raso", "Parcial", "Superficial")]
        itens_incorretos = [i for i in auditoria_roteiro if i.get("status") == "Incorreto"]
        itens_omitidos   = [i for i in auditoria_roteiro if i.get("status") == "Omitido"]

        itens_vistos = len(itens_dominados) + len(itens_rasos)
        itens_totais = len(auditoria_roteiro)

        acertos_gerais = resultado_ia.get("acertos_gerais", [])
        checklist_acertos = (
            [f"{i['topico']}: {i.get('justificativa', '')}" for i in itens_dominados] +
            [f"{i['topico']}: {i.get('justificativa', '')}" for i in acertos_gerais if i.get('topico')]
        )

        omissoes_roteiro = [{"tema": i["topico"], "resumo": i.get("justificativa", "Não abordado.")} for i in itens_omitidos]
        omissoes_ia      = resultado_ia.get("omissoes_inteligentes", [])
        temas_nao_abordados = omissoes_roteiro + omissoes_ia

        erros_cometidos_base = resultado_ia.get("inconsistencias_criticas", [])

        plano_de_estudo = (
            [{"titulo": i["topico"], "foco": i.get("justificativa", "Revisar o conceito.")} for i in itens_incorretos] +
            [{"titulo": i["topico"], "foco": f"Aprofundar: {i.get('justificativa', 'Conteúdo abordado parcialmente.')}"} for i in itens_rasos] +
            [{"titulo": i["topico"], "foco": i.get("justificativa", "Não abordado.")} for i in itens_omitidos] +
            [{"titulo": i["tema"], "foco": i.get("resumo", "")} for i in omissoes_ia]
        )

        # --- Processar auditoria_pegadinhas ---
        auditoria_pegadinhas = resultado_ia.get("auditoria_pegadinhas", [])
        pegadinhas_caiu   = [p["pegadinha"] for p in auditoria_pegadinhas if p.get("caiu_na_pegadinha")]
        pegadinhas_evitou = [p["pegadinha"] for p in auditoria_pegadinhas if not p.get("caiu_na_pegadinha")]

        # --- Vincular questões reais a erros e omissões ---
        ids_usados: set = set()

        erros_cometidos = [
            {**erro, "questao_vinculada": _sortear_questao(
                pool_questoes, banca, ids_usados,
                topico=f"{erro.get('trecho_aluno', '')} {erro.get('correcao', '')}"
            )}
            for erro in erros_cometidos_base
        ]

        omissoes_com_questao = [
            {**omissao, "questao_vinculada": _sortear_questao(
                pool_questoes, banca, ids_usados,
                topico=f"{omissao.get('tema', '')} {omissao.get('resumo', '')}"
            )}
            for omissao in temas_nao_abordados
        ]

        # --- Reescrever / gerar comentários das questões vinculadas via IA ---
        questoes_vinculadas = [
            item["questao_vinculada"]
            for item in erros_cometidos + omissoes_com_questao
            if item.get("questao_vinculada")
        ]
        if questoes_vinculadas:
            comentarios_ia = auditor_v3.gerar_comentarios_questoes(questoes_vinculadas, materia)
            for item in erros_cometidos + omissoes_com_questao:
                q = item.get("questao_vinculada")
                if q and q.get("id") in comentarios_ia:
                    q["comentario"] = comentarios_ia[q["id"]]

        # --- Gerar questões autorais no estilo da banca ---
        itens_autorais = []
        for i, erro in enumerate(erros_cometidos):
            itens_autorais.append({
                "id": f"erro_{i}",
                "topico": str(erro.get("trecho_aluno", "") or erro.get("erro", ""))[:300],
                "contexto": str(erro.get("correcao", "") or erro.get("resumo", ""))[:300],
            })
        for i, om in enumerate(omissoes_com_questao):
            itens_autorais.append({
                "id": f"omissao_{i}",
                "topico": str(om.get("tema", ""))[:200],
                "contexto": str(om.get("resumo", ""))[:300],
            })
        questoes_autorais = auditor_v3.gerar_questoes_autorais(itens_autorais, banca, materia)
        for i, erro in enumerate(erros_cometidos):
            q = questoes_autorais.get(f"erro_{i}")
            if q:
                q["id"] = f"autoral_erro_{i}"
            erro["questao_autoral"] = q
        for i, om in enumerate(omissoes_com_questao):
            q = questoes_autorais.get(f"omissao_{i}")
            if q:
                q["id"] = f"autoral_omissao_{i}"
            om["questao_autoral"] = q

        # --- Score cognitivo ---
        score_data = calcular_score_cognitivo(
            acertos=len(checklist_acertos),
            erros=len(erros_cometidos),
            omissoes=len(omissoes_com_questao),
        )

        # --- Montar relatório final ---
        relatorio_id = str(uuid.uuid4())
        print(f"[processar-texto] user_id={user_id!r} materia={materia!r} tema={tema!r}")
        relatorio_completo = {
            "relatorio_id": relatorio_id,
            "user_id": user_id,
            "jornada": jornada,
            "modo": "livre",
            "data": datetime.now().isoformat(),
            "materia": materia,
            "tema": tema,
            "banca_escolhida": banca,
            "faixa_salarial_alvo": faixa_salarial,
            "raciocinio_interno": resultado_ia.get("analise_mentor", ""),
            "erros_cometidos": erros_cometidos,
            "temas_nao_abordados": omissoes_com_questao,
            "checklist_acertos": checklist_acertos,
            "plano_de_estudo": plano_de_estudo,
            "analise_banca": {
                "maior_incidencia": pegadinhas_evitou,
                "pegadinhas": pegadinhas_caiu,
            },
            "fingerprint_banca": fingerprint_banca,
            "detalhamento_teoria": {
                "itens_vistos": itens_vistos,
                "itens_totais": itens_totais,
            },
            "anotacoes_manuais": anotacoes,
            "texto_transcrito": aula_texto,
            **score_data,
        }

        if db:
            db.collection("relatorios").document(relatorio_id).set(relatorio_completo)

        registrar_evento(
            tipo="sessao_explicacao",
            uid=user_id,
            jornada=jornada,
            materia=materia,
            tema=tema,
            modo="livre",
            tokens_input=len(aula_texto) // 4,
            tokens_output=len(json.dumps(resultado_ia, ensure_ascii=False)) // 4,
        )

        extrair_metadados_cognitivos(
            user_id=user_id,
            modo="livre",
            jornada=jornada,
            materia=materia,
            tema=tema,
            resultado_ia=resultado_ia,
            relatorio_completo=relatorio_completo,
        )

        return jsonify(relatorio_completo), 200

    except Exception as e:
        print(f"❌ [LOG INTERNO] ERRO API processar-texto: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor ao processar a requisição."}), 500

@app.route('/api/perfil-cognitivo-dados', methods=['GET', 'OPTIONS'])
@validar_token_firebase
def perfil_cognitivo_dados_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    user_id = request.uid_seguro  # 🔒 UID validado pelo Firebase JWT
    if not user_id:
        return jsonify({"erro": "user_id obrigatório"}), 400
    if not db:
        return jsonify({"erro": "Banco de dados indisponível"}), 503

    historico_scores = []
    questoes_recentes = []

    for colecao in ("relatorios", "relatorios_guiados", "relatorios_simulados"):
        try:
            docs = db.collection(colecao).where("user_id", "==", user_id).stream()
            for doc_snap in docs:
                d = doc_snap.to_dict()
                if not d:
                    continue
                score = d.get("score_cognitivo")
                data_str = d.get("data", "")
                if score is not None and data_str:
                    historico_scores.append({
                        "data": data_str,
                        "score": float(score),
                        "materia": d.get("materia", ""),
                        "tema": d.get("tema", ""),
                        "modo": d.get("modo", ""),
                        "jornada": d.get("jornada", ""),
                        "acertos": d.get("quantidade_acertos", 0),
                        "erros": d.get("quantidade_erros", 0),
                        "omissoes": d.get("quantidade_omissoes", 0),
                    })
                # Coletar questões vinculadas recentes
                if colecao == "relatorios":
                    for err in (d.get("erros_cometidos") or [])[:2]:
                        q = err.get("questao_vinculada") if isinstance(err, dict) else None
                        if q and isinstance(q, dict) and q.get("enunciado"):
                            questoes_recentes.append({
                                "enunciado": (q.get("enunciado") or "")[:250],
                                "banca": q.get("banca", ""),
                                "gabarito": q.get("gabarito", ""),
                                "status": "revisar",
                                "materia": d.get("materia", ""),
                                "tema": d.get("tema", ""),
                            })
                else:
                    for av in (d.get("avaliacoes") or [])[:2]:
                        if not isinstance(av, dict):
                            continue
                        q = av.get("questao_vinculada")
                        if q and isinstance(q, dict) and q.get("enunciado"):
                            st = av.get("status", "")
                            questoes_recentes.append({
                                "enunciado": (q.get("enunciado") or "")[:250],
                                "banca": q.get("banca", ""),
                                "gabarito": q.get("gabarito", ""),
                                "status": "acertou" if st == "Acerto" else ("errou" if st in ("Erro", "Parcial") else "revisar"),
                                "materia": d.get("materia", ""),
                                "tema": d.get("tema", ""),
                            })
        except Exception as exc:
            print(f"[perfil-dados] erro em {colecao}: {exc}")

    historico_scores.sort(key=lambda x: x["data"])

    perfis = []
    try:
        docs = db.collection("perfis_cognitivos").where("user_id", "==", user_id).stream()
        for doc_snap in docs:
            d = doc_snap.to_dict()
            if d:
                perfis.append(d)
    except Exception as exc:
        print(f"[perfil-dados] erro em perfis_cognitivos: {exc}")

    total = len(historico_scores)
    score_medio = round(sum(s["score"] for s in historico_scores) / total, 1) if total > 0 else 0.0

    return jsonify({
        "historico_scores": historico_scores[-50:],
        "perfis_cognitivos": perfis,
        "questoes_recentes": questoes_recentes[:10],
        "total_sessoes": total,
        "score_medio": score_medio,
    }), 200


# ---------------------------------------------------------------------------
# Admin — estatísticas da plataforma
# ---------------------------------------------------------------------------

@app.route('/api/admin/me', methods=['GET', 'OPTIONS'])
@validar_token_firebase
def admin_me():
    """Debug: retorna uid e email do token atual."""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    uid_me   = getattr(request, "uid_seguro", "")
    email_me = getattr(request, "email_seguro", "")
    if not email_me:
        try:
            fb_user  = firebase_auth.get_user(uid_me)
            email_me = fb_user.email or ""
        except Exception:
            pass
    return jsonify({"uid": uid_me, "email": email_me}), 200


_TIPOS_EVENTO_PERMITIDOS = {"sessao_abandonada", "sessao_concluida", "relatorio_visualizado"}

@app.route('/api/evento', methods=['POST', 'OPTIONS'])
@validar_token_firebase
def registrar_evento_cliente():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    dados = request.get_json(silent=True) or {}
    tipo  = dados.get("tipo", "")
    if tipo not in _TIPOS_EVENTO_PERMITIDOS:
        return jsonify({"erro": "Tipo de evento inválido"}), 400

    uid_autor = getattr(request, "uid_seguro", "")
    campos_seguros = {
        "tipo", "jornada", "materia", "tema", "modo",
        "etapa", "duracao_segundos", "usou_audio",
        "tempo_primeira_explicacao", "relatorio_id",
    }
    evento = {k: v for k, v in dados.items() if k in campos_seguros}
    evento["uid"]       = uid_autor
    evento["timestamp"] = datetime.now().isoformat()

    if db:
        try:
            db.collection("eventos_sistema").add(evento)
        except Exception as e:
            print(f"⚠️ registrar_evento_cliente falhou: {e}")

    return jsonify({"ok": True}), 200


@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
@validar_token_firebase
def admin_stats_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    uid_admin   = getattr(request, "uid_seguro", "").strip()
    email_admin = getattr(request, "email_seguro", "").lower()
    ADMIN_EMAILS = {"cassio.mattos@gmail.com"}

    if not db or not uid_admin:
        return jsonify({"erro": "Acesso negado"}), 403

    # Se o email não veio no token, busca diretamente no Firebase Auth
    if not email_admin:
        try:
            fb_user = firebase_auth.get_user(uid_admin)
            email_admin = (fb_user.email or "").lower()
        except Exception:
            pass

    # Verifica role admin no Firestore OU email whitelist
    try:
        snap_admin = db.collection("usuarios").document(uid_admin).get()
        is_admin = (snap_admin.exists() and snap_admin.to_dict().get("role") == "admin") \
                   or email_admin in ADMIN_EMAILS
        if not is_admin:
            return jsonify({"erro": "Acesso negado"}), 403
    except Exception:
        if email_admin not in ADMIN_EMAILS:
            return jsonify({"erro": "Acesso negado"}), 403

    agora = datetime.now()
    iso_hoje   = agora.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    iso_7d     = (agora - __import__("datetime").timedelta(days=7)).isoformat()
    iso_30d    = (agora - __import__("datetime").timedelta(days=30)).isoformat()

    # ── Usuários ──────────────────────────────────────────────────────────────
    usuarios_snap = list(db.collection("usuarios").stream())
    total_usuarios = len(usuarios_snap)
    premium_count  = sum(1 for d in usuarios_snap if d.to_dict().get("premium"))
    jornada_dist: dict = {}
    novos_hoje = novos_7d = novos_30d = 0
    for d in usuarios_snap:
        u = d.to_dict()
        j = u.get("jornada", "concurso")
        jornada_dist[j] = jornada_dist.get(j, 0) + 1
        criado = u.get("criado_em", "")
        if criado >= iso_hoje:  novos_hoje += 1
        if criado >= iso_7d:    novos_7d   += 1
        if criado >= iso_30d:   novos_30d  += 1

    # ── Eventos do sistema ────────────────────────────────────────────────────
    try:
        eventos_snap = list(
            db.collection("eventos_sistema")
              .where("timestamp", ">=", iso_30d)
              .stream()
        )
    except Exception:
        eventos_snap = []

    sessoes_total = sessoes_hoje = sessoes_7d = sessoes_30d = 0
    simulados_total = simulados_hoje = simulados_7d = 0
    modos_dist: dict = {}
    jornada_sessao_dist: dict = {}
    materias_count: dict = {}
    temas_count: dict = {}
    tokens_in_total = tokens_out_total = 0
    tokens_in_hoje  = tokens_out_hoje  = 0
    atividade_recente = []

    # ── Métricas de engajamento ───────────────────────────────────────────────
    abandono_por_etapa: dict = {}
    sessoes_concluidas_tracked = 0
    duracoes: list = []
    usou_audio_count = 0
    tempo_primeira_exp_list: list = []
    relatorios_count: dict = {}
    uid_session_counts: dict = {}
    uid_dias: dict = {}

    for ev_snap in eventos_snap:
        ev = ev_snap.to_dict()
        tipo      = ev.get("tipo", "")
        ts        = ev.get("timestamp", "")
        modo      = ev.get("modo", "")
        jornada_e = ev.get("jornada", "")
        materia_e = ev.get("materia", "")
        tema_e    = ev.get("tema", "")
        t_in      = ev.get("tokens_input", 0)
        t_out     = ev.get("tokens_output", 0)

        tokens_in_total  += t_in
        tokens_out_total += t_out
        if ts >= iso_hoje:
            tokens_in_hoje  += t_in
            tokens_out_hoje += t_out

        if tipo == "sessao_explicacao":
            sessoes_30d += 1
            if ts >= iso_7d:   sessoes_7d   += 1
            if ts >= iso_hoje: sessoes_hoje += 1
            modos_dist[modo] = modos_dist.get(modo, 0) + 1
            jornada_sessao_dist[jornada_e] = jornada_sessao_dist.get(jornada_e, 0) + 1
            if materia_e: materias_count[materia_e] = materias_count.get(materia_e, 0) + 1
            if tema_e:    temas_count[tema_e]        = temas_count.get(tema_e, 0) + 1

        elif tipo == "simulado_gerado":
            simulados_7d += 1
            if ts >= iso_7d:   simulados_7d    = max(simulados_7d - 1, 0) + 1
            if ts >= iso_hoje: simulados_hoje  += 1

        elif tipo == "sessao_abandonada":
            etapa = ev.get("etapa", "desconhecido")
            abandono_por_etapa[etapa] = abandono_por_etapa.get(etapa, 0) + 1

        elif tipo == "sessao_concluida":
            sessoes_concluidas_tracked += 1
            d = ev.get("duracao_segundos")
            if d and isinstance(d, (int, float)) and d > 0:
                duracoes.append(int(d))
            if ev.get("usou_audio"):
                usou_audio_count += 1
            t_exp = ev.get("tempo_primeira_explicacao")
            if t_exp and isinstance(t_exp, (int, float)) and t_exp > 0:
                tempo_primeira_exp_list.append(int(t_exp))

        elif tipo == "relatorio_visualizado":
            chave = ev.get("tema") or ev.get("materia") or "—"
            relatorios_count[chave] = relatorios_count.get(chave, 0) + 1

        # UID tracking para taxa de segunda sessão e retorno
        if tipo in ("sessao_explicacao", "sessao_concluida"):
            uid_s = ev.get("uid", "")
            if uid_s:
                uid_session_counts[uid_s] = uid_session_counts.get(uid_s, 0) + 1
                if ts:
                    dia = ts[:10]
                    uid_dias.setdefault(uid_s, set()).add(dia)

        atividade_recente.append({
            "tipo":     tipo,
            "jornada":  jornada_e,
            "materia":  materia_e,
            "tema":     tema_e,
            "modo":     modo,
            "timestamp": ts,
        })

    # Total histórico de sessões (todas as coleções de relatórios)
    for colecao in ("relatorios", "relatorios_guiados", "relatorios_simulados"):
        try:
            sessoes_total += len(list(db.collection(colecao).select([]).stream()))
        except Exception:
            pass

    try:
        simulados_total = len(list(db.collection("relatorios_simulados").select([]).stream()))
    except Exception:
        simulados_total = 0

    # Top matérias e temas
    top_materias = sorted(materias_count.items(), key=lambda x: x[1], reverse=True)[:10]
    top_temas    = sorted(temas_count.items(),    key=lambda x: x[1], reverse=True)[:10]

    # Custo estimado gpt-4o-mini (USD)
    CUSTO_INPUT  = 0.15 / 1_000_000
    CUSTO_OUTPUT = 0.60 / 1_000_000
    custo_total  = round(tokens_in_total * CUSTO_INPUT + tokens_out_total * CUSTO_OUTPUT, 4)
    custo_hoje   = round(tokens_in_hoje  * CUSTO_INPUT + tokens_out_hoje  * CUSTO_OUTPUT, 4)

    # Feed recente — ordena por timestamp desc, limita a 25
    atividade_recente.sort(key=lambda x: x["timestamp"], reverse=True)
    atividade_recente = atividade_recente[:25]

    # ── Métricas de engajamento ────────────────────────────────────────────────
    total_abandonadas_val = sum(abandono_por_etapa.values())
    total_iniciadas = total_abandonadas_val + sessoes_30d
    taxa_abandono = round(total_abandonadas_val / total_iniciadas * 100) if total_iniciadas > 0 else 0

    duracao_media = round(sum(duracoes) / len(duracoes)) if duracoes else 0
    taxa_audio    = round(usou_audio_count / sessoes_concluidas_tracked * 100) if sessoes_concluidas_tracked > 0 else 0
    tempo_medio_primeira_exp = round(sum(tempo_primeira_exp_list) / len(tempo_primeira_exp_list)) if tempo_primeira_exp_list else 0

    uids_com_sessao     = len(uid_session_counts)
    uids_segunda_sessao = sum(1 for c in uid_session_counts.values() if c >= 2)
    taxa_segunda_sessao = round(uids_segunda_sessao / uids_com_sessao * 100) if uids_com_sessao > 0 else 0

    uids_retornaram = 0
    for _, _dias in uid_dias.items():
        _dias_sorted = sorted(_dias)
        for _i in range(len(_dias_sorted) - 1):
            _d1 = datetime.strptime(_dias_sorted[_i],     "%Y-%m-%d")
            _d2 = datetime.strptime(_dias_sorted[_i + 1], "%Y-%m-%d")
            if (_d2 - _d1).days == 1:
                uids_retornaram += 1
                break
    taxa_retorno_dia = round(uids_retornaram / uids_com_sessao * 100) if uids_com_sessao > 0 else 0

    top_relatorios_list = sorted(relatorios_count.items(), key=lambda x: x[1], reverse=True)[:10]

    return jsonify({
        "usuarios": {
            "total":          total_usuarios,
            "hoje":           novos_hoje,
            "ultimos_7_dias": novos_7d,
            "ultimos_30_dias": novos_30d,
            "premium":        premium_count,
            "free":           total_usuarios - premium_count,
            "por_jornada":    jornada_dist,
        },
        "sessoes": {
            "total":          sessoes_total,
            "hoje":           sessoes_hoje,
            "ultimos_7_dias": sessoes_7d,
            "ultimos_30_dias": sessoes_30d,
            "por_modo":       modos_dist,
            "por_jornada":    jornada_sessao_dist,
            "top_materias":   [{"materia": m, "count": c} for m, c in top_materias],
            "top_temas":      [{"tema": t, "count": c} for t, c in top_temas],
        },
        "simulador": {
            "total":          simulados_total,
            "hoje":           simulados_hoje,
            "ultimos_7_dias": simulados_7d,
        },
        "tokens": {
            "total_input":       tokens_in_total,
            "total_output":      tokens_out_total,
            "custo_total_usd":   custo_total,
            "custo_hoje_usd":    custo_hoje,
        },
        "atividade_recente": atividade_recente,
        "engajamento": {
            "taxa_abandono_pct":             taxa_abandono,
            "duracao_media_segundos":        duracao_media,
            "taxa_audio_pct":                taxa_audio,
            "taxa_retorno_dia_seguinte_pct": taxa_retorno_dia,
            "taxa_segunda_sessao_pct":       taxa_segunda_sessao,
            "tempo_medio_primeira_exp_s":    tempo_medio_primeira_exp,
            "abandono_por_etapa":            abandono_por_etapa,
            "top_relatorios": [{"tema": t, "count": c} for t, c in top_relatorios_list],
        },
    }), 200


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
