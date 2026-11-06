import { afterEach, describe, expect, test } from "bun:test";

const { pinCorreto, permitir } = await import("../src/lib/security");

describe("PIN timing-safe", () => {
  test("aceita PIN correto", () => {
    expect(pinCorreto("segredo-longa", "segredo-longa")).toBe(true);
  });

  test("rejeita PIN errado", () => {
    expect(pinCorreto("segredo-longa", "outra-coisa")).toBe(false);
  });

  test("rejeita quando esperado é vazio (RESEARCHER_PIN ausente)", () => {
    expect(pinCorreto("qualquer", "")).toBe(false);
    expect(pinCorreto("", "")).toBe(false);
  });

  test("rejeita entradas gigantes sem lançar erro", () => {
    const gigante = "x".repeat(10_000);
    expect(pinCorreto(gigante, "curto")).toBe(false);
    expect(pinCorreto("curto", gigante)).toBe(false);
  });
});

describe("rate limit", () => {
  afterEach(() => {
    // janelas são por IP; usa IP diferente por teste para isolamento
  });

  test("permite até o máximo e bloqueia além dele", () => {
    const ip = `teste-1-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(permitir(ip, 5)).toBe(true);
    expect(permitir(ip, 5)).toBe(false);
    expect(permitir(ip, 5)).toBe(false);
  });

  test("IPs diferentes têm janelas independentes", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(permitir(a, 5)).toBe(true);
    expect(permitir(a, 5)).toBe(false);
    expect(permitir(b, 5)).toBe(true);
  });
});
