// Domínio da pesquisa Sabiá — constantes compartilhadas.

export const IDIOMAS = ["Inglês", "Espanhol", "Francês"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const TRILHA_LICOES = 10; // lições por participante (5 encontros × 2)

export const ENCONTROS: { encontro: number; licoes: number[]; foco: string }[] = [
  { encontro: 1, licoes: [1, 2], foco: "Aquecimento e apresentação pessoal" },
  { encontro: 2, licoes: [3, 4], foco: "Rotina e preferências" },
  { encontro: 3, licoes: [5, 6], foco: "Meio da trilha — revisão e passado" },
  { encontro: 4, licoes: [7, 8], foco: "Futuro e situações práticas" },
  { encontro: 5, licoes: [9, 10], foco: "Viagens, revisão e encerramento" },
];

export const MODOS = [
  {
    id: "conversa",
    label: "Conversa",
    icone: "message-circle",
    descricao:
      "Chat natural e contínuo com a professora-IA — ela mantém o contexto, corrige sem interromper e adapta o nível.",
  },
  {
    id: "completar",
    label: "Completar frase",
    icone: "list-checks",
    descricao:
      "Frases com lacuna respondidas de três formas: digitando, escolhendo alternativas ou montando a frase — varia automaticamente.",
  },
  {
    id: "jogo",
    label: "Jogo",
    icone: "gamepad-2",
    descricao:
      "Desafios rápidos: escolha múltipla, tradução, associação e montar frases — com dificuldade progressiva e feedback imediato.",
  },
] as const;
export type ModoId = (typeof MODOS)[number]["id"];

// Modalidades de resposta dentro de "completar" (feedback da autora, item 5):
// A digitada · B seleção de alternativas · C construção de frases.
export const MODALIDADES_COMPLETAR = ["digitada", "seleção", "construção"] as const;

// Questões por atividade (o critério de aceite exige contagem exata:
// 10 questões com 7 corretas → 70%).
export const QUESTOES_POR_MODO: Record<string, number> = {
  completar: 8,
  jogo: 10,
};

/** Modos válidos na API (inclui "escrita" legado de sessões antigas). */
export const MODOS_ACEITOS = [...MODOS.map((m) => m.id), "escrita"] as string[];

/** Rótulo amigável do modo (legado "escrita" → completar). */
export function rotuloModo(modo: string): string {
  if (modo === "escrita") return "Completar frase";
  return MODOS.find((m) => m.id === modo)?.label ?? modo;
}

export const NIVEIS_DECLARADOS = [
  { valor: 1, rotulo: "1 — Nunca estudei (A1)" },
  { valor: 2, rotulo: "2 — Iniciante (A2)" },
  { valor: 3, rotulo: "3 — Intermediário (B1)" },
  { valor: 4, rotulo: "4 — Avançado (B2/C1)" },
  { valor: 5, rotulo: "5 — Fluente (C1/C2)" },
];

// Faixas de nível por número de lição (fiel ao obter_nivel do notebook).
export function nivelDaLicao(aula: number): string {
  if (aula >= 1 && aula <= 5) return "Básico";
  if (aula >= 6 && aula <= 10) return "Intermediário";
  if (aula >= 11 && aula <= 15) return "Avançado";
  if (aula >= 16 && aula <= 20) return "Fluente";
  return "Aula inválida";
}

export const PIN_PESQUISADORA = process.env.RESEARCHER_PIN;

export function gerarCodigoParticipante(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SAB-${s}`;
}
