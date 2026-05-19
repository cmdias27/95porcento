// lib/cognitivo.ts — tipos e fetch para Perfil Cognitivo Premium
import { apiFetch } from "./apiFetch";

export interface HistoricoScore {
  data: string;
  score: number;
  materia: string;
  tema: string;
  modo: string;
  jornada: string;
  acertos: number;
  erros: number;
  omissoes: number;
}

export interface ErroOmissao {
  topico: string;
  descricao?: string;
  count: number;
  ultima_sessao: number;
  peso_percentual?: number;
}

export interface TopicosDominado {
  topico: string;
  count: number;
}

export interface PerfilCognitivo {
  jornada: string;
  materia: string;
  tema: string;
  total_sessoes: number;
  ultima_atualizacao: string;
  erros: ErroOmissao[];
  omissoes: ErroOmissao[];
  dominados: TopicosDominado[];
  peso_total_prioritario: number;
}

export interface QuestaoRecente {
  enunciado: string;
  banca: string;
  gabarito: string;
  status: "acertou" | "errou" | "revisar";
  materia: string;
  tema: string;
}

export interface DadosPerfil {
  historico_scores: HistoricoScore[];
  perfis_cognitivos: PerfilCognitivo[];
  questoes_recentes: QuestaoRecente[];
  total_sessoes: number;
  score_medio: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchPerfilCognitivo(): Promise<DadosPerfil> {
  // 🔒 UID lido do token JWT pelo backend — não enviamos uid na URL
  const res = await apiFetch(
    `${API_BASE_URL}/api/perfil-cognitivo-dados`
  );
  if (!res.ok) throw new Error("Falha ao buscar perfil cognitivo");
  return res.json();
}

export function isSuperado(item: ErroOmissao, totalSessoes: number): boolean {
  if (!item.ultima_sessao) return false;
  return totalSessoes - item.ultima_sessao >= 3;
}

// Agrega todos os erros de todos os perfis cognitivos (sem duplicar tópicos)
export function agregarErros(perfis: PerfilCognitivo[]): Array<ErroOmissao & { totalSessoes: number }> {
  const map = new Map<string, ErroOmissao & { totalSessoes: number }>();
  for (const perfil of perfis) {
    for (const erro of perfil.erros) {
      const key = erro.topico.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.count = Math.max(existing.count, erro.count);
        existing.ultima_sessao = Math.max(existing.ultima_sessao, erro.ultima_sessao ?? 0);
        existing.totalSessoes = Math.max(existing.totalSessoes, perfil.total_sessoes);
        if (erro.descricao) existing.descricao = erro.descricao;
      } else {
        map.set(key, { ...erro, totalSessoes: perfil.total_sessoes });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function agregarOmissoes(perfis: PerfilCognitivo[]): Array<ErroOmissao & { totalSessoes: number }> {
  const map = new Map<string, ErroOmissao & { totalSessoes: number }>();
  for (const perfil of perfis) {
    for (const om of perfil.omissoes) {
      const key = om.topico.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.count = Math.max(existing.count, om.count);
        existing.ultima_sessao = Math.max(existing.ultima_sessao, om.ultima_sessao ?? 0);
        existing.totalSessoes = Math.max(existing.totalSessoes, perfil.total_sessoes);
      } else {
        map.set(key, { ...om, totalSessoes: perfil.total_sessoes });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function agregarDominados(perfis: PerfilCognitivo[]): TopicosDominado[] {
  const map = new Map<string, TopicosDominado>();
  for (const perfil of perfis) {
    for (const d of perfil.dominados ?? []) {
      const key = d.topico.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.count += d.count;
      } else {
        map.set(key, { ...d });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export interface PlanoItem {
  topico: string;
  prioridade: "alta" | "media" | "revisao";
  motivo: string;
}

export function gerarPlanoEstudo(
  erros: Array<ErroOmissao & { totalSessoes: number }>,
  omissoes: Array<ErroOmissao & { totalSessoes: number }>,
  dominados: TopicosDominado[],
): PlanoItem[] {
  const plano: PlanoItem[] = [];
  const vistos = new Set<string>();

  const add = (topico: string, prioridade: PlanoItem["prioridade"], motivo: string) => {
    const key = topico.toLowerCase().trim();
    if (!vistos.has(key)) {
      vistos.add(key);
      plano.push({ topico, prioridade, motivo });
    }
  };

  // Alta: erros recorrentes (count >= 2, não superados)
  for (const e of erros) {
    if (!isSuperado(e, e.totalSessoes) && e.count >= 2) {
      add(e.topico, "alta", `Erro recorrente — ${e.count} ocorrência${e.count > 1 ? "s" : ""}`);
    }
  }
  // Alta: omissões recorrentes (count >= 2, não corrigidas)
  for (const o of omissoes) {
    if (!isSuperado(o, o.totalSessoes) && o.count >= 2) {
      add(o.topico, "alta", `Omissão frequente — ${o.count} vez${o.count > 1 ? "es" : ""}`);
    }
  }
  // Média: erros/omissões recentes (count == 1, não superados)
  for (const e of erros) {
    if (!isSuperado(e, e.totalSessoes) && e.count === 1) {
      add(e.topico, "media", "Identificado em sessão recente");
    }
  }
  for (const o of omissoes) {
    if (!isSuperado(o, o.totalSessoes) && o.count === 1) {
      add(o.topico, "media", "Tópico omitido em sessão recente");
    }
  }
  // Revisão: dominados consolidados (count >= 2)
  for (const d of dominados) {
    if (d.count >= 2) {
      add(d.topico, "revisao", "Consolidado — revisar periodicamente");
    }
  }

  return plano;
}
