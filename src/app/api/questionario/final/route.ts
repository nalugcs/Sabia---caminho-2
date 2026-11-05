import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES } from "@/lib/pesquisa";
import type { Prisma } from "@prisma/client";

// Questionário completo de percepção (20 itens Likert + avaliação global + abertas),
// aplicado ao encerrar a trilha de 10 lições.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ erro: "Código ausente." }, { status: 400 });

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

    const likert = ["ut1", "ut2", "ut3", "ut4", "cf1", "cf2", "cf3", "cf4", "df1", "df2", "df3", "df4", "re1", "re2", "re3", "re4", "ct1", "ct2", "ct3", "ct4"] as const;
    const dados = {} as Pick<Prisma.FinalQuestionnaireUncheckedCreateInput, (typeof likert)[number]>;
    for (const k of likert) {
      const v = Number(body[k]);
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        return NextResponse.json({ erro: `Resposta inválida em ${k} (use 1 a 5).` }, { status: 400 });
      }
      dados[k] = v;
    }
    const dg1 = Number(body.dg1);
    if (!Number.isInteger(dg1) || dg1 < 1 || dg1 > 5) {
      return NextResponse.json({ erro: "Satisfação geral inválida (1 a 5)." }, { status: 400 });
    }
    const dg2 = Number(body.dg2);
    if (!Number.isInteger(dg2) || dg2 < 0 || dg2 > 10) {
      return NextResponse.json({ erro: "Recomendação inválida (0 a 10)." }, { status: 400 });
    }
    const dg3 = String(body.dg3 || "");
    const qa1 = String(body.qa1 || "").trim().slice(0, 3000) || null;
    const qa2 = String(body.qa2 || "").trim().slice(0, 3000) || null;
    const qa3 = String(body.qa3 || "").trim().slice(0, 3000) || null;

    await db.finalQuestionnaire.upsert({
      where: { participantId: p.id },
      update: { ...dados, dg1, dg2, dg3, qa1, qa2, qa3 },
      create: { participantId: p.id, ...dados, dg1, dg2, dg3, qa1, qa2, qa3 },
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
