// Motor de métricas — fonte ÚNICA de verdade para os números exibidos.
// Feedback da autora (nov/2026): o resultado deve refletir exatamente as
// respostas realizadas; atividades incompletas não contam como concluídas;
// métricas da atividade separadas do consolidado da lição.

export interface ExercicioParaMetrica {
  correta: boolean | null; // null = não respondida (incompleta)
  nota: number | null;
}

export interface MetricasAtividade {
  total: number; // questões respondidas
  acertos: number;
  erros: number;
  percentual: number; // 0..100 (exato: 7/10 = 70)
  notaMedia: number; // 0..10
  incompletas: number; // questões geradas e não respondidas
}

/** Métricas de UMA atividade (bloco de exercícios). Só conta o que foi respondido. */
export function metricasAtividade(exercicios: ExercicioParaMetrica[]): MetricasAtividade {
  const respondidos = exercicios.filter((e) => e.correta !== null);
  const acertos = respondidos.filter((e) => e.correta === true).length;
  const erros = respondidos.length - acertos;
  const percentual = respondidos.length > 0 ? Math.round((acertos / respondidos.length) * 100) : 0;
  const comNota = respondidos.filter((e) => e.nota != null);
  const notaMedia = comNota.length > 0 ? comNota.reduce((a, b) => a + (b.nota || 0), 0) / comNota.length : 0;
  return {
    total: respondidos.length,
    acertos,
    erros,
    percentual,
    notaMedia: Math.round(notaMedia * 10) / 10,
    incompletas: exercicios.length - respondidos.length,
  };
}

export interface SessaoParaMetrica {
  mode: string;
  exercisesTotal: number;
  exercisesCorrect: number;
  interactionCount: number;
  correctCount: number;
  notas: number[]; // notas das interações de conversa
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

/** Métricas consolidadas da SESSÃO (uma atividade). Exercicios > conversa. */
export function metricasSessao(s: SessaoParaMetrica): MetricasSessao {
  if (s.mode !== "conversa" && s.exercisesTotal > 0) {
    // Atividade de exercícios: números exatos, determinísticos.
    const percentual = s.exercisesTotal > 0 ? Math.round((s.exercisesCorrect / s.exercisesTotal) * 100) : 0;
    return {
      tipo: "exercicios",
      total: s.exercisesTotal,
      acertos: s.exercisesCorrect,
      erros: s.exercisesTotal - s.exercisesCorrect,
      percentual,
      notaMedia: s.exercisesTotal > 0 ? Math.round(((s.exercisesCorrect / s.exercisesTotal) * 10) * 10) / 10 : 0,
      interacoes: s.interactionCount,
    };
  }
  // Conversa livre: não há certo/errado — interações e nota média do tutor.
  const acertos = s.correctCount; // interações com nota >= 7 (heurística do tutor)
  const percentual = s.interactionCount > 0 ? Math.round((acertos / s.interactionCount) * 100) : 0;
  const notaMedia = s.notas.length > 0 ? s.notas.reduce((a, b) => a + b, 0) / s.notas.length : 0;
  return {
    tipo: "conversa",
    total: s.interactionCount,
    acertos,
    erros: s.interactionCount - acertos,
    percentual,
    notaMedia: Math.round(notaMedia * 10) / 10,
    interacoes: s.interactionCount,
  };
}

/** Nota final da sessão 0..10 coerente com o que será exibido. */
export function notaFinalSessao(s: SessaoParaMetrica): number {
  const m = metricasSessao(s);
  if (m.tipo === "exercicios") return m.percentual / 10;
  return m.notaMedia;
}

/** Consolidado da LIÇÃO a partir das sessões encerradas (melhor por modo + geral). */
export interface ConsolidadoLicao {
  sessoes: number;
  percentualMedio: number; // média dos percentuais das sessões de exercícios
  notaGeral: number; // melhor nota entre sessões encerradas
  totalExercicios: number;
  totalAcertos: number;
}

export function consolidadoLicao(sessoes: SessaoParaMetrica[]): ConsolidadoLicao {
  const encerradas = sessoes; // chamador filtra status ENCERRADA
  const comExercicios = encerradas.filter((s) => s.mode !== "conversa" && s.exercisesTotal > 0);
  const percentualMedio =
    comExercicios.length > 0
      ? Math.round(
          (comExercicios.reduce((a, s) => a + (s.exercisesTotal > 0 ? s.exercisesCorrect / s.exercisesTotal : 0), 0) /
            comExercicios.length) *
            100
        )
      : 0;
  const notas = encerradas.map((s) => notaFinalSessao(s));
  const notaGeral = notas.length > 0 ? Math.max(...notas) : 0;
  const totalExercicios = encerradas.reduce((a, s) => a + s.exercisesTotal, 0);
  const totalAcertos = encerradas.reduce((a, s) => a + s.exercisesCorrect, 0);
  return {
    sessoes: encerradas.length,
    percentualMedio,
    notaGeral: Math.round(notaGeral * 10) / 10,
    totalExercicios,
    totalAcertos,
  };
}
