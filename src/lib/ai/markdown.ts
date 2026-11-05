// Limpeza de Markdown — o app Sabiá renderiza texto plano.
// (Módulo separado para evitar cache de build entre camadas de rota.)

export function limparMarkdown(t: string): string {
  let s = t;
  // títulos: "### X" → "X"
  s = s.replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "");
  // negrito/itálico
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1$2");
  // código inline
  s = s.replace(/`([^`\n]+)`/g, "$1");
  // bullets: "*", "-", "•" → "•"
  s = s.replace(/^[ \t]*[*\-•][ \t]+/gm, "• ");
  return s;
}
