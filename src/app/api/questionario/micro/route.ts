import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { microSchema, mensagemDeErro } from "@/lib/schemas";

// Micro-questionário de 5 itens ao final de cada lição (Anexo I do instrumento).
export async function POST(req: Request) {
  try {
    const analise = microSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { sessionId, ml1, ml2, ml3, ml4 } = analise.data;
    const tempoMin = analise.data.tempoMin ?? null;

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
