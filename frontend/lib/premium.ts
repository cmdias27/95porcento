// lib/premium.ts — Utilidades de perfil premium, sessões e score cognitivo
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PerfilUsuario {
  premium: boolean;
  premium_expiracao: string | null;
  plano: "free" | "premium";
  sessoes_semanais_usadas: number;
  ultima_renovacao_sessoes: string;
  jornada: string;
  nivel_padrao: string;
  onboarding_completo: boolean;
  preferencia_input: "texto" | "audio";
}

export const LIMITE_SESSOES_GRATUITAS = 5;

// ---------------------------------------------------------------------------
// Perfil do usuário — leitura com fallback seguro para usuários antigos
// ---------------------------------------------------------------------------

export async function getPerfilUsuario(uid: string): Promise<PerfilUsuario> {
  const ref  = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  const agora = new Date().toISOString();

  if (!snap.exists()) {
    const defaults: PerfilUsuario = {
      premium: false,
      premium_expiracao: null,
      plano: "free",
      sessoes_semanais_usadas: 0,
      ultima_renovacao_sessoes: agora,
      jornada: "concurso",
      nivel_padrao: "Intermediario",
      onboarding_completo: false,
      preferencia_input: "texto",
    };
    await setDoc(ref, { ...defaults, criado_em: agora }, { merge: true });
    return defaults;
  }

  const d = snap.data() as Partial<PerfilUsuario>;
  return {
    premium:                  d.premium                  ?? false,
    premium_expiracao:        d.premium_expiracao        ?? null,
    plano:                    d.plano                    ?? "free",
    sessoes_semanais_usadas:  d.sessoes_semanais_usadas  ?? 0,
    ultima_renovacao_sessoes: d.ultima_renovacao_sessoes ?? agora,
    jornada:                  d.jornada                  ?? "concurso",
    nivel_padrao:             d.nivel_padrao             ?? "Intermediario",
    onboarding_completo:      d.onboarding_completo      ?? false,
    preferencia_input:        d.preferencia_input        ?? "texto",
  };
}

// ---------------------------------------------------------------------------
// Renovação automática semanal
// ---------------------------------------------------------------------------

export async function verificarRenovacaoSemanal(uid: string): Promise<PerfilUsuario> {
  const perfil = await getPerfilUsuario(uid);
  const agora  = new Date();
  const ultima = new Date(perfil.ultima_renovacao_sessoes);
  const diasDecorridos = (agora.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24);

  if (diasDecorridos >= 7) {
    const ref    = doc(db, "usuarios", uid);
    const agoraIso = agora.toISOString();
    await updateDoc(ref, {
      sessoes_semanais_usadas:  0,
      ultima_renovacao_sessoes: agoraIso,
    });
    return { ...perfil, sessoes_semanais_usadas: 0, ultima_renovacao_sessoes: agoraIso };
  }

  return perfil;
}

// ---------------------------------------------------------------------------
// Verificação de limite
// ---------------------------------------------------------------------------

export function podeIniciarSessao(perfil: PerfilUsuario): boolean {
  if (perfil.premium) return true;
  return perfil.sessoes_semanais_usadas < LIMITE_SESSOES_GRATUITAS;
}

// ---------------------------------------------------------------------------
// Incremento de sessão — chamar após relato gerado com sucesso
// ---------------------------------------------------------------------------

export async function incrementarSessaoUsada(uid: string): Promise<void> {
  const ref    = doc(db, "usuarios", uid);
  const perfil = await getPerfilUsuario(uid);
  if (perfil.premium) return; // ilimitado
  await updateDoc(ref, {
    sessoes_semanais_usadas: perfil.sessoes_semanais_usadas + 1,
  });
}

// ---------------------------------------------------------------------------
// Data da próxima renovação
// ---------------------------------------------------------------------------

export function dataProximaRenovacao(ultimaRenovacao: string): Date {
  const d = new Date(ultimaRenovacao);
  d.setDate(d.getDate() + 7);
  return d;
}

export function formatarDataRenovacao(ultimaRenovacao: string): string {
  const d = dataProximaRenovacao(ultimaRenovacao);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Score Cognitivo — calculado no frontend para exibição no perfil
// (o backend também calcula e salva no relatório)
// ---------------------------------------------------------------------------

export interface ScoreCognitivo {
  score: number;           // 0–10
  acertos: number;
  erros: number;
  omissoes: number;
  total: number;
  redutor: boolean;        // true se total < 5
}

export function calcularScoreCognitivo(
  acertos: number,
  erros: number,
  omissoes: number,
): ScoreCognitivo {
  const total = acertos + erros + omissoes;
  if (total === 0) {
    return { score: 0, acertos, erros, omissoes, total: 0, redutor: false };
  }
  const redutor = total < 5;
  const raw     = acertos / total;
  const score   = parseFloat((raw * 10 * (redutor ? 0.8 : 1)).toFixed(1));
  return { score, acertos, erros, omissoes, total, redutor };
}
