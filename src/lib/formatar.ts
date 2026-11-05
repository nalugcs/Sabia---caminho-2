// Formatação de mensagens do chat para a resposta das APIs.

export interface MensagemFormatada {
  id: string;
  role: string;
  content: string;
  correcao?: string;
  explicacao?: string;
  exemplo?: string;
  nota?: number;
  proximoExercicio?: string;
  criadoEm: Date;
}

export function formatarMensagem(m: {
  id: string;
  role: string;
  content: string;
  correcao?: string | null;
  explicacao?: string | null;
  exemplo?: string | null;
  nota?: number | null;
  proximoExercicio?: string | null;
  createdAt: Date;
}): MensagemFormatada {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    correcao: m.correcao || undefined,
    explicacao: m.explicacao || undefined,
    exemplo: m.exemplo || undefined,
    nota: m.nota ?? undefined,
    proximoExercicio: m.proximoExercicio || undefined,
    criadoEm: m.createdAt,
  };
}
