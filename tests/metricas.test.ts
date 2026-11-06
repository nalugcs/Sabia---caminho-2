import { describe, expect, test } from "bun:test";

const { metricasAtividade, metricasSessao, notaFinalSessao, consolidadoLicao } = await import("../src/lib/metricas");

describe("métricas da atividade — critério de aceite do feedback", () => {
  test("10 questões com 7 corretas → exatamente 70%", () => {
    const exercicios = Array.from({ length: 10 }, (_, i) => ({
      correta: i < 7 ? true : false,
      nota: i < 7 ? 10 : 0,
    }));
    const m = metricasAtividade(exercicios);
    expect(m.total).toBe(10);
    expect(m.acertos).toBe(7);
    expect(m.erros).toBe(3);
    expect(m.percentual).toBe(70); // exato, sem arredondamento espúrio
  });

  test("questões NÃO respondidas não contam como concluídas (incompletas separadas)", () => {
    const exercicios = [
      { correta: true, nota: 10 },
      { correta: false, nota: 0 },
      { correta: null, nota: null }, // abandonada
      { correta: null, nota: null }, // abandonada
    ];
    const m = metricasAtividade(exercicios);
    expect(m.total).toBe(2);
    expect(m.incompletas).toBe(2);
    expect(m.percentual).toBe(50);
  });

  test("nota média ignora questões sem nota e arredonda a 1 casa", () => {
    const m = metricasAtividade([
      { correta: true, nota: 10 },
      { correta: false, nota: 6 },
      { correta: null, nota: null },
    ]);
    expect(m.notaMedia).toBe(8);
  });

  test("atividade vazia → zero, sem divisão por zero", () => {
    const m = metricasAtividade([]);
    expect(m.total).toBe(0);
    expect(m.percentual).toBe(0);
  });
});

describe("métricas da sessão (exercícios vs conversa separadas)", () => {
  test("sessão de exercícios usa contagem determinística, não notas da IA", () => {
    const m = metricasSessao({
      mode: "completar",
      exercisesTotal: 8,
      exercisesCorrect: 6,
      interactionCount: 8,
      correctCount: 6,
      notas: [10, 6, 10, 2, 10, 10, 0, 10], // notas "fuzzy" são ignoradas aqui
    });
    expect(m.tipo).toBe("exercicios");
    expect(m.total).toBe(8);
    expect(m.acertos).toBe(6);
    expect(m.percentual).toBe(75);
    expect(m.notaMedia).toBe(7.5);
  });

  test("sessão de conversa usa interações e notas do tutor (sem certo/errado)", () => {
    const m = metricasSessao({
      mode: "conversa",
      exercisesTotal: 0,
      exercisesCorrect: 0,
      interactionCount: 5,
      correctCount: 3, // 3 interações com nota >= 7
      notas: [8, 6, 9, 5, 7.5],
    });
    expect(m.tipo).toBe("conversa");
    expect(m.total).toBe(5);
    expect(m.acertos).toBe(3);
    expect(m.percentual).toBe(60);
    expect(m.notaMedia).toBe(7.1);
  });

  test("nota final coerente com o que é exibido (exercícios = %/10)", () => {
    const nota = notaFinalSessao({
      mode: "jogo",
      exercisesTotal: 10,
      exercisesCorrect: 7,
      interactionCount: 10,
      correctCount: 7,
      notas: [],
    });
    expect(nota).toBe(7);
  });
});

describe("consolidado da lição (múltiplas atividades)", () => {
  test("agrega sessões encerradas com média dos percentuais e melhor nota", () => {
    const c = consolidadoLicao([
      { mode: "completar", exercisesTotal: 8, exercisesCorrect: 4, interactionCount: 8, correctCount: 4, notas: [] },
      { mode: "jogo", exercisesTotal: 10, exercisesCorrect: 9, interactionCount: 10, correctCount: 9, notas: [] },
      { mode: "conversa", exercisesTotal: 0, exercisesCorrect: 0, interactionCount: 4, correctCount: 2, notas: [8, 6, 7, 5] },
    ]);
    expect(c.sessoes).toBe(3);
    expect(c.percentualMedio).toBe(70); // (50% + 90%) / 2 — conversa não entra na média de %
    expect(c.totalExercicios).toBe(18);
    expect(c.totalAcertos).toBe(13);
  });
});
