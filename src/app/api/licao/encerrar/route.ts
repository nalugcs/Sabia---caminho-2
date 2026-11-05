import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarTexto } from "@/lib/ai/providers";
import { promptFeedbackFinal } from "@/lib/ai/prompts";
import { limparMarkdown } from "@/lib/ai/markdown";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";

// Encerra a lição: feedback final (8 componentes do TCC) + métricas consolidadas.
// A resposta devolve o feedback já limpo de Markdown para exibição em texto plano.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "");
    if (!sessionId) return NextResponse.json({ erro: "Sessão inválida." }, { status: 400 });

    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta lição já foi encerrada." }, { status: 409 });
    }

    const mensagens = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, nota: true },
    });

    const perfil = await construirPerfilParticipante(session.participantId);
    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode,
      perfil
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const { texto, provedor } = await gerarTexto(
      promptFeedbackFinal(
        ctx,
        mensagens.map((m) => ({ role: m.role, content: m.content }))
      )
    );

    // métricas consolidadas
    const notas = mensagens
      .filter((m) => m.role === "PROFESSORA" && m.nota != null)
      .map((m) => m.nota as number);
    const interacoesAluno = mensagens.filter((m) => m.role === "ALUNO").length;
    const acertos = notas.filter((n) => n >= 7).length;
    const score = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const durationSec = Math.max(
      0,
      Math.round((Date.now() - session.startedAt.getTime()) / 1000)
    );

    await db.lessonSession.update({
      where: { id: sessionId },
      data: {
        status: "ENCERRADA",
        endedAt: new Date(),
        score: Math.round(score * 10) / 10,
        interactionCount: interacoesAluno,
        correctCount: acertos,
        durationSec,
        finalFeedback: JSON.stringify({ texto, provedor }),
        provider: provedor,
      },
    });

    return NextResponse.json({
      score: Math.round(score * 10) / 10,
      acertos,
      interacoes: interacoesAluno,
      dicas: session.hintsUsed,
      tempoSec: durationSec,
      feedbackFinal: limparMarkdown(texto),
    });
  } catch (e) {
    console.error("[licao/encerrar]", e);
    return NextResponse.json({ erro: "Erro ao encerrar a lição." }, { status: 500 });
  }
}
