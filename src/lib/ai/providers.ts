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
async function chamarGoogle(prompt: string, temperatura: number): Promise<string> {
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
        generationConfig: { temperature: temperatura, maxOutputTokens: 1400 },
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
async function chamarGroq(prompt: string, temperatura: number): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY ausente");
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: temperatura,
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
  // Extração por linha (o prompt novo usa "campo: valor" por linha) — o parser
  // antigo por lookahead quebrava e trocava o idioma ("Inglês" em lição de Francês).
  const linha = (rotulo: string): string => {
    const m = prompt.match(new RegExp(`^${rotulo}:\\s*(.+)$`, "mi"));
    return m ? m[1].trim().replace(/[.]+$/, "") : "";
  };
  const idioma = linha("Idioma estudado") || "Inglês";
  const tema = linha("Tema da lição") || "prática do idioma";
  const conteudos = linha("Conteúdos desta lição");
  const topicos = conteudos
    ? conteudos.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];
  const nivelCEFR = linha("Nível do aluno").replace(/\..*$/, "").trim() || "";
  const ehA1 = nivelCEFR.startsWith("A1");

  const isAbertura = /Abra a conversa desta lição/.test(prompt);
  const isFinal = /Gere o feedback final desta atividade/.test(prompt);
  const ehDica = /pediu uma DICA/.test(prompt);

  // mensagem do aluno: entre "Mensagem do aluno:" e a próxima seção
  const mMsg = prompt.match(/Mensagem do aluno:\n([\s\S]*?)\n\nComo responder/);
  const mensagem = mMsg ? mMsg[1].trim() : "";
  const minuscula = mensagem.toLowerCase();

  // nota heurística: presença de tópicos/idioma na resposta do aluno
  let nota = 6;
  if (topicos.some((t: string) => minuscula.includes(t.toLowerCase().split(" ")[0]))) nota = 8;
  if (mensagem.length < 12) nota = 5;

  // Saudações/frases de continuação por idioma — sempre linguisticamente corretas
  const saudacao: Record<string, string> = {
    Frances: "Bonjour !",
    Francês: "Bonjour !",
    Ingles: "Hello!",
    Inglês: "Hello!",
    Espanhol: "¡Hola!",
  };
  const perguntas: Record<string, string[]> = {
    Frances: [`Comment tu t'appelles ?`, `Qu'est-ce que tu aimes faire ?`, `Comment ça va aujourd'hui ?`],
    Francês: [`Comment tu t'appelles ?`, `Qu'est-ce que tu aimes faire ?`, `Comment ça va aujourd'hui ?`],
    Ingles: ["What is your name?", "What do you like to do?", "How are you today?"],
    Inglês: ["What is your name?", "What do you like to do?", "How are you today?"],
    Espanhol: ["¿Cómo te llamas?", "¿Qué te gusta hacer?", "¿Cómo estás hoy?"],
  };
  const chave = Object.keys(saudacao).find((k) => idioma.toLowerCase().includes(k.toLowerCase().slice(0, 5)));
  const oi = chave ? saudacao[chave] : "Hello!";
  const elogio = chave && chave.toLowerCase().startsWith("fran") ? "Très bien !" : chave && chave.toLowerCase().startsWith("espan") ? "¡Muy bien!" : "Very good!";
  const bancoPerguntas = chave ? perguntas[chave] : perguntas.Ingles;
  // pergunta que ainda não foi feita no histórico (conta ocorrências)
  const historicoTrecho = (prompt.match(/Histórico recente da conversa:\n([\s\S]*?)\n\nMensagem do aluno/) || [])[1] || "";
  const pergunta = bancoPerguntas.find((p) => !historicoTrecho.includes(p)) || bancoPerguntas[0];

  if (ehDica) {
    const dicaTopico = topicos[0] || tema;
    return ehA1
      ? `Lembre o vocabulário da lição: "${dicaTopico}". Tente formar uma frase curta com ele.\n[NOTA: —]`
      : `Pense no vocabulário da lição ("${dicaTopico}") e na estrutura que usamos — tente formar a frase com ele.\n[NOTA: —]`;
  }

  if (isFinal) {
    const metricas = (prompt.match(/Métricas oficiais medidas pelo aplicativo[^\n]*\n([\s\S]*?)\n\nHistórico/) || [])[1] || "";
    return [
      "Resumo do desempenho: você percorreu a atividade com participação ativa.",
      metricas ? `Seus números nesta atividade: ${metricas.replace(/\n/g, " ").trim()}.` : "",
      `Principais acertos: uso do vocabulário do tema (${topicos.slice(0, 3).join(", ") || tema}).`,
      "Para reforçar: revise as estruturas trabalhadas nesta lição antes de avançar.",
      nota >= 7 || metricas.includes("70") || /([8-9]|100)%/.test(metricas)
        ? "Você pode avançar para a próxima atividade."
        : "Vale repetir esta atividade antes de avançar.",
      "Recomendação: releia o vocabulário da lição e pratique mais um modo.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (isAbertura) {
    const abertura = ehA1
      ? `${oi} Bem-vindo(a) à lição sobre "${tema}". (Olá! Bem-vindo à lição sobre ${tema}.) Vamos conversar — ${pergunta}`
      : `${oi} Hoje vamos falar sobre "${tema}". ${pergunta}`;
    return `${abertura}\n[NOTA: —]`;
  }

  // Resposta de conversa: continuação natural + correção breve integrada.
  // Heurística simples de "escreveu em português": muitas palavras com acento/cedilha
  // e nenhuma palavra típica do idioma estudado presente nos tópicos.
  const usouTopico = topicos.some((t: string) => minuscula.includes(t.toLowerCase().split(" ")[0]));
  const parecePT = /[àáâãéêíóôõúç]|\b(eu|não|muito|obrigad|tudo bem)\b/i.test(mensagem);
  const topico = topicos.find((t) => minuscula.includes(t.toLowerCase().split(" ")[0])) || topicos[0] || tema;
  const resposta = ehA1
    ? `${elogio} Em ${idioma}, você pode dizer isso com outras palavras — use o vocabulário da lição ("${topico}"). ${pergunta}`
    : parecePT && !usouTopico
      ? `Boa tentativa! Em ${idioma}, experimente dizer isso assim: use "${topico}" na frase. ${pergunta}`
      : `Muito bem! Continue — conte mais com as palavras que aprendemos ("${topico}"). ${pergunta}`;
  return `${resposta}\n[NOTA: ${nota}]`;
}

// ---------- Orquestração com degradação controlada ----------
export interface OpcoesGeracao {
  temperatura?: number;
}

export async function gerarTexto(prompt: string, opts: OpcoesGeracao = {}): Promise<RespostaIA> {
  const temperatura = opts.temperatura ?? 0.7;
  const inicio = Date.now();
  const liberar = await semaforo.acquire();
  try {
    // 1) Google (se configurado)
    if (process.env.GOOGLE_API_KEY) {
      try {
        const texto = await comRetry(() => comTimeout(chamarGoogle(prompt, temperatura), TIMEOUT_MS));
        return { texto, provedor: "google", latencyMs: Date.now() - inicio };
      } catch (e) {
        await registrarIncidente("PROVIDER_FALLBACK", "google", String(e));
      }
    }
    // 2) Groq, se configurado
    if (process.env.GROQ_API_KEY) {
      try {
        const texto = await comRetry(() => comTimeout(chamarGroq(prompt, temperatura), TIMEOUT_MS));
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
