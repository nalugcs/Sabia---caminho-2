import { describe, expect, test } from "bun:test";

const {
  promptAberturaConversa,
  promptMensagemConversa,
  promptGerarExercicios,
  promptAvaliarDigitada,
  promptFeedbackFinal,
} = await import("../src/lib/ai/prompts");
const { NIVEIS_CEFR, nivelCEFRDeclarado } = await import("../src/lib/cefr");

const CTX_BASE = {
  idioma: "Francês",
  aula: 1,
  nivel: "Básico",
  tema: "Présentation personnelle",
  objetivo: "Aprender a se apresentar.",
  conteudo: ["Salutations", "Nom"],
  modo: "conversa",
};

describe("progressão pedagógica real por nível (CEFR)", () => {
  test("nível 1 → A1 com permissão de português e frases curtas", () => {
    const n = nivelCEFRDeclarado(1);
    expect(n.cefr).toBe("A1");
    expect(n.diretiva).toContain("Explique em português");
    expect(n.diretiva).toContain("Frases curtas");
  });

  test("nível 5 → C1/C2 sem português e com correções refinadas", () => {
    const n = nivelCEFRDeclarado(5);
    expect(n.cefr).toBe("C1/C2");
    expect(n.diretiva).toContain("sem português");
    expect(n.diretiva).toContain("sofisticação");
  });

  test("todos os níveis 1–5 têm CEFR mapeado (A1→C1/C2)", () => {
    expect(NIVEIS_CEFR.map((n) => n.cefr)).toEqual(["A1", "A2", "B1", "B2/C1", "C1/C2"]);
  });

  test("a diretiva do nível declarado ENTRA no prompt da conversa (o rótulo sozinho não muda nada)", () => {
    const cefr = nivelCEFRDeclarado(2);
    const prompt = promptMensagemConversa(
      { ...CTX_BASE, nivelCEFR: cefr.cefr, diretivaNivel: cefr.diretiva },
      "Bonjour",
      []
    );
    expect(prompt).toContain("A2");
    expect(prompt).toContain("Reduza o português"); // diretiva de verdade, não só rótulo
  });
});

describe("conversa natural e contínua (não formulário)", () => {
  test("prompt manda responder no idioma-alvo e corrigir de forma breve integrada", () => {
    const prompt = promptMensagemConversa(CTX_BASE, "Estou bem", []);
    expect(prompt).toContain("conversa NATURAL");
    expect(prompt).toContain("corrija de forma curta e inline");
    expect(prompt).toContain("Francês");
    expect(prompt).toContain("[NOTA:");
  });

  test("se o aluno escreve em português, a IA mostra a forma no idioma e continua", () => {
    const prompt = promptMensagemConversa(CTX_BASE, "eu gosto de café", []);
    expect(prompt).toContain("escrever em português");
    expect(prompt).toContain("continue a conversa");
  });

  test("histórico entra no prompt (memória de contexto) e proíbe perguntas repetidas", () => {
    const historico = [
      { role: "ALUNO", content: "Je m'appelle Ana" },
      { role: "PROFESSORA", content: "Comment tu t'appelles ?" },
    ];
    const prompt = promptMensagemConversa(CTX_BASE, "J'ai trente ans", historico);
    expect(prompt).toContain("Je m'appelle Ana");
    expect(prompt).toContain("Não repita perguntas");
  });

  test("conteúdos anteriores entram para consistência entre lições", () => {
    const prompt = promptMensagemConversa(
      { ...CTX_BASE, conteudoAnterior: ["Cumprimentos básicos"] },
      "Salut",
      []
    );
    expect(prompt).toContain("Conteúdos já estudados");
    expect(prompt).toContain("Cumprimentos básicos");
  });
});

describe("regras de precisão linguística (bug do 'j'ai')", () => {
  test("presentes em todos os prompts geradores", () => {
    const abertura = promptAberturaConversa(CTX_BASE);
    const exercicios = promptGerarExercicios({ ...CTX_BASE, modo: "completar" }, 8, "completar");
    const avaliacao = promptAvaliarDigitada(CTX_BASE, { enunciado: "e", gabarito: "g", tolerancias: [], resposta: "r" });
    const feedback = promptFeedbackFinal(CTX_BASE, [], { descricao: "x" });
    for (const p of [abertura, exercicios, avaliacao, feedback]) {
      expect(p).toContain("Verifique conjugações");
      expect(p).toContain("Nunca afirme algo que dependa de contexto como absoluto");
    }
  });

  test("prompt de exercícios exige UMA alternativa correta sem ambiguidade e ancoragem no conteúdo", () => {
    const p = promptGerarExercicios({ ...CTX_BASE, modo: "completar" }, 8, "completar");
    expect(p).toContain("exatamente UMA alternativa correta");
    expect(p).toContain("nada de conteúdo desconectado");
    expect(p).toContain("tolerancias");
    expect(p).toContain("dificuldade");
  });
});

describe("feedback final coerente com as métricas exibidas", () => {
  test("as métricas oficiais entram no prompt e a IA não pode inventar números", () => {
    const p = promptFeedbackFinal(CTX_BASE, [], { descricao: "- Acertos: 7 de 10 (70%)" });
    expect(p).toContain("Acertos: 7 de 10 (70%)");
    expect(p).toContain("não invente nem contradiga");
  });
});
