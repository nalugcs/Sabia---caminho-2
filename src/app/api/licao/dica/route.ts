import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarTexto } from "@/lib/ai/providers";
import { promptDica } from "@/lib/ai/prompts";
import { parseFeedback } from "@/lib/ai/parse";
import { obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem } from "@/lib/formatar";

// Dica pedagógica: ajuda sem entregar a resposta (métrica "dicas usadas").
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

    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const { texto, provedor, latencyMs } = await gerarTexto(promptDica(ctx));
    const fb = parseFeedback(texto);

    const msg = await db.chatMessage.create({
      data: {
        sessionId,
        role: "PROFESSORA",
        content: fb.exibicao,
        explicacao: fb.explicacao || fb.exibicao,
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
