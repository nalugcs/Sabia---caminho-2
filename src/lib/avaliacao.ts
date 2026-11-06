// Avaliação determinística de respostas — motor das métricas exatas.
// Feedback da autora (nov/2026): 10 questões, 7 corretas → exatamente 70%.
// Toda comparação normaliza (caixa, acentos, pontuação, espaçamento) antes.

/** Normaliza um texto para comparação: minúsculas, sem acentos, sem pontuação, espaços simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacríticos
    .toLowerCase()
    .replace(/[’']+/g, " ") // apóstrofos (reto e tipográfico) viram espaço: "j'ai" == "j ai"
    .replace(/[.,!?;:¡¿«»"()\-–—]/g, " ") // pontuação vira espaço
    .replace(/\s+/g, " ")
    .trim();
}

/** Igualdade de equivalentes: "J'ai trente ans" == "j ai trente ans." */
export function equivalentes(a: string, b: string): boolean {
  return normalizar(a) === normalizar(b);
}

/** Resposta digitada correta se bate com o gabarito OU com alguma tolerância. */
export function respostaDigitadaCorreta(resposta: string, gabarito: string, tolerancias: string[] = []): boolean {
  return [gabarito, ...tolerancias].some((g) => equivalentes(resposta, g));
}

/** Seleção (múltipla escolha): compara o índice/valor escolhido com o gabarito. */
export function respostaSelecaoCorreta(escolhido: string, gabarito: string): boolean {
  return normalizar(escolhido) === normalizar(gabarito);
}

/** Ordenação de palavras: sequência exata de tokens após normalizar. */
export function respostaOrdenacaoCorreta(seqEnviada: string[], gabarito: string): boolean {
  const enviada = seqEnviada.map(normalizar).filter(Boolean).join(" ");
  const esperada = normalizar(gabarito);
  return enviada === esperada;
}

/** Associação de pares: conjunto de pares {esq:dir} igual ao gabarito (ordem livre). */
export function respostaAssociacaoCorreta(
  enviados: { esq: string; dir: string }[],
  gabarito: { esq: string; dir: string }[]
): boolean {
  const chave = (p: { esq: string; dir: string }) => `${normalizar(p.esq)}=>${normalizar(p.dir)}`;
  const a = new Set(enviados.map(chave));
  const b = new Set(gabarito.map(chave));
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
}

/** Embaralhar (Fisher-Yates) — usado para alternativas e banco de palavras. */
export function embaralhar<T>(itens: T[]): T[] {
  const c = [...itens];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}
