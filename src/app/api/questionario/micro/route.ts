import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Micro-questionário de 5 itens ao final de cada lição (Anexo I do instrumento).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "");
    const ml1 = Number(body.ml1);
    const ml2 = Number(body.ml2);
    const ml3 = Number(body.ml3);
    const ml4 = Number(body.ml4);
    const tempoMin = body.tempoMin != null ? Number(body.tempoMin) : null;

    if (!sessionId) return NextResponse.json({ erro: "Sessão inválida." }, { status: 400 });
    for (const [k, v] of Object.entries({ ml1, ml2, ml3, ml4 })) {
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        return NextResponse.json({ erro: `Resposta inválida em ${k} (use 1 a 5).` }, { status: 400 });
      }
    }

    const session = await db.lessonSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "ENCERRADA") {
      return NextResponse.json({ erro: "Encerre a lição antes do questionário." }, { status: 409 });
    }

    await db.microQuestionnaire.upsert({
      where: { sessionId },
      update: { ml1, ml2, ml3, ml4, tempoMin },
      create: {
        sessionId,
        participantId: session.participantId,
        lessonNumber: session.lessonNumber,
        ml1,
        ml2,
        ml3,
        ml4,
        tempoMin,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[questionario/micro]", e);
    return NextResponse.json({ erro: "Erro ao registrar respostas." }, { status: 500 });
  }
}
