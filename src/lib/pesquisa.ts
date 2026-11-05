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
    descricao: "Diálogo livre com a professora IA sobre o tema da lição.",
  },
  {
    id: "escrita",
    label: "Escrita",
    icone: "pen-line",
    descricao: "Escreva frases e textos curtos; receba correção linha a linha.",
  },
  {
    id: "completar",
    label: "Completar frase",
    icone: "list-checks",
    descricao: "Frases com lacuna e alternativas para escolher.",
  },
  {
    id: "jogo",
    label: "Jogo",
    icone: "gamepad-2",
    descricao: "Desafios curtos: tradução, escolha múltipla ou montar frase.",
  },
] as const;
export type ModoId = (typeof MODOS)[number]["id"];

export const NIVEIS_DECLARADOS = [
  { valor: 1, rotulo: "1 — Nunca estudei" },
  { valor: 2, rotulo: "2 — Iniciante" },
  { valor: 3, rotulo: "3 — Intermediário" },
  { valor: 4, rotulo: "4 — Avançado" },
  { valor: 5, rotulo: "5 — Fluente" },
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
