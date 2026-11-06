// Tipos compartilhados do app Sabiá (lado cliente).

export interface InfoLicao {
  numero: number;
  status: "BLOQUEADA" | "DISPONIVEL" | "EM_ANDAMENTO" | "CONCLUIDA";
  emAndamento?: { sessionId: string; mode: string };
  praticado: {
    mode: string;
    rotulo: string;
    nota: number | null;
    percentual: number | null;
    vezes: number;
    ultima: string;
  }[];
  podeAvancar: boolean;
  revisao: boolean;
}

export interface EstadoSessao {
  participante: {
    code: string;
    primeiroNome: string;
    idioma: string;
    nivelDeclarado: number;
    nivelCEFR?: string;
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

export interface Exercicio {
  id: string;
  ordem: number;
  tipo: "multipla" | "digitada" | "ordenar" | "associar" | string;
  dificuldade: string;
  enunciado: string;
  alternativas?: string[];
  palavras?: string[];
  colunaEsq?: string[];
  colunaDir?: string[];
  respondida: boolean;
  correta?: boolean | null;
  gabarito?: string;
  nota?: number | null;
  explicacao?: string;
  respostaAluno?: unknown;
}

export interface RespostaExercicio {
  exercicio: Exercicio;
  correta: boolean;
  nota: number;
  gabarito: string | { esq: string; dir: string }[] | unknown;
  explicacao: string;
  progresso: { respondidas: number; total: number; acertos: number };
  concluida: boolean;
}

export interface MetricasSessao {
  tipo: "exercicios" | "conversa";
  total: number;
  acertos: number;
  erros: number;
  percentual: number;
  notaMedia: number;
  interacoes: number;
}

export interface ResultadoEncerrar {
  score: number;
  metricas: MetricasSessao;
  incompletas: number;
  dicas: number;
  tempoSec: number;
  feedbackFinal: string;
  exercicios: Exercicio[];
  acoes: {
    podeAvancar: boolean;
    proximaLicao: number | null;
    revisao: boolean;
  };
}

export interface AberturaResposta {
  retomada: boolean;
  revisao: boolean;
  sessionId: string;
  modo: string;
  licao: DadosLicao;
  mensagens: Mensagem[];
  exercicios: Exercicio[];
  provedor?: string;
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
