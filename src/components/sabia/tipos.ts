// Tipos compartilhados do app Sabiá (lado cliente).

export interface InfoLicao {
  numero: number;
  status: "BLOQUEADA" | "EM_ANDAMENTO" | "CONCLUIDA";
  sessionId?: string;
  modo?: string;
  score?: number | null;
  acertos?: number;
  interacoes?: number;
  tempoSec?: number;
  microRespondido?: boolean;
}

export interface EstadoSessao {
  participante: {
    code: string;
    primeiroNome: string;
    idioma: string;
    nivelDeclarado: number;
    status: string;
  };
  licoes: InfoLicao[];
  concluidas: number;
  total: number;
  proximaLicao: number | null;
  questionarioFinalRespondido: boolean;
}

export interface Mensagem {
  id: string;
  role: "ALUNO" | "PROFESSORA";
  content: string;
  correcao?: string;
  explicacao?: string;
  exemplo?: string;
  nota?: number;
  proximoExercicio?: string;
  criadoEm: string;
}

export interface DadosLicao {
  numero: number;
  nivel: string;
  tema: string;
  objetivo: string;
  conteudo: string[];
}

export interface ResultadoEncerrar {
  score: number;
  acertos: number;
  interacoes: number;
  dicas: number;
  tempoSec: number;
  feedbackFinal: string;
}

export async function chamarAPI<T = unknown>(
  caminho: string,
  corpo?: unknown
): Promise<T> {
  const resp = await fetch(caminho, {
    method: corpo ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error((json as { erro?: string }).erro || `Erro ${resp.status}`);
  }
  return json as T;
}

export function formatarTempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}min ${s.toString().padStart(2, "0")}s`;
}
