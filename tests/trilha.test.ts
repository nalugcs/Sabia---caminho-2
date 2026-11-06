import { describe, expect, test } from "bun:test";
import type { ResumoSessao } from "../src/lib/trilha";

const { estadoDasLicoes, podeAbrirLicao, podeConcluirLicao } = await import("../src/lib/trilha");

function sessao(parcial: Partial<ResumoSessao>): ResumoSessao {
  return {
    sessionId: `s-${Math.random().toString(36).slice(2, 8)}`,
    lessonNumber: 1,
    mode: "completar",
    status: "ENCERRADA",
    isReview: false,
    exercisesTotal: 8,
    exercisesCorrect: 6,
    interactionCount: 8,
    correctCount: 6,
    score: 7.5,
    endedAt: "2026-11-06T12:00:00.000Z",
    ...parcial,
  };
}

describe("estado das lições (navegação livre dentro da trilha sequencial)", () => {
  test("sem sessões: lição 1 disponível, restante bloqueada", () => {
    const licoes = estadoDasLicoes([], 0);
    expect(licoes[0].status).toBe("DISPONIVEL");
    expect(licoes[1].status).toBe("BLOQUEADA");
    expect(licoes[9].status).toBe("BLOQUEADA");
  });

  test("uma atividade encerrada NÃO conclui a lição — avanço é explícito", () => {
    const licoes = estadoDasLicoes([sessao({ lessonNumber: 1 })], 0);
    expect(licoes[0].status).toBe("DISPONIVEL"); // ainda não concluída
    expect(licoes[0].praticado).toBeArrayOfSize(1);
    expect(licoes[0].podeAvancar).toBe(true); // pode concluir explicitamente
    expect(licoes[1].status).toBe("BLOQUEADA");
  });

  test("após avanço explícito (progresso=1): lição 1 CONCLUIDA/revisão, lição 2 disponível", () => {
    const licoes = estadoDasLicoes([sessao({ lessonNumber: 1 })], 1);
    expect(licoes[0].status).toBe("CONCLUIDA");
    expect(licoes[0].revisao).toBe(true);
    expect(licoes[1].status).toBe("DISPONIVEL");
  });

  test("sessão em andamento aparece como EM_ANDAMENTO com sessionId para retomar", () => {
    const emCurso = sessao({ lessonNumber: 1, status: "EM_ANDAMENTO" });
    const licoes = estadoDasLicoes([emCurso], 0);
    expect(licoes[0].status).toBe("EM_ANDAMENTO");
    expect(licoes[0].emAndamento?.sessionId).toBe(emCurso.sessionId);
    expect(licoes[0].emAndamento?.mode).toBe("completar");
  });

  test("múltiplas sessões do mesmo modo agregam (melhor nota, vezes praticado)", () => {
    const licoes = estadoDasLicoes(
      [
        sessao({ lessonNumber: 1, mode: "jogo", exercisesTotal: 10, exercisesCorrect: 5, score: 5 }),
        sessao({ lessonNumber: 1, mode: "jogo", exercisesTotal: 10, exercisesCorrect: 8, score: 8 }),
        sessao({ lessonNumber: 1, mode: "conversa", exercisesTotal: 0, exercisesCorrect: 0, score: 8.5 }),
      ],
      0
    );
    const jogo = licoes[0].praticado.find((p) => p.mode === "jogo");
    expect(jogo?.vezes).toBe(2);
    expect(jogo?.percentual).toBe(80); // melhor
    expect(jogo?.nota).toBe(8);
    const conversa = licoes[0].praticado.find((p) => p.mode === "conversa");
    expect(conversa?.percentual).toBeNull(); // conversa não tem %
  });
});

describe("podeAbrirLicao — revisitar é permitido", () => {
  test("lição bloqueada não abre; disponível, em andamento e concluída abrem", () => {
    const licoes = estadoDasLicoes([sessao({ lessonNumber: 1 })], 1); // l1 concluída, l2 disponível
    expect(podeAbrirLicao(1, licoes)).toBe(true); // revisão
    expect(podeAbrirLicao(2, licoes)).toBe(true); // próxima
    expect(podeAbrirLicao(3, licoes)).toBe(false); // bloqueada
    expect(podeAbrirLicao(99, licoes)).toBe(false); // inexistente
  });
});

describe("podeConcluirLicao — validação do avanço explícito", () => {
  test("requer pelo menos uma atividade encerrada na lição da vez", () => {
    const r = podeConcluirLicao(1, [], 0);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain("Pratique pelo menos uma atividade");
  });

  test("só a próxima lição da trilha pode ser concluída", () => {
    const r = podeConcluirLicao(3, [sessao({ lessonNumber: 3 })], 1);
    expect(r.ok).toBe(false);
  });

  test("próxima lição com atividade encerrada → ok", () => {
    const r = podeConcluirLicao(1, [sessao({ lessonNumber: 1 })], 0);
    expect(r.ok).toBe(true);
  });

  test("lição já concluída não pode ser concluída de novo", () => {
    const r = podeConcluirLicao(1, [sessao({ lessonNumber: 1 })], 1);
    expect(r.ok).toBe(false);
  });
});
