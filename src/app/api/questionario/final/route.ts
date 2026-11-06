import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES } from "@/lib/pesquisa";
import { questionarioFinalSchema, mensagemDeErro } from "@/lib/schemas";

// Questionário completo de percepção (20 itens Likert + avaliação global + abertas),
// aplicado ao encerrar a trilha de 10 lições.
export async function POST(req: Request) {
  try {
    const analise = questionarioFinalSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const dados = analise.data;
    const code = dados.code;
    const { qa1, qa2, qa3, ...camposQuestionario } = dados;

    const p = await db.participant.findUnique({ where: { code } });
    if (!p) return NextResponse.json({ erro: "Participante não encontrado." }, { status: 404 });

    const concluidas = await db.lessonSession.count({
      where: { participantId: p.id, status: "ENCERRADA" },
    });
    if (concluidas < TRILHA_LICOES) {
      return NextResponse.json(
        { erro: "Conclua as 10 lições da trilha antes do questionário final." },
        { status: 400 }
      );
    }

    await db.finalQuestionnaire.upsert({
      where: { participantId: p.id },
      update: { ...camposQuestionario, qa1: qa1 || null, qa2: qa2 || null, qa3: qa3 || null },
      create: { participantId: p.id, ...camposQuestionario, qa1: qa1 || null, qa2: qa2 || null, qa3: qa3 || null },
    });

    await db.participant.update({
      where: { id: p.id },
      data: { status: "FINALIZADO", finishedAt: new Date(), lastActiveAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[questionario/final]", e);
    return NextResponse.json({ erro: "Erro ao registrar o questionário." }, { status: 500 });
  }
}
