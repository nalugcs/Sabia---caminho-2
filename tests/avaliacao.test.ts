import { describe, expect, test } from "bun:test";

const {
  normalizar,
  equivalentes,
  respostaDigitadaCorreta,
  respostaSelecaoCorreta,
  respostaOrdenacaoCorreta,
  respostaAssociacaoCorreta,
} = await import("../src/lib/avaliacao");

describe("normalização de respostas", () => {
  test("ignora caixa, acentos, pontuação e espaços extras", () => {
    expect(normalizar("J'ai trente ans.")).toBe(normalizar("j ai trente ans"));
    expect(normalizar("  ¿Cómo   estás? ")).toBe(normalizar("como estas"));
    expect(normalizar("Très bien !")).toBe(normalizar("tres bien"));
  });

  test("apóstrofo tipográfico equivale ao reto (francês)", () => {
    expect(normalizar("J’aime le café")).toBe(normalizar("j'aime le cafe"));
  });
});

describe("resposta digitada — aceita variações linguisticamente corretas", () => {
  test("gabarito exato com pontuação diferente é CORRETO", () => {
    expect(respostaDigitadaCorreta("Je suis brésilienne.", "Je suis brésilienne")).toBe(true);
  });

  test("tolerâncias (elisão/contrato) são aceitas", () => {
    expect(respostaDigitadaCorreta("J'ai trente ans", "Je ai trente ans", ["J'ai trente ans"])).toBe(true);
    expect(respostaDigitadaCorreta("il y a", "il y a", ["il ya", "ilya"])).toBe(true);
  });

  test("resposta com erro real de vocabulário é INCORRETA", () => {
    expect(respostaDigitadaCorreta("Je suis française", "Je suis brésilienne")).toBe(false);
  });

  test("resposta vazia nunca é correta", () => {
    expect(respostaDigitadaCorreta("", "algo")).toBe(false);
  });
});

describe("seleção (múltipla escolha)", () => {
  test("compara alternativa escolhida com o gabarito exato", () => {
    expect(respostaSelecaoCorreta("Je m'appelle Ana.", "Je m'appelle Ana.")).toBe(true);
    expect(respostaSelecaoCorreta("Me j'appelle Ana.", "Je m'appelle Ana.")).toBe(false);
  });
});

describe("ordenação de palavras", () => {
  test("sequência correta após normalizar", () => {
    expect(respostaOrdenacaoCorreta(["Je", "suis", "brésilienne"], "Je suis brésilienne.")).toBe(true);
    expect(respostaOrdenacaoCorreta(["suis", "Je", "brésilienne"], "Je suis brésilienne.")).toBe(false);
  });

  test("palavra faltante é INCORRETA", () => {
    expect(respostaOrdenacaoCorreta(["Je", "suis"], "Je suis brésilienne")).toBe(false);
  });
});

describe("associação de pares", () => {
  const gabarito = [
    { esq: "Bonjour", dir: "Olá" },
    { esq: "Merci", dir: "Obrigado" },
    { esq: "Au revoir", dir: "Tchau" },
  ];

  test("pares completos em qualquer ordem é CORRETO", () => {
    const resposta = [
      { esq: "Merci", dir: "Obrigado" },
      { esq: "Bonjour", dir: "Olá" },
      { esq: "Au revoir", dir: "Tchau" },
    ];
    expect(respostaAssociacaoCorreta(resposta, gabarito)).toBe(true);
  });

  test("um par trocado é INCORRETO", () => {
    const resposta = [
      { esq: "Bonjour", dir: "Obrigado" }, // trocado
      { esq: "Merci", dir: "Olá" }, // trocado
      { esq: "Au revoir", dir: "Tchau" },
    ];
    expect(respostaAssociacaoCorreta(resposta, gabarito)).toBe(false);
  });

  test("parcial (menos pares) é INCORRETO", () => {
    expect(respostaAssociacaoCorreta(gabarito.slice(0, 2), gabarito)).toBe(false);
  });
});
