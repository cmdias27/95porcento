# backend/agente_download.py
import os
import time
from playwright.sync_api import sync_playwright

def iniciar_extracao(url_curso, pasta_destino):
    os.makedirs(pasta_destino, exist_ok=True)
    
    if not os.path.exists("estado_sessao.json"):
        print("❌ Erro: Arquivo de sessão não encontrado. Rode 'gerar_sessao.py' primeiro.")
        return

    with sync_playwright() as p:
        print("\n🤖 Iniciando Agente Extrator Inteligente...")
        navegador = p.chromium.launch(headless=False) 
        contexto = navegador.new_context(storage_state="estado_sessao.json")
        pagina = contexto.new_page()

        print(f"📖 Acessando o curso...")
        pagina.goto(url_curso, wait_until="networkidle")
        time.sleep(4) # Espera o site carregar completamente

        falhas_consecutivas = 0

        # Tenta varrer da Aula 00 até a Aula 99
        for i in range(100): 
            nome_aula = f"Aula {i:02d}"
            
            # 1. Procura o texto exato da aula na tela
            titulos = pagina.get_by_text(nome_aula, exact=True)
            
            if titulos.count() == 0:
                falhas_consecutivas += 1
                if falhas_consecutivas >= 3:
                    print("🏁 Fim da lista de aulas alcançado.")
                    break
                continue
            
            falhas_consecutivas = 0
            print(f"▶️ Explorando: {nome_aula}")
            
            try:
                titulo_elemento = titulos.first
                titulo_elemento.scroll_into_view_if_needed()
                
                # 2. Pega todos os botões "versão original" que existem na página inteira
                botoes_pdf = pagina.get_by_text("versão original", exact=False)
                
                # 3. Verifica se a sanfona JÁ ESTÁ ABERTA (se tem algum botão visível)
                algum_visivel = False
                for idx in range(botoes_pdf.count()):
                    if botoes_pdf.nth(idx).is_visible():
                        algum_visivel = True
                        break
                
                # Se não tem nenhum visível, significa que a aula está fechada. Vamos abrir!
                if not algum_visivel:
                    titulo_elemento.click()
                    time.sleep(2) # Aguarda a animação da sanfona descer
                
                # 4. Agora varremos novamente para achar o botão que ficou visível e clicar nele
                baixou = False
                for idx in range(botoes_pdf.count()):
                    btn = botoes_pdf.nth(idx)
                    
                    if btn.is_visible():
                        print("   📄 Botão revelado! Capturando PDF...")
                        
                        with pagina.expect_popup(timeout=15000) as popup_info:
                            btn.click()
                        
                        nova_guia = popup_info.value
                        nova_guia.wait_for_load_state()
                        url_pdf = nova_guia.url
                        
                        # Limpeza da URL caso abra na extensão do Chrome
                        if "chrome-extension://" in url_pdf and "https://" in url_pdf:
                            url_pdf = "https://" + url_pdf.split("https://")[-1]
                            
                        print(f"   📥 Baixando arquivo direto do servidor...")
                        resposta = pagina.request.get(url_pdf)
                        
                        caminho_arquivo = os.path.join(pasta_destino, f"{nome_aula}.pdf")
                        with open(caminho_arquivo, "wb") as f:
                            f.write(resposta.body())
                            
                        print(f"   ✅ Salvo com sucesso!")
                        nova_guia.close()
                        baixou = True
                        break # Sucesso, sai do loop de botões
                
                if not baixou:
                    print(f"   ⚠️ PDF 'versão original' não encontrado (verifiquei {botoes_pdf.count()} elementos ocultos).")
                
                # 5. PASSO CRUCIAL: Clica novamente na aula para FECHAR a sanfona.
                # Isso limpa a tela para que a próxima aula não se confunda com o botão desta.
                titulo_elemento.click()
                time.sleep(1)
                
            except Exception as e:
                print(f"   ❌ Falha ao processar a {nome_aula}: {e}")
            
            print("-" * 40)

        print("\n🎉 EXTRAÇÃO TOTAL CONCLUÍDA!")
        navegador.close()

if __name__ == "__main__":
    print("=" * 50)
    print("AGENTE DE DOWNLOAD - 95PORCENTO")
    print("=" * 50)
    
    url_input = input("🔗 Cole a URL exata do curso: ").strip()
    pasta_input = input("📁 Cole o caminho da pasta destino: ").strip()
    
    if pasta_input.startswith('"') and pasta_input.endswith('"'):
        pasta_input = pasta_input[1:-1]
    elif pasta_input.startswith("'") and pasta_input.endswith("'"):
        pasta_input = pasta_input[1:-1]
        
    iniciar_extracao(url_input, pasta_input)