import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionIdSchema, mensagemDeErro } from "@/lib/schemas";
import { gerarTexto } from "@/lib/ai/providers";
import { promptDicaConversa } from "@/lib/ai/prompts";
import { extrairNotaOculta } from "@/lib/ai/parse";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem } from "@/lib/formatar";

// Dica pedagógica: ajuda sem entregar a resposta (métrica "dicas usadas").
// Conversa: dica da IA no chat. Exercícios: a dica da própria questão (sem IA).
export async function POST(req: Request) {
  try {
    const analise = sessionIdSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const sessionId = analise.data.sessionId;

    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta atividade já foi encerrada." }, { status: 409 });
    }

    // Modo exercício: dica determinística da questão atual (a primeira não respondida)
    if (session.mode !== "conversa" && session.mode !== "escrita") {
      const pendente = await db.exercise.findFirst({
        where: { sessionId, respondidoEm: null },
        orderBy: { ordem: "asc" },
      });
      if (!pendente) return NextResponse.json({ erro: "Não há questões pendentes." }, { status: 400 });
      await db.lessonSession.update({
        where: { id: sessionId },
        data: { hintsUsed: { increment: 1 } },
      });
      return NextResponse.json({ dica: pendente.dica || "Releia o enunciado e o vocabulário da lição." });
    }

    // Conversa: dica da IA
    const perfil = await construirPerfilParticipante(session.participantId);
    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode,
      perfil,
      session.participant.selfLevel
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const { texto, provedor, latencyMs } = await gerarTexto(promptDicaConversa(ctx));
    const { exibicao, nota } = extrairNotaOculta(texto);

    const msg = await db.chatMessage.create({
      data: {
        sessionId,
        role: "PROFESSORA",
        content: exibicao,
        nota,
        provider: provedor,
        latencyMs,
      },
    });

    await db.lessonSession.update({
      where: { id: sessionId },
      data: { hintsUsed: { increment: 1 } },
    });

    return NextResponse.json({ mensagem: formatarMensagem(msg) });
  } catch (e) {
    console.error("[licao/dica]", e);
    return NextResponse.json({ erro: "Erro ao pedir dica." }, { status: 500 });
  }
}
