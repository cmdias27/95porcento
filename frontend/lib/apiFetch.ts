// lib/apiFetch.ts
// 🔒 Wrapper centralizado que injeta automaticamente o Bearer Token do Firebase
// em todas as requisições para o backend.

import { auth } from "./firebase";

/**
 * Substitui o `fetch` nativo para chamadas ao backend Flask.
 * Busca o token JWT do usuário logado e o envia no cabeçalho Authorization.
 *
 * @param url      URL completa ou path da rota
 * @param options  Opções normais do fetch (method, body, etc.)
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;

  let authHeader: Record<string, string> = {};

  if (user) {
    try {
      // Obtém o token válido (renova automaticamente se expirado)
      const token = await user.getIdToken();
      authHeader = { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.error("❌ apiFetch: Falha ao obter token Firebase", err);
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
      ...authHeader,
    },
  });
}
