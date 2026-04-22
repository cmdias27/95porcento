# backend/atualizar_frontend.py
import os
import json
import glob

def gerar_materias_ts():
    print("=" * 60)
    print("GERADOR DE MENU DO FRONTEND - 95PORCENTO")
    print("=" * 60)

    # 1. Definição do caminho absoluto para o frontend conforme solicitado
    caminho_frontend_data = r"C:\Users\cassio\Desktop\Projetos Python\95porcento\95porcento\frontend\data"
    os.makedirs(caminho_frontend_data, exist_ok=True)
    caminho_ts = os.path.join(caminho_frontend_data, "materias.ts")

    # 2. Caminho onde estão os dados do backend
    # Assume-se que o script está em /backend/ e as questões em /backend/questoes/
    pasta_raiz_backend = os.path.dirname(__file__)
    pasta_questoes = os.path.join(pasta_raiz_backend, "questoes")
    
    # 3. Estrutura de dados para o agrupamento
    jornadas_dict = {}

    # 4. Varre todas as pastas procurando por 'temas.json'
    # Estrutura esperada: questoes/[Jornada]/[Materia]/temas.json
    caminho_busca = os.path.join(pasta_questoes, "*", "*", "temas.json")
    arquivos_temas = glob.glob(caminho_busca)

    if not arquivos_temas:
        print(f"❌ Nenhum arquivo 'temas.json' encontrado em: {pasta_questoes}")
        return

    print(f"🔎 Encontrados {len(arquivos_temas)} arquivos de temas. Sincronizando...")

    for arquivo in arquivos_temas:
        try:
            with open(arquivo, 'r', encoding='utf-8') as f:
                dados = json.load(f)
                
                jornada = dados.get("jornada", "Geral")
                materia = dados.get("materia", "Desconhecida")
                temas = dados.get("temas", [])
                total = dados.get("total_questoes", 0)

                if jornada not in jornadas_dict:
                    jornadas_dict[jornada] = []

                # Adiciona ou atualiza os dados da matéria
                jornadas_dict[jornada].append({
                    "id": materia.lower().replace(" ", "_"),
                    "nome": materia,
                    "temas": temas,
                    "totalQuestoes": total
                })
        except Exception as e:
            print(f"⚠️ Erro ao ler {arquivo}: {e}")

    # 5. Construção do conteúdo do arquivo TypeScript
    conteudo = "// ARQUIVO GERADO AUTOMATICAMENTE PELO BACKEND\n"
    conteudo += "// PONTO DE PARTIDA: temas.json de cada matéria\n\n"
    
    conteudo += "export interface Materia {\n"
    conteudo += "  id: string;\n"
    conteudo += "  nome: string;\n"
    conteudo += "  temas: string[];\n"
    conteudo += "  totalQuestoes: number;\n"
    conteudo += "}\n\n"
    
    conteudo += "export interface Jornada {\n"
    conteudo += "  nome: string;\n"
    conteudo += "  materias: Materia[];\n"
    conteudo += "}\n\n"
    
    conteudo += "export const JORNADAS_ESTUDO: Jornada[] = [\n"
    
    for nome_jornada, materias in jornadas_dict.items():
        conteudo += "  {\n"
        conteudo += f"    nome: \"{nome_jornada}\",\n"
        conteudo += "    materias: [\n"
        
        # Ordena matérias por nome
        materias_ordenadas = sorted(materias, key=lambda x: x["nome"])
        
        for mat in materias_ordenadas:
            conteudo += "      {\n"
            conteudo += f"        id: \"{mat['id']}\",\n"
            conteudo += f"        nome: \"{mat['nome']}\",\n"
            conteudo += f"        totalQuestoes: {mat['totalQuestoes']},\n"
            
            # Formatação limpa da lista de temas
            lista_str = ", ".join([f'"{t}"' for t in mat["temas"]])
            conteudo += f"        temas: [{lista_str}]\n"
            conteudo += "      },\n"
            
        conteudo += "    ]\n"
        conteudo += "  },\n"
        
    conteudo += "];\n"

    # 6. Salvamento físico do arquivo
    try:
        with open(caminho_ts, 'w', encoding='utf-8') as f:
            f.write(conteudo)
        print(f"\n✅ SUCESSO! O frontend foi atualizado.")
        print(f"📍 Arquivo gerado: {caminho_ts}")
    except Exception as e:
        print(f"❌ Falha ao gravar o arquivo no frontend: {e}")

if __name__ == "__main__":
    gerar_materias_ts()