// Progressão pedagógica por nível de proficiência — feedback da autora (nov/2026).
// Referência CEFR/QECR (A1–C2) como organizador de dificuldade. A escolha do
// nível NÃO equivale a uma certificação: calibra a experiência (apoio em
// português, complexidade e profundidade das correções), não atesta domínio.

export interface NivelCEFR {
  valor: number; // 1..5 (nível auto-declarado)
  cefr: string; // A1..C2
  rotulo: string; // rótulo exibido
  // Diretivas para os prompts — quanto maior o nível, menos português.
  diretiva: string;
}

export const NIVEIS_CEFR: NivelCEFR[] = [
  {
    valor: 1,
    cefr: "A1",
    rotulo: "A1 · Iniciante absoluto",
    diretiva: [
      "Público: sem conhecimento prévio ou muito limitado (CEFR A1).",
      "Explique em português BR quando necessário; traduza vocabulário novo.",
      "Frases curtas (3–8 palavras) e situações cotidianas.",
      "Ofereça traduções e dicas; exercícios guiados (seleção e ordenação primeiro).",
      "Introduza o idioma-alvo gradualmente: cumprimentos e fórmulas prontas.",
    ].join(" "),
  },
  {
    valor: 2,
    cefr: "A2",
    rotulo: "A2 · Básico",
    diretiva: [
      "Público: já compreende e forma frases simples (CEFR A2).",
      "Reduza o português: instruções no idioma-alvo com apoio pontual em português.",
      "Vocabulário e estruturas simples; diálogos curtos do dia a dia.",
      "Alterne exercícios guiados (seleção/ordenação) e respostas digitadas curtas.",
      "Corrija os erros que atrapalham a comunicação; ignore deslizes pequenos.",
    ].join(" "),
  },
  {
    valor: 3,
    cefr: "B1",
    rotulo: "B1 · Intermediário",
    diretiva: [
      "Público: intermediário (CEFR B1).",
      "Priorize o idioma-alvo nas instruções e explicações; português só em dúvida real.",
      "Diálogos mais complexos; introduza diferentes tempos verbais.",
      "Situações reais com interpretação contextual; mais respostas digitadas.",
      "Exija autonomia na construção de frases completas.",
    ].join(" "),
  },
  {
    valor: 4,
    cefr: "B2/C1",
    rotulo: "B2/C1 · Avançado",
    diretiva: [
      "Público: avançado (CEFR B2/C1).",
      "Use o idioma-alvo em praticamente 100% da experiência (explicações incluídas).",
      "Textos e diálogos complexos; expressões idiomáticas e nuances gramaticais.",
      "Trabalhe argumentação, hipóteses e opiniões; respostas elaboradas.",
      "Corrija aspectos sutis: registro, colocações naturais, concordância fina.",
    ].join(" "),
  },
  {
    valor: 5,
    cefr: "C1/C2",
    rotulo: "C1/C2 · Fluente / aperfeiçoamento",
    diretiva: [
      "Público: fluente, em aperfeiçoamento (CEFR C1/C2).",
      "Experiência integralmente no idioma-alvo — sem português, salvo pedido explícito.",
      "Conversas naturais e aprofundadas; vocabulário especializado.",
      "Expressões coloquiais, diferenças de registro, discussões abstratas e situações profissionais.",
      "Correções refinadas e discretas: naturalidade, precisão e sofisticação; evite explicações elementares.",
    ].join(" "),
  },
];

export function nivelCEFRDeclarado(selfLevel: number): NivelCEFR {
  return NIVEIS_CEFR.find((n) => n.valor === selfLevel) || NIVEIS_CEFR[0];
}

// Rótulo curto para exibição em badges (ex.: "A2 · Básico").
export function rotuloCEFR(selfLevel: number): string {
  return nivelCEFRDeclarado(selfLevel).rotulo;
}
