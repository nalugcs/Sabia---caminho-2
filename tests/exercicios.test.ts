import { afterEach, describe, expect, mock, test } from "bun:test";

// db nunca é tocado pelos testes de geração, mas providers.ts o importa
mock.module("@/lib/db", () => ({ db: { incidentLog: { create: async () => ({}) } } }));

const { extrairJSON, gerarLoteExercicios, fallbackLocalExercicios } = await import("../src/lib/ai/exercicios");
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GROQ_API_KEY;
});

const CTX = {
  idioma: "Francês",
  aula: 1,
  nivel: "Básico",
  nivelCEFR: "A2",
  diretivaNivel: "Reduza o português.",
  tema: "Présentation personnelle",
  objetivo: "Aprender a se apresentar usando frases simples.",
  conteudo: ["Salutations", "Nom", "Âge", "Nationalité", "Phrases com Je suis"],
  conteudoAnterior: [],
  modo: "completar",
};

describe("extração de JSON da resposta da IA", () => {
  test("JSON puro", () => {
    const r = extrairJSON('{"exercicios":[{"tipo":"multipla"}]}');
    expect((r as Record<string, unknown>).exercicios).toBeArrayOfSize(1);
  });

  test("JSON cercado de markdown e texto", () => {
    const r = extrairJSON('Aqui está:\n```json\n{"exercicios":[{"tipo":"digitada"}]}\n```\nBons estudos!');
    expect((r as Record<string, unknown>).exercicios).toBeArrayOfSize(1);
  });

  test("texto sem JSON → null", () => {
    expect(extrairJSON("A IA se recusou a gerar JSON")).toBeNull();
  });
});

describe("lote da IA validado (uma alternativa correta, tipos aceitos)", () => {
  test("resposta JSON bem-formada é usada e o gabarito pertence às alternativas", async () => {
    process.env.GOOGLE_API_KEY = "teste";
    const payload = JSON.stringify({
      exercicios: [
        { tipo: "multipla", dificuldade: "facil", enunciado: "Qual está correta?", alternativas: ["Je suis Ana", "Je est Ana", "Me suis Ana"], gabarito: "Je suis Ana", dica: "verbo être", explicacao: "Je + suis." },
        { tipo: "digitada", dificuldade: "medio", enunciado: "Complete: Je ______ brésilienne.", gabarito: "suis", tolerancias: ["Suis"], dica: "verbo ser", explicacao: "être → suis" },
      ],
    });
    globalThis.fetch = mock(async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: payload }] } }] })
    ) as unknown as typeof fetch;

    const { exercicios, provedor } = await gerarLoteExercicios(CTX as never, 2, "completar");
    expect(provedor).toBe("google");
    expect(exercicios).toBeArrayOfSize(2);
    expect(exercicios[0].gabarito).toBe("Je suis Ana");
    if (exercicios[0].alternativas) {
      expect(exercicios[0].alternativas).toContain("Je suis Ana");
      expect(exercicios[0].alternativas).toBeArrayOfSize(3);
    }
  });

  test("IA devolve lixo → fallback local sem quebrar a atividade", async () => {
    process.env.GOOGLE_API_KEY = "teste";
    globalThis.fetch = mock(async () => Response.json({ candidates: [{ content: { parts: [{ text: "desculpe, não sei" }] } }] })) as unknown as typeof fetch;
    const { exercicios, provedor } = await gerarLoteExercicios(CTX as never, 8, "completar");
    expect(provedor).toBe("local");
    expect(exercicios.length).toBeGreaterThan(0);
  });
});

describe("fallback local — precisão linguística e ancoragem na lição", () => {
  test("FRENCH lesson does NOT produce English sentences (bug reportado: 'Escreva em Inglês' em lição de Francês)", () => {
    const lote = fallbackLocalExercicios(CTX as never, 8, "completar");
    const textos = lote
      .flatMap((e) => [e.enunciado, ...(e.alternativas || []), ...(e.palavras || []), e.gabarito])
      .join(" ");
    // o banco francês não contém essas marcações em inglês
    expect(textos).not.toContain("I am");
    expect(textos).not.toContain("My name");
    expect(textos).toContain("Je");
  });

  test("respeita a quantidade pedada e varia os tipos de mecânica", () => {
    const lote = fallbackLocalExercicios(CTX as never, 8, "completar");
    expect(lote.length).toBeLessThanOrEqual(8);
    const tipos = new Set(lote.map((e) => e.tipo));
    expect(tipos.size).toBeGreaterThanOrEqual(2); // alterna modalidades (seleção/construção/digitação/associação)
    for (const e of lote) {
      expect(["multipla", "digitada", "ordenar", "associar"]).toContain(e.tipo);
    }
  });

  test("múltipla escolha: gabarito está entre as alternativas e há exatamente UMA correta", () => {
    const lote = fallbackLocalExercicios(CTX as never, 8, "completar");
    for (const e of lote.filter((x) => x.tipo === "multipla")) {
      expect(e.alternativas).toBeDefined();
      expect(e.alternativas!).toContain(e.gabarito);
      const erradas = e.alternativas!.filter((a) => a !== e.gabarito);
      expect(erradas.length).toBeGreaterThanOrEqual(2);
      // alternativas erradas realmente diferem do gabarito
      for (const errada of erradas) expect(errada).not.toBe(e.gabarito);
    }
  });

  test("ordenar: o banco de palavras contém exatamente as palavras do gabarito", () => {
    const lote = fallbackLocalExercicios(CTX as never, 8, "jogo");
    for (const e of lote.filter((x) => x.tipo === "ordenar")) {
      const doGabarito = e.gabarito.split(/\s+/).filter(Boolean).sort();
      const doBanco = [...e.palavras!].sort();
      expect(doBanco).toEqual(doGabarito);
    }
  });

  test("progressão de dificuldade: começa fácil e não termina fácil", () => {
    const lote = fallbackLocalExercicios(CTX as never, 8, "jogo");
    const peso = { facil: 0, medio: 1, dificil: 2 } as const;
    for (let i = 1; i < lote.length; i++) {
      expect(peso[lote[i].dificuldade]).toBeGreaterThanOrEqual(peso[lote[i - 1].dificuldade]);
    }
  });

  test("associar tem no mínimo 2 pares e o gabarito é o mapeamento nomeado (formato da rota)", () => {
    const lote = fallbackLocalExercicios(CTX as never, 10, "jogo");
    for (const e of lote.filter((x) => x.tipo === "associar")) {
      const gabarito = JSON.parse(e.gabarito) as { esq: string; dir: string }[];
      expect(gabarito.length).toBeGreaterThanOrEqual(2);
      for (const par of gabarito) {
        expect(typeof par.esq).toBe("string");
        expect(typeof par.dir).toBe("string");
      }
      expect(e.pares).toBeArrayOfSize(gabarito.length);
    }
  });
});
