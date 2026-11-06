import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES } from "@/lib/pesquisa";
import { recuperarSchema } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";

// Recuperação de sessão pelo código do participante (mesmo link, outro dia/dispositivo).
export async function POST(req: Request) {
  try {
    // rate limit: 10 tentativas por minuto por IP (código SAB-XXXX não é secreto forte)
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 10)) {
      return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
    }
    const analise = recuperarSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: "Informe seu código de participante." }, { status: 400 });
    }
    const code = analise.data.code;

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

    const licoes: { numero: number; status: string; sessionId?: string; modo?: string; score?: number | null; acertos?: number; interacoes?: number; tempoSec?: number | null; microRespondido?: boolean }[] = [];
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
