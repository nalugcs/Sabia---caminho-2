import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES } from "@/lib/pesquisa";

// Recuperação de sessão pelo código do participante (mesmo link, outro dia/dispositivo).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ erro: "Informe seu código de participante." }, { status: 400 });
    }

    const p = await db.participant.findUnique({
      where: { code },
      include: {
        sessions: {
          orderBy: { lessonNumber: "asc" },
          include: { micro: true },
        },
        finalAnswer: true,
      },
    });
    if (!p) {
      return NextResponse.json({ erro: "Código não encontrado. Confira e tente novamente." }, { status: 404 });
    }

    await db.participant.update({
      where: { id: p.id },
      data: { lastActiveAt: new Date() },
    });

    const licoes = [];
    for (let n = 1; n <= TRILHA_LICOES; n++) {
      const s = p.sessions.find((x) => x.lessonNumber === n);
      if (!s) {
        licoes.push({ numero: n, status: "BLOQUEADA" });
      } else if (s.status === "EM_ANDAMENTO") {
        licoes.push({ numero: n, status: "EM_ANDAMENTO", sessionId: s.id, modo: s.mode });
      } else {
        licoes.push({
          numero: n,
          status: "CONCLUIDA",
          score: s.score,
          acertos: s.correctCount,
          interacoes: s.interactionCount,
          tempoSec: s.durationSec,
          microRespondido: !!s.micro,
        });
      }
    }

    const concluidas = licoes.filter((l) => l.status === "CONCLUIDA").length;
    const emAndamento = licoes.find((l) => l.status === "EM_ANDAMENTO");
    const proximaLicao =
      emAndamento?.numero ?? (concluidas < TRILHA_LICOES ? concluidas + 1 : null);

    return NextResponse.json({
      participante: {
        code: p.code,
        primeiroNome: p.firstName,
        idioma: p.language,
        nivelDeclarado: p.selfLevel,
        status: p.status,
      },
      licoes,
      concluidas,
      total: TRILHA_LICOES,
      proximaLicao,
      questionarioFinalRespondido: !!p.finalAnswer,
    });
  } catch (e) {
    console.error("[recuperar]", e);
    return NextResponse.json({ erro: "Erro ao recuperar sessão." }, { status: 500 });
  }
}
