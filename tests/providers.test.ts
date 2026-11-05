import { afterEach, expect, mock, test } from "bun:test";

mock.module("@/lib/db", () => ({ db: { incidentLog: { create: async () => ({}) } } }));
const { gerarTexto } = await import("../src/lib/ai/providers");
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GROQ_API_KEY;
});

test("Gemini is the primary provider", async () => {
  process.env.GOOGLE_API_KEY = "google-test";
  process.env.GROQ_API_KEY = "groq-test";
  const calls: string[] = [];
  globalThis.fetch = mock(async (url, options) => {
    calls.push(String(url));
    expect(new Headers(options?.headers).get("x-goog-api-key")).toBe("google-test");
    return Response.json({ candidates: [{ content: { parts: [{ text: "Olá!" }] } }] });
  }) as unknown as typeof fetch;
  const response = await gerarTexto("teste");
  expect(response.provedor).toBe("google");
  expect(response.texto).toBe("Olá!");
  expect(calls).toHaveLength(1);
});

test("Groq is used when Gemini is not configured", async () => {
  process.env.GROQ_API_KEY = "groq-test";
  globalThis.fetch = mock(async (url, options) => {
    expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer groq-test");
    return Response.json({ choices: [{ message: { content: "Bonjour!" } }] });
  }) as unknown as typeof fetch;
  const response = await gerarTexto("teste");
  expect(response.provedor).toBe("groq");
  expect(response.texto).toBe("Bonjour!");
});

test("Groq takes over after Gemini fails", async () => {
  process.env.GOOGLE_API_KEY = "google-test";
  process.env.GROQ_API_KEY = "groq-test";
  let googleCalls = 0;
  globalThis.fetch = mock(async (url) => {
    if (String(url).includes("googleapis.com")) {
      googleCalls++;
      return new Response("unavailable", { status: 503 });
    }
    return Response.json({ choices: [{ message: { content: "Resposta reserva" } }] });
  }) as unknown as typeof fetch;
  const response = await gerarTexto("teste");
  expect(response.provedor).toBe("groq");
  expect(response.texto).toBe("Resposta reserva");
  expect(googleCalls).toBe(3);
}, 10000);
