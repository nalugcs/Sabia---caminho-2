import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarTexto } from "@/lib/ai/providers";
import { promptMensagemAula } from "@/lib/ai/prompts";
import { parseFeedback } from "@/lib/ai/parse";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem } from "@/lib/formatar";

// Envia a resposta do aluno e devolve a correção da professora-IA.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "");
    const content = String(body.content || "").trim();

    if (!sessionId) return NextResponse.json({ erro: "Sessão inválida." }, { status: 400 });
    if (!content || content.length > 2000) {
      return NextResponse.json({ erro: "Escreva uma resposta (até 2000 caracteres)." }, { status: 400 });
    }

    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta lição já foi encerrada." }, { status: 409 });
    }

    // persiste a mensagem do aluno
    await db.chatMessage.create({
      data: { sessionId, role: "ALUNO", content },
    });

    const historico = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    const perfil = await construirPerfilParticipante(session.participantId);
    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode,
      perfil
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const { texto, provedor, latencyMs } = await gerarTexto(
      promptMensagemAula(ctx, content, historico)
    );
    const fb = parseFeedback(texto);

    const msg = await db.chatMessage.create({
      data: {
        sessionId,
        role: "PROFESSORA",
        content: fb.exibicao,
        correcao: fb.correcao,
        explicacao: fb.explicacao,
        exemplo: fb.exemplo,
        nota: fb.nota,
        proximoExercicio: fb.proximoExercicio,
        provider: provedor,
        latencyMs,
      },
    });

    // métricas por interação
    const acertou = fb.nota != null && fb.nota >= 7 ? 1 : 0;
    await db.lessonSession.update({
      where: { id: sessionId },
      data: {
        interactionCount: { increment: 1 },
        correctCount: { increment: acertou },
        provider: provedor,
      },
    });

    return NextResponse.json({ mensagem: formatarMensagem(msg), acertou });
  } catch (e) {
    console.error("[licao/mensagem]", e);
    return NextResponse.json({ erro: "Erro ao processar a resposta. Tente reenviar." }, { status: 500 });
  }
}
