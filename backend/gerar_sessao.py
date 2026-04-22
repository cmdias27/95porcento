# backend/gerar_sessao.py
from playwright.sync_api import sync_playwright

def salvar_login():
    with sync_playwright() as p:
        # Abre um navegador visível para você interagir
        navegador = p.chromium.launch(headless=False)
        contexto = navegador.new_context()
        pagina = contexto.new_page()

        print("🌐 Abrindo o site...")
        pagina.goto("https://www.estrategiaconcursos.com.br/app/dashboard/cursos")

        print("\n⏳ Faça o login MANUALMENTE no navegador que se abriu.")
        print("Após fazer o login e ver a lista de cursos, feche esta janela do navegador.")
        
        # O script pausa aqui até você fechar a janela do navegador
        pagina.wait_for_event("close", timeout=0) 

        # Salva os cookies e a sessão logada!
        contexto.storage_state(path="estado_sessao.json")
        print("\n✅ Sessão salva com sucesso no arquivo 'estado_sessao.json'!")
        
        navegador.close()

if __name__ == "__main__":
    salvar_login()