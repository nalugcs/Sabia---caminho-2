// Formatação de mensagens do chat e exercícios para a resposta das APIs.
// O gabarito/tolerâncias de um exercício NUNCA vão ao cliente antes da resposta.

export interface MensagemFormatada {
  id: string;
  role: string;
  content: string;
  correcao?: string;
  explicacao?: string;
  exemplo?: string;
  nota?: number;
  proximoExercicio?: string;
  criadoEm: Date;
}

export function formatarMensagem(m: {
  id: string;
  role: string;
  content: string;
  correcao?: string | null;
  explicacao?: string | null;
  exemplo?: string | null;
  nota?: number | null;
  proximoExercicio?: string | null;
  createdAt: Date;
}): MensagemFormatada {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    correcao: m.correcao || undefined,
    explicacao: m.explicacao || undefined,
    exemplo: m.exemplo || undefined,
    nota: m.nota ?? undefined,
    proximoExercicio: m.proximoExercicio || undefined,
    criadoEm: m.createdAt,
  };
}

export interface ExercicioFormatado {
  id: string;
  ordem: number;
  tipo: string;
  dificuldade: string;
  enunciado: string;
  alternativas?: string[];
  palavras?: string[];
  colunaEsq?: string[]; // associar: lado esquerdo
  colunaDir?: string[]; // associar: lado direito (embaralhado)
  respondida: boolean;
  correta?: boolean | null;
  gabarito?: string; // só depois de respondida
  nota?: number | null;
  explicacao?: string;
  respostaAluno?: unknown;
}

export function formatarExercicio(e: {
  id: string;
  ordem: number;
  tipo: string;
  dificuldade: string;
  enunciado: string;
  alternativas?: string | null;
  pares?: string | null;
  gabarito: string;
  respostaAluno?: string | null;
  correta?: boolean | null;
  nota?: number | null;
  explicacao?: string | null;
  respondidoEm?: Date | null;
}): ExercicioFormatado {
  const respondida = !!e.respondidoEm;
  const base: ExercicioFormatado = {
    id: e.id,
    ordem: e.ordem,
    tipo: e.tipo,
    dificuldade: e.dificuldade,
    enunciado: e.enunciado,
    respondida,
  };
  if (e.tipo === "multipla" && e.alternativas) {
    base.alternativas = JSON.parse(e.alternativas) as string[];
  }
  if (e.tipo === "ordenar" && e.alternativas) {
    base.palavras = JSON.parse(e.alternativas) as string[];
  }
  if (e.tipo === "associar" && e.pares) {
    const pares = JSON.parse(e.pares) as [string, string][];
    base.colunaEsq = pares.map((p) => p[0]);
    base.colunaDir = [...pares.map((p) => p[1])].sort(); // ordem alfabética ≠ mapeamento
  }
  if (respondida) {
    base.correta = e.correta;
    base.nota = e.nota;
    base.explicacao = e.explicacao || undefined;
    base.gabarito = e.gabarito;
    if (e.respostaAluno) {
      try {
        base.respostaAluno = JSON.parse(e.respostaAluno);
      } catch {
        base.respostaAluno = e.respostaAluno;
      }
    }
  }
  return base;
}
