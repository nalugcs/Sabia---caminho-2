import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES, rotuloModo } from "@/lib/pesquisa";
import { recuperarSchema } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";
import { estadoDasLicoes, type ResumoSessao } from "@/lib/trilha";
import { rotuloCEFR } from "@/lib/cefr";

// Recuperação de sessão pelo código do participante (mesmo link, outro dia/dispositivo).
// Formato novo: estado por lição com modos praticados, avanço explícito e revisão.
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
        sessions: { orderBy: { lessonNumber: "asc" } },
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

    const sessoes: ResumoSessao[] = p.sessions.map((s) => ({
      sessionId: s.id,
      lessonNumber: s.lessonNumber,
      mode: s.mode,
      status: s.status,
      isReview: s.isReview,
      exercisesTotal: s.exercisesTotal,
      exercisesCorrect: s.exercisesCorrect,
      interactionCount: s.interactionCount,
      correctCount: s.correctCount,
      score: s.score,
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    }));

    const progresso = p.lessonProgress;
    const licoes = estadoDasLicoes(sessoes, progresso).map((l) => ({
      ...l,
      praticado: l.praticado.map((m) => ({ ...m, rotulo: rotuloModo(m.mode) })),
    }));

    const emAndamento = licoes.find((l) => l.status === "EM_ANDAMENTO");
    const proximaLicao =
      emAndamento?.numero ?? (progresso < TRILHA_LICOES ? progresso + 1 : null);

    return NextResponse.json({
      participante: {
        code: p.code,
        primeiroNome: p.firstName,
        idioma: p.language,
        nivelDeclarado: p.selfLevel,
        nivelCEFR: rotuloCEFR(p.selfLevel),
        status: p.status,
      },
      licoes,
      concluidas: progresso,
      total: TRILHA_LICOES,
      proximaLicao,
      questionarioFinalRespondido: !!p.finalAnswer,
    });
  } catch (e) {
    console.error("[recuperar]", e);
    return NextResponse.json({ erro: "Erro ao recuperar sessão." }, { status: 500 });
  }
}
