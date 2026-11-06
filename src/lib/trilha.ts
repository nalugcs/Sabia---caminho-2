// Regras de navegação da trilha — puras e testáveis (sem banco).
// Feedback da autora (nov/2026): autonomia de ritmo DENTRO da lição
// (várias atividades, repetir, revisitar) com progressão controlada ENTRE
// lições (a lição N+1 abre quando a N é concluída explicitamente).

import { TRILHA_LICOES } from "./pesquisa";

export interface ResumoSessao {
  sessionId: string;
  lessonNumber: number;
  mode: string;
  status: string; // EM_ANDAMENTO | ENCERRADA
  isReview: boolean;
  exercisesTotal: number;
  exercisesCorrect: number;
  interactionCount: number;
  correctCount: number;
  score: number | null;
  endedAt: string | null;
}

export interface EstadoLicao {
  numero: number;
  status: "BLOQUEADA" | "DISPONIVEL" | "EM_ANDAMENTO" | "CONCLUIDA";
  emAndamento?: { sessionId: string; mode: string };
  praticado: {
    mode: string;
    nota: number | null;
    percentual: number | null; // só p/ exercícios
    vezes: number;
    ultima: string; // data ISO da última sessão encerrada
  }[];
  podeAvancar: boolean;
  revisao: boolean; // lição concluída que pode ser revisitada
}

/**
 * Monta o estado de cada lição a partir das sessões do participante.
 * - Lição concluída = participant.lessonProgress (registrado em trilha/avancar)
 * - Várias sessões por lição; modo praticado agrega o melhor resultado.
 */
export function estadoDasLicoes(
  totalSessoes: ResumoSessao[],
  progressoConcluidas: number // nº de lições já concluídas (avançadas) — fonte: Participante
): EstadoLicao[] {
  const porLicao = new Map<number, ResumoSessao[]>();
  for (const s of totalSessoes) {
    const arr = porLicao.get(s.lessonNumber) || [];
    arr.push(s);
    porLicao.set(s.lessonNumber, arr);
  }

  const licoes: EstadoLicao[] = [];
  for (let n = 1; n <= TRILHA_LICOES; n++) {
    const sessoes = (porLicao.get(n) || []).sort((a, b) => (a.status === "EM_ANDAMENTO" ? -1 : 1));
    const andamento = sessoes.find((s) => s.status === "EM_ANDAMENTO");
    const encerradas = sessoes.filter((s) => s.status === "ENCERRADA");
    const concluida = n <= progressoConcluidas;

    // modos praticados: agrega por modo (melhor nota, maior percentual)
    const porModo = new Map<string, EstadoLicao["praticado"][number]>();
    for (const s of encerradas) {
      const percentual =
        s.mode !== "conversa" && s.exercisesTotal > 0
          ? Math.round((s.exercisesCorrect / s.exercisesTotal) * 100)
          : null;
      const atual = porModo.get(s.mode);
      if (!atual) {
        porModo.set(s.mode, {
          mode: s.mode,
          nota: s.score,
          percentual,
          vezes: 1,
          ultima: s.endedAt || "",
        });
      } else {
        atual.vezes += 1;
        if ((s.score ?? 0) > (atual.nota ?? 0)) {
          atual.nota = s.score;
          atual.percentual = percentual;
          atual.ultima = s.endedAt || atual.ultima;
        }
      }
    }

    let status: EstadoLicao["status"];
    if (andamento) status = "EM_ANDAMENTO";
    else if (concluida) status = "CONCLUIDA";
    else if (n === progressoConcluidas + 1) status = "DISPONIVEL";
    else status = "BLOQUEADA";

    licoes.push({
      numero: n,
      status,
      emAndamento: andamento ? { sessionId: andamento.sessionId, mode: andamento.mode } : undefined,
      praticado: [...porModo.values()],
      podeAvancar: !concluida && encerradas.length > 0 && n === progressoConcluidas + 1,
      revisao: concluida,
    });
  }
  return licoes;
}

/** Pode abrir a lição N? Disponível, em andamento (retomar) ou revisão de concluída. */
export function podeAbrirLicao(n: number, estado: EstadoLicao[]): boolean {
  const l = estado.find((x) => x.numero === n);
  if (!l) return false;
  return l.status === "DISPONIVEL" || l.status === "EM_ANDAMENTO" || l.status === "CONCLUIDA";
}

/** Validar avanço: lição N com ≥1 atividade encerrada e é a próxima da trilha. */
export function podeConcluirLicao(
  n: number,
  sessoes: ResumoSessao[],
  progressoConcluidas: number
): { ok: boolean; motivo?: string } {
  if (n !== progressoConcluidas + 1) {
    return { ok: false, motivo: "Só é possível concluir a próxima lição da trilha." };
  }
  const encerradas = sessoes.filter((s) => s.lessonNumber === n && s.status === "ENCERRADA");
  if (encerradas.length === 0) {
    return { ok: false, motivo: "Pratique pelo menos uma atividade antes de concluir a lição." };
  }
  return { ok: true };
}
