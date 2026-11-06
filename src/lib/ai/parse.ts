// Parser da professora-IA.
// - Conversa natural: extrai a nota oculta "[NOTA: X]" do fim da resposta
//   (para métricas) e devolve o texto limpo para exibição.
// - Legado: formato estruturado Correção/Explicação/Exemplo/Nota/Próximo
//   exercício, mantido para compatibilidade com sessões antigas.

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

/**
 * Conversa natural: nota oculta na última linha "[NOTA: X]".
 * Remove a linha do texto exibido e devolve a nota (null se "—" ou ausente).
 */
export function extrairNotaOculta(texto: string): { exibicao: string; nota: number | null } {
  const m = texto.match(/\n?\[NOTA\s*:\s*([^\]]*)\]\s*$/i);
  if (!m) return { exibicao: limparMarkdown(texto).trim(), nota: null };
  const brutoNota = m[1].trim();
  const mNum = brutoNota.match(/^(\d{1,2}(?:[.,]\d+)?)\s*\/?\s*(?:10)?$/);
  let nota: number | null = null;
  if (mNum) {
    nota = parseFloat(mNum[1].replace(",", "."));
    if (nota > 10) nota = 10;
  }
  const exibicao = limparMarkdown(texto.replace(m[0], "")).trim();
  return { exibicao, nota };
}

/**
 * Avaliação digitada pela IA: primeira linha "CORRETO"/"INCORRETO" + explicação.
 */
export function parseVeredito(texto: string): { correta: boolean | null; explicacao: string } {
  const m = texto.trim().match(/^(CORRETO|INCORRETO)\b/i);
  if (!m) return { correta: null, explicacao: limparMarkdown(texto).trim().slice(0, 400) };
  const correta = m[1].toUpperCase() === "CORRETO";
  const explicacao = limparMarkdown(texto.slice(m[0].length))
    .replace(/^[\s:—-]+/, "")
    .trim();
  return { correta, explicacao: explicacao || (correta ? "Resposta correta!" : "Resposta incorreta — veja o gabarito.") };
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
