// Geração de lotes de exercícios — IA (JSON estrito) com fallback local
// determinístico e linguisticamente correto. O gabarito fica no servidor;
// o cliente só recebe alternativas/palavras/colunas embaralhadas.
// Feedback da autora (nov/2026): mecânicas variadas, progressão de
// dificuldade e precisão linguística como requisito fundamental.

import { gerarTexto } from "./providers";
import { promptGerarExercicios, type ContextoAula, type TipoExercicio } from "./prompts";
import { embaralhar } from "@/lib/avaliacao";

export interface ExercicioGerado {
  tipo: TipoExercicio;
  dificuldade: "facil" | "medio" | "dificil";
  enunciado: string;
  alternativas?: string[]; // multipla (embaralhadas)
  palavras?: string[]; // ordenar: banco de palavras (embaralhado)
  pares?: [string, string][]; // associar
  gabarito: string; // multipla/digitada/ordenar: texto; associar: JSON dos pares
  tolerancias?: string[];
  dica: string;
  explicacao: string;
}

const DIFICULDADES = ["facil", "medio", "dificil"] as const;

// ---------- Extração robusta de JSON ----------

export function extrairJSON(texto: string): unknown {
  const semCerca = texto
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(semCerca);
  } catch {
    // tenta entre a primeira "{" e a última "}"
    const ini = semCerca.indexOf("{");
    const fim = semCerca.lastIndexOf("}");
    if (ini !== -1 && fim > ini) {
      try {
        return JSON.parse(semCerca.slice(ini, fim + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function dificuldadeValida(d: unknown): d is ExercicioGerado["dificuldade"] {
  return typeof d === "string" && (DIFICULDADES as readonly string[]).includes(d);
}

/** Normaliza/valida um exercício vindo da IA; null se inválido. */
function validarExercicio(bruto: Record<string, unknown>): ExercicioGerado | null {
  const tipo = bruto.tipo;
  if (tipo !== "multipla" && tipo !== "digitada" && tipo !== "ordenar" && tipo !== "associar") return null;
  const enunciado = typeof bruto.enunciado === "string" ? bruto.enunciado.trim() : "";
  if (!enunciado) return null;
  const dificuldade = dificuldadeValida(bruto.dificuldade) ? bruto.dificuldade : "medio";
  const dica = typeof bruto.dica === "string" && bruto.dica.trim() ? bruto.dica.trim() : "Releia o conteúdo da lição e tente de novo.";
  const explicacao =
    typeof bruto.explicacao === "string" && bruto.explicacao.trim()
      ? bruto.explicacao.trim()
      : "Esta é a forma correta segundo o conteúdo da lição.";

  if (tipo === "multipla") {
    const alts = Array.isArray(bruto.alternativas)
      ? bruto.alternativas.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
      : [];
    const gab = typeof bruto.gabarito === "string" ? bruto.gabarito.trim() : "";
    if (alts.length < 2 || !gab || !alts.some((a) => a.trim() === gab)) return null;
    return { tipo, dificuldade, enunciado, alternativas: embaralhar(alts), gabarito: gab, dica, explicacao };
  }
  if (tipo === "digitada") {
    const gab = typeof bruto.gabarito === "string" ? bruto.gabarito.trim() : "";
    if (!gab) return null;
    const tol = Array.isArray(bruto.tolerancias)
      ? bruto.tolerancias.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      : [];
    return { tipo, dificuldade, enunciado, gabarito: gab, tolerancias: tol, dica, explicacao };
  }
  if (tipo === "ordenar") {
    const gab = typeof bruto.gabarito === "string" ? bruto.gabarito.trim() : "";
    let palavras = Array.isArray(bruto.palavras)
      ? bruto.palavras.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      : [];
    if (!gab) return null;
    if (palavras.length === 0) {
      palavras = gab.split(/\s+/).filter(Boolean);
    }
    return { tipo, dificuldade, enunciado, palavras: embaralhar(palavras), gabarito: gab, dica, explicacao };
  }
  // associar
  const paresBrutos = Array.isArray(bruto.pares) ? bruto.pares : [];
  const pares: [string, string][] = [];
  for (const p of paresBrutos) {
    if (Array.isArray(p) && p.length === 2 && typeof p[0] === "string" && typeof p[1] === "string" && p[0].trim() && p[1].trim()) {
      pares.push([p[0].trim(), p[1].trim()]);
    }
  }
  if (pares.length < 2) return null;
  // gabarito normalizado como pares nomeados ({esq, dir}) — mesmo formato que a rota de resposta espera
  return { tipo, dificuldade, enunciado, pares, gabarito: JSON.stringify(pares.map(([esq, dir]) => ({ esq, dir }))), dica, explicacao };
}

/** Ordena o lote com progressão de dificuldade (estável dentro da faixa). */
function ordenarProgressao(lote: ExercicioGerado[]): ExercicioGerado[] {
  const peso = { facil: 0, medio: 1, dificil: 2 } as const;
  return [...lote].sort((a, b) => peso[a.dificuldade] - peso[b.dificuldade]);
}

// ---------- Fallback local determinístico (linguisticamente correto) ----------

interface FraseModelo {
  frase: string;
  traducao: string;
  chave: string; // tema com o qual casa
  nivel: "facil" | "medio" | "dificil";
}

const BANCO_FRANCES: FraseModelo[] = [
  { chave: "apresentação|presentation|nom|nome", frase: "Je m'appelle Ana.", traducao: "Eu me chamo Ana.", nivel: "facil" },
  { chave: "apresentação|presentation|nationalité|nacionalidade", frase: "Je suis brésilienne.", traducao: "Eu sou brasileira.", nivel: "facil" },
  { chave: "apresentação|presentation|âge|idade", frase: "J'ai trente ans.", traducao: "Eu tenho trinta anos.", nivel: "facil" },
  { chave: "apresentação|presentation|salutations|cumprimentos", frase: "Bonjour, comment allez-vous ?", traducao: "Olá, como vai a senhora?", nivel: "facil" },
  { chave: "goûts|gosto|preferência|préférence", frase: "J'aime le café.", traducao: "Eu gosto de café.", nivel: "medio" },
  { chave: "famille|família", frase: "J'ai une sœur et un frère.", traducao: "Eu tenho uma irmã e um irmão.", nivel: "medio" },
  { chave: "routine|quotidienne", frase: "Je me réveille à sept heures.", traducao: "Eu acordo às sete horas.", nivel: "medio" },
  { chave: "voyages|viagem|viagens", frase: "Je voudrais un billet pour Paris.", traducao: "Eu gostaria de um bilhete para Paris.", nivel: "medio" },
  { chave: "projets|futur|futuro|planos", frase: "Demain, je vais travailler à la maison.", traducao: "Amanhã, eu vou trabalhar em casa.", nivel: "dificil" },
  { chave: "passé|passado", frase: "Hier, j'ai étudié le français.", traducao: "Ontem, eu estudei francês.", nivel: "dificil" },
  { chave: "opinions|opinião|opinion", frase: "Je pense que c'est une bonne idée.", traducao: "Eu acho que é uma boa ideia.", nivel: "dificil" },
];

const BANCO_INGLES: FraseModelo[] = [
  { chave: "apresentação|introduction|name|nome", frase: "My name is Ana.", traducao: "Meu nome é Ana.", nivel: "facil" },
  { chave: "apresentação|introduction|nationality|nacionalidade", frase: "I am Brazilian.", traducao: "Eu sou brasileira.", nivel: "facil" },
  { chave: "apresentação|introduction|age|idade", frase: "I am thirty years old.", traducao: "Eu tenho trinta anos.", nivel: "facil" },
  { chave: "apresentação|introduction|greetings|cumprimentos", frase: "Hello, how are you today?", traducao: "Olá, como você está hoje?", nivel: "facil" },
  { chave: "likes|gostos|preferência|preferences", frase: "I like coffee very much.", traducao: "Eu gosto muito de café.", nivel: "medio" },
  { chave: "family|família", frase: "I have one sister and one brother.", traducao: "Eu tenho uma irmã e um irmão.", nivel: "medio" },
  { chave: "routine|rotina", frase: "I wake up at seven o'clock.", traducao: "Eu acordo às sete horas.", nivel: "medio" },
  { chave: "travel|viagem|viagens|trips", frase: "I would like a ticket to London, please.", traducao: "Eu gostaria de um bilhete para Londres, por favor.", nivel: "medio" },
  { chave: "future|futuro|plans|planos", frase: "Tomorrow I am going to work from home.", traducao: "Amanhã eu vou trabalhar de casa.", nivel: "dificil" },
  { chave: "past|passado", frase: "Yesterday I studied English for one hour.", traducao: "Ontem eu estudei inglês por uma hora.", nivel: "dificil" },
  { chave: "opinions|opinião|arguments", frase: "I think it is a good idea.", traducao: "Eu acho que é uma boa ideia.", nivel: "dificil" },
];

const BANCO_ESPANHOL: FraseModelo[] = [
  { chave: "presentación|apresentação|nombre|nome", frase: "Me llamo Ana.", traducao: "Eu me chamo Ana.", nivel: "facil" },
  { chave: "presentación|apresentação|nacionalidad|nacionalidade", frase: "Soy brasileña.", traducao: "Eu sou brasileira.", nivel: "facil" },
  { chave: "presentación|apresentação|edad|idade", frase: "Tengo treinta años.", traducao: "Eu tenho trinta anos.", nivel: "facil" },
  { chave: "presentación|apresentação|saludos|cumprimentos", frase: "Hola, ¿cómo estás hoy?", traducao: "Olá, como você está hoje?", nivel: "facil" },
  { chave: "gustos|gosto|preferencias|preferência", frase: "Me gusta mucho el café.", traducao: "Eu gosto muito de café.", nivel: "medio" },
  { chave: "familia|família", frase: "Tengo una hermana y un hermano.", traducao: "Eu tenho uma irmã e um irmão.", nivel: "medio" },
  { chave: "rutina|rotina", frase: "Me despierto a las siete.", traducao: "Eu acordo às sete horas.", nivel: "medio" },
  { chave: "viajes|viagem|viagens", frase: "Quisiera un billete para Madrid, por favor.", traducao: "Eu gostaria de um bilhete para Madrid, por favor.", nivel: "medio" },
  { chave: "planes|futuro|planos|futur", frase: "Mañana voy a trabajar en casa.", traducao: "Amanhã eu vou trabalhar em casa.", nivel: "dificil" },
  { chave: "pasado|passé", frase: "Ayer estudié español una hora.", traducao: "Ontem eu estudei espanhol por uma hora.", nivel: "dificil" },
  { chave: "opiniones|opinião|opinion", frase: "Creo que es una buena idea.", traducao: "Eu acho que é uma boa ideia.", nivel: "dificil" },
];

function bancoDoIdioma(idioma: string): FraseModelo[] {
  const s = idioma.toLowerCase();
  if (s.includes("fran") || s.includes("français")) return BANCO_FRANCES;
  if (s.includes("ingl") || s.includes("english")) return BANCO_INGLES;
  if (s.includes("espan") || s.includes("español")) return BANCO_ESPANHOL;
  return BANCO_INGLES;
}

/** Frases do banco que casam com o tema/conteúdos da lição (fallback ancorado). */
function frasesDaLicao(ctx: ContextoAula): FraseModelo[] {
  const banco = bancoDoIdioma(ctx.idioma);
  const alvo = `${ctx.tema} ${ctx.conteudo.join(" ")}`.toLowerCase();
  const casadas = banco.filter((f) =>
    f.chave.split("|").some((c) => alvo.includes(c.toLowerCase()))
  );
  return casadas.length >= 3 ? casadas : banco;
}

/** Corrupções determinísticas (sempre erradas de verdade) para alternativas. */
function variantesErradas(idioma: string, frase: string): string[] {
  const s = idioma.toLowerCase();
  const regras: [RegExp, string][] = s.includes("fran")
    ? [
        [/\bJe suis\b/g, "Je est"],
        [/\bJ'ai\b/g, "Je ai"],
        [/\bJe m'appelle\b/g, "Me j'appelle"],
        [/\bJ'aime\b/g, "Je aime"],
        [/\bJe vais\b/g, "Je va"],
        [/\bJe pense\b/g, "Me pense"],
      ]
    : s.includes("espan")
      ? [
          [/\bSoy\b/g, "Yo es"],
          [/\bTengo\b/g, "Yo tener"],
          [/\bMe llamo\b/g, "Llamo me"],
          [/\bMe gusta\b/g, "Gusta me"],
          [/\bvoy a\b/g, "voy en"],
          [/\bCreo\b/g, "Creer"],
        ]
      : [
          [/\bI am\b/g, "I is"],
          [/\bI have\b/g, "I has"],
          [/\bMy name is\b/g, "My name are"],
          [/\bI like\b/g, "I liking"],
          [/\bI am going to\b/g, "I am go to"],
          [/\bI think\b/g, "I thinking"],
        ];
  const saida: string[] = [];
  for (const [rx, err] of regras) {
    if (rx.test(frase)) {
      const v = frase.replace(rx, err);
      if (v !== frase) saida.push(v);
    }
  }
  return saida.slice(0, 2);
}

function fallbackLocalExercicios(ctx: ContextoAula, quantidade: number, modo: string): ExercicioGerado[] {
  const frases = frasesDaLicao(ctx);
  const lote: ExercicioGerado[] = [];
  const n = Math.min(quantidade, frases.length * 2);

  for (let i = 0; lote.length < n; i++) {
    const f = frases[i % frases.length];
    const rotacao = Math.floor(i / frases.length); // 0: primeiro giro, 1: segundo
    const idx = lote.length;
    // distribuição de tipos com progressão: multipla → ordenar/digitada → associar
    const fase = idx / Math.max(1, n); // 0..1
    let tipo: TipoExercicio;
    if (fase < 0.4) tipo = "multipla";
    else if (fase < 0.6) tipo = "ordenar";
    else if (fase < 0.8) tipo = "digitada";
    else tipo = "associar";
    if (modo === "jogo" && idx % 3 === 0 && tipo === "multipla") tipo = "digitada"; // jogo: mais digitação rápida

    if (tipo === "multipla") {
      const erradas = variantesErradas(ctx.idioma, f.frase);
      if (erradas.length < 2) {
        // sem corrupção disponível: vira ordenar
        tipo = "ordenar";
      } else {
        const alts = embaralhar([f.frase, ...erradas]);
        lote.push({
          tipo: "multipla",
          dificuldade: f.nivel === "facil" ? "facil" : "medio",
          enunciado: `Qual frase está correta em ${ctx.idioma}? (tema: ${ctx.tema})`,
          alternativas: alts,
          gabarito: f.frase,
          dica: `Observe o verbo: como ele se conjunta com "${f.frase.split(" ")[0]}"?`,
          explicacao: `"${f.frase}" está correta — significa "${f.traducao}". As outras têm erro de conjugação.`,
        });
      }
    }
    if (tipo === "ordenar") {
      const palavras = f.frase.replace(/[.?!¿]/g, "").split(/\s+/).filter(Boolean);
      lote.push({
        tipo: "ordenar",
        dificuldade: f.nivel === "facil" ? "facil" : "medio",
        enunciado: `Monte a frase em ${ctx.idioma} (tradução: "${f.traducao}"):`,
        palavras: embaralhar(palavras),
        gabarito: f.frase.replace(/[.?!¿]/g, "").trim(),
        dica: "Comece pelo sujeito (Je / Yo / I) e depois o verbo.",
        explicacao: `A ordem correta é "${f.frase}" — "${f.traducao}".`,
      });
    }
    if (tipo === "digitada") {
      lote.push({
        tipo: "digitada",
        dificuldade: "medio",
        enunciado: `Escreva em ${ctx.idioma}: "${f.traducao}"`,
        gabarito: f.frase.replace(/[.?!¿]/g, "").trim(),
        tolerancias: [f.frase],
        dica: `Comece com ${f.frase.split(" ").slice(0, 2).join(" ")}...`,
        explicacao: `"${f.frase}" — "${f.traducao}".`,
      });
    }
    if (tipo === "associar") {
      const disponiveis = frases.slice(rotacao, rotacao + 3);
      const usados = disponiveis.length >= 2 ? disponiveis : frases.slice(0, 3);
      const pares: [string, string][] = usados.slice(0, 3).map((x) => [
        x.frase.replace(/[.?!¿]/g, ""),
        x.traducao.replace(/[.]/g, ""),
      ]);
      if (pares.length >= 2) {
        lote.push({
          tipo: "associar",
          dificuldade: "dificil",
          enunciado: `Associe cada frase em ${ctx.idioma} à tradução correta:`,
          pares,
          gabarito: JSON.stringify(pares.map(([esq, dir]) => ({ esq, dir }))),
          dica: "Pergunte a si mesmo quem é o sujeito e qual verbo aparece na frase.",
          explicacao: "Cada frase casa com sua tradução literal do conteúdo da lição.",
        });
      }
    }
  }

  return ordenarProgressao(lote).slice(0, quantidade);
}

// ---------- Orquestração: IA → fallback ----------

export interface LoteExercicios {
  exercicios: ExercicioGerado[];
  provedor: "google" | "groq" | "local";
}

export async function gerarLoteExercicios(
  ctx: ContextoAula,
  quantidade: number,
  modo: string
): Promise<LoteExercicios> {
  try {
    const { texto, provedor } = await gerarTexto(promptGerarExercicios(ctx, quantidade, modo), {
      temperatura: 0.4,
    });
    const json = extrairJSON(texto);
    if (json && typeof json === "object" && Array.isArray((json as Record<string, unknown>).exercicios)) {
      const validos = ((json as Record<string, unknown>).exercicios as Record<string, unknown>[])
        .map(validarExercicio)
        .filter((e): e is ExercicioGerado => e !== null);
      if (validos.length >= Math.ceil(quantidade / 2)) {
        // complementa com fallback se a IA devolveu menos que o pedido
        const faltam = quantidade - validos.length;
        const complemento = faltam > 0 ? fallbackLocalExercicios(ctx, faltam, modo) : [];
        return { exercicios: ordenarProgressao([...validos, ...complemento]).slice(0, quantidade), provedor };
      }
    }
  } catch {
    // segue para o fallback — a lição nunca para
  }
  return { exercicios: fallbackLocalExercicios(ctx, quantidade, modo), provedor: "local" };
}

export { fallbackLocalExercicios };
