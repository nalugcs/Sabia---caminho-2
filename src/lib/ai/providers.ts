// Camada de provedores de IA: Gemini → Groq → resposta local.

import { Semaphoro, comRetry, comTimeout } from "./semaphore";
import { db } from "@/lib/db";

export type ProvedorId = "google" | "groq" | "local";

export interface RespostaIA {
  texto: string;
  provedor: ProvedorId;
  latencyMs: number;
}

const semaforo = new Semaphoro(2);
const TIMEOUT_MS = 45000;

async function registrarIncidente(type: string, provider: string, detail: string) {
  try {
    await db.incidentLog.create({ data: { type, provider, detail: detail.slice(0, 500) } });
  } catch {
    // log de incidente nunca derruba o fluxo do aluno
  }
}

// ---------- Provedor 1: Google Gemini (via REST, se GOOGLE_API_KEY existir) ----------
async function chamarGoogle(prompt: string): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY ausente");
  const model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
      }),
    }
  );
  if (!resp.ok) throw new Error(`Google HTTP ${resp.status}`);
  const json = await resp.json();
  const partes = json?.candidates?.[0]?.content?.parts;
  const texto = Array.isArray(partes)
    ? partes.map((p: { text?: string }) => p.text || "").join("")
    : "";
  if (!texto.trim()) throw new Error("Google retornou vazio");
  return texto;
}

// ---------- Provedor 2: Groq via API REST ----------
async function chamarGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY ausente");
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_completion_tokens: 1400,
    }),
  });
  if (!resp.ok) throw new Error(`Groq HTTP ${resp.status}`);
  const json = await resp.json();
  const texto = json?.choices?.[0]?.message?.content || "";
  if (!texto.trim()) throw new Error("Groq retornou vazio");
  return texto;
}

// ---------- Provedor 3: fallback local determinístico ----------
export function fallbackLocal(prompt: string): string {
  const limpo = prompt.replace(/\s+/g, " ");
  const pegar = (rotulo: string): string => {
    const m = limpo.match(new RegExp(`${rotulo}:\\s*([^:]+?)(?=\\s+(?:Nível|Tema|Objetivo|Modo|Conteúdos|Histórico|Mensagem|Contexto|Regras|Formato)|$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const idioma = pegar("O aluno está aprendendo") || "Inglês";
  const tema = pegar("Tema da aula") || "prática do idioma";
  const conteudoMatch = limpo.match(/Conteúdos esperados nesta aula:\s*([^.]+)\./i);
  const topicos = conteudoMatch
    ? conteudoMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];
  const isInicio = /Início da aula|apresente a aula/i.test(limpo);
  const isFinal = /feedback final da aula/i.test(limpo);
  const mensagemMatch = limpo.match(/Mensagem do aluno:\s*(.+?)\s*Regras:/i);
  const mensagem = mensagemMatch ? mensagemMatch[1].trim() : "";
  const modo = pegar("Modo de aprendizagem") || "conversa";

  // nota heurística: presença de tópicos/idioma na resposta do aluno
  let nota = 6;
  const minuscula = mensagem.toLowerCase();
  if (topicos.some((t: string) => minuscula.includes(t.toLowerCase().split(" ")[0]))) nota = 8;
  if (mensagem.length < 12) nota = 5;

  if (isFinal) {
    return [
      "Resumo do desempenho: você percorreu a lição com participação ativa e respondeu aos exercícios propostos.",
      "Principais acertos: uso do vocabulário do tema e conclusão das atividades.",
      "Principais erros: pontos de vocabulário e estrutura que merecem revisão.",
      `Vocabulário praticado: ${topicos.slice(0, 4).join(", ") || tema}.`,
      "Gramática para revisar: estruturas trabalhadas nesta lição.",
      `Nota final: ${nota}.`,
      nota >= 7 ? "Você pode avançar para a próxima lição." : "Vale repetir esta lição antes de avançar.",
      "Recomendação: releia o vocabulário antes da próxima aula.",
    ].join("\n");
  }

  if (isInicio) {
    const exercicio =
      modo === "completar" || modo === "jogo"
        ? `Complete: escolha a alternativa correta.\n1) ${topicos[0] || "frase do tema"}\n2) ${topicos[1] || "variação"}\n3) ${topicos[2] || "outra variação"}\nGABARITO: 1`
        : `Escreva em ${idioma} uma frase sobre "${tema}" usando: ${topicos[0] || "o vocabulário da lição"}.`;
    return [
      `Olá! Hoje vamos trabalhar o tema "${tema}".`,
      `Objetivo: praticar ${topicos.slice(0, 3).join(", ") || tema} em ${idioma}.`,
      "Correção: ainda não há resposta sua para corrigir — vamos começar!",
      "Explicação: nesta lição você escreve e eu corrijo com calma, explicando em português.",
      `Exemplo: frase modelo com "${topicos[0] || tema}".`,
      "Nota: —",
      `Próximo exercício: ${exercicio}`,
    ].join("\n");
  }

  return [
    `Correção: sua frase está compreensível; ajuste a estrutura e o vocabulário de "${tema}".`,
    `Explicação: em ${idioma}, observe como o termo "${topicos[0] || tema}" é usado no contexto da lição.`,
    `Exemplo: uso natural de "${topicos[0] || tema}" em uma frase do dia a dia.`,
    `Nota: ${nota}`,
    `Próximo exercício: escreva outra frase sobre "${tema}" usando ${topicos[1] || topicos[0] || "o vocabulário da lição"}.`,
  ].join("\n");
}

// ---------- Orquestração com degradação controlada ----------
export async function gerarTexto(prompt: string): Promise<RespostaIA> {
  const inicio = Date.now();
  const liberar = await semaforo.acquire();
  try {
    // 1) Google (se configurado)
    if (process.env.GOOGLE_API_KEY) {
      try {
        const texto = await comRetry(() => comTimeout(chamarGoogle(prompt), TIMEOUT_MS));
        return { texto, provedor: "google", latencyMs: Date.now() - inicio };
      } catch (e) {
        await registrarIncidente("PROVIDER_FALLBACK", "google", String(e));
      }
    }
    // 2) Groq, se configurado
    if (process.env.GROQ_API_KEY) {
      try {
        const texto = await comRetry(() => comTimeout(chamarGroq(prompt), TIMEOUT_MS));
        return { texto, provedor: "groq", latencyMs: Date.now() - inicio };
      } catch (e) {
        await registrarIncidente("PROVIDER_FALLBACK", "groq", String(e));
      }
    }
    // 3) Fallback local — a lição nunca para
    const texto = fallbackLocal(prompt);
    return { texto, provedor: "local", latencyMs: Date.now() - inicio };
  } finally {
    liberar();
  }
}
