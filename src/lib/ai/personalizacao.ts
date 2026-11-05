// Personalização por perfil — as variáveis do TCC:
// nível auto-declarado, desempenho anterior (notas), erros recorrentes
// (extraídos das correções) e frequência de uso (dias ativos).

import { db } from "@/lib/db";
import { NIVEIS_DECLARADOS, nivelDaLicao } from "@/lib/pesquisa";

export async function construirPerfilParticipante(participantId: string): Promise<string> {
  const p = await db.participant.findUnique({
    where: { id: participantId },
    include: {
      sessions: {
        where: { status: "ENCERRADA" },
        orderBy: { lessonNumber: "asc" },
        select: { lessonNumber: true, score: true, correctCount: true, durationSec: true, endedAt: true },
      },
    },
  });
  if (!p) return "Primeira lição — use o nível auto-declarado como referência.";

  const linhas: string[] = [];
  const nivelDeclarado = NIVEIS_DECLARADOS.find((n) => n.valor === p.selfLevel);
  linhas.push(
    `Nível auto-declarado pelo aluno: ${nivelDeclarado?.rotulo || p.selfLevel}. Idioma: ${p.language}.`
  );

  if (p.sessions.length > 0) {
    const comNota = p.sessions.filter((s) => s.score != null);
    if (comNota.length > 0) {
      const media = comNota.reduce((acc, s) => acc + (s.score || 0), 0) / comNota.length;
      const ultima = comNota[comNota.length - 1];
      const primeira = comNota[0];
      const tendencia =
        (ultima.score || 0) > (primeira.score || 0) + 0.5
          ? "ascendente"
          : (ultima.score || 0) < (primeira.score || 0) - 0.5
            ? "descendente"
            : "estável";
      linhas.push(
        `Desempenho anterior: ${comNota.length} lição(ões) concluída(s); média das notas ${media.toFixed(1)}/10; tendência ${tendencia}. Lições concluídas: ${comNota.map((s) => s.lessonNumber).join(", ")}.`
      );
    }
    // frequência de uso — dias distintos com lição encerrada
    const dias = new Set(p.sessions.map((s) => (s.endedAt || s.startedAt).toISOString().slice(0, 10)));
    linhas.push(`Frequência de uso: ${dias.size} dia(s) distinto(s) de estudo.`);
  } else {
    linhas.push("Primeira lição registrada.");
  }

  // Erros recorrentes: extrai menções de erro das últimas correções com nota baixa
  const mensagens = await db.chatMessage.findMany({
    where: {
      session: { participantId, status: "ENCERRADA" },
      role: "PROFESSORA",
      correcao: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { nota: true, correcao: true },
  });
  const erros = mensagens
    .filter((m) => m.nota != null && m.nota < 7 && m.correcao)
    .map((m) => (m.correcao || "").replace(/\s+/g, " ").slice(0, 120));
  if (erros.length > 0) {
    linhas.push(`Erros recorrentes apontados nas correções (mais recentes primeiro):\n- ${erros.slice(0, 5).join("\n- ")}`);
    linhas.push(
      "Calibre a dificuldade: reforce os pontos dos erros acima antes de aumentar a complexidade."
    );
  }

  return linhas.join("\n");
}

// Contexto completo de uma lição (dados do catálogo + nível por faixa)
export async function obterContextoAula(language: string, lessonNumber: number, mode: string, perfil?: string) {
  const lesson = await db.lesson.findUnique({
    where: { language_number: { language, number: lessonNumber } },
  });
  if (!lesson) return null;
  return {
    idioma: language,
    aula: lessonNumber,
    nivel: lesson.level || nivelDaLicao(lessonNumber),
    tema: lesson.theme,
    objetivo: lesson.objective,
    conteudo: JSON.parse(lesson.content) as string[],
    modo: mode,
    perfil,
  };
}
