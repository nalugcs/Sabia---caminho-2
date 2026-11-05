// Parser da resposta estruturada da professora-IA
// (formato do TCC: Correção / Explicação / Exemplo / Nota / Próximo exercício),
// com limpeza de Markdown — o app renderiza texto plano.

import { limparMarkdown } from "./markdown";

export interface FeedbackEstruturado {
  textoBruto: string;
  exibicao: string; // texto limpo, sem GABARITO (escondido do aluno)
  gabarito?: string;
  correcao?: string;
  explicacao?: string;
  exemplo?: string;
  nota?: number | null;
  proximoExercicio?: string;
}

const ROTULOS = ["Correção", "Explicação", "Exemplo", "Nota", "Próximo exercício"];

// Encontra o índice do rótulo (aceitando enfeites antes/depois do nome).
function acharRotulo(texto: string, rotulo: string): number {
  const rx = new RegExp(
    `(^|\\n)[ \\t]*(?:[#*>\\-\\s]*)[ \\t]*(?:\\*{0,2})${rotulo}(?:\\*{0,2})[ \\t]*:`,
    "i"
  );
  const m = rx.exec(texto);
  return m ? m.index + m[1].length : -1;
}

function extrair(texto: string, rotulo: string): string | undefined {
  const ini = acharRotulo(texto, rotulo);
  if (ini === -1) return undefined;
  const depois = texto.slice(ini);
  // fim = próximo rótulo
  let fim = depois.length;
  for (const r of ROTULOS) {
    if (r === rotulo) continue;
    const idx = acharRotulo(depois.slice(1), r);
    if (idx !== -1 && idx + 1 < fim) fim = idx + 1;
  }
  let valor = depois
    .slice(0, fim)
    .slice(depois.indexOf(":") + 1)
    .replace(/^\s*[-—–:]\s*/, "")
    .trim();
  valor = valor.replace(/\n{3,}/g, "\n\n").trim();
  return valor || undefined;
}

export function parseFeedback(textoBruto: string): FeedbackEstruturado {
  // 1) esconde o GABARITO dos modos completar/jogo
  let gabarito: string | undefined;
  const mGab = textoBruto.match(/GABARITO\s*:\s*(.+)/i);
  let semGabarito = textoBruto;
  if (mGab) {
    gabarito = mGab[1].trim();
    semGabarito = textoBruto.replace(/\n?[ \t]*GABARITO\s*:\s*.+/i, "");
  }

  // 2) limpa Markdown antes de exibir/parsear
  const exibicao = limparMarkdown(semGabarito).trim();

  // 3) extrai campos estruturados
  const notaTxt = extrair(exibicao, "Nota");
  let nota: number | null = null;
  if (notaTxt) {
    const m = notaTxt.match(/(\d{1,2})([.,]\d+)?/);
    if (m) {
      nota = parseFloat(`${m[1]}${m[2] ? "." + m[2].replace(",", ".") : ""}`);
      if (nota > 10) nota = 10;
    }
  }

  return {
    textoBruto,
    exibicao,
    gabarito,
    correcao: extrair(exibicao, "Correção"),
    explicacao: extrair(exibicao, "Explicação"),
    exemplo: extrair(exibicao, "Exemplo"),
    nota,
    proximoExercicio: extrair(exibicao, "Próximo exercício"),
  };
}
