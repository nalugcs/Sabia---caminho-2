import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { avancarSchema, mensagemDeErro } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";
import { podeConcluirLicao, type ResumoSessao } from "@/lib/trilha";
import { TRILHA_LICOES } from "@/lib/pesquisa";

// Conclui a lição atual (escolha EXPLÍCITA do aluno) e libera a próxima.
// Feedback da autora (item 6): o avanço nunca é automático após uma atividade.
export async function POST(req: Request) {
  try {
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 20)) {
      return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
    }
    const analise = avancarSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { code, lessonNumber } = analise.data;

    const p = await db.participant.findUnique({
      where: { code },
      include: { sessions: true },
    });
    if (!p) return NextResponse.json({ erro: "Participante não encontrado." }, { status: 404 });

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

    const { ok, motivo } = podeConcluirLicao(lessonNumber, sessoes, p.lessonProgress);
    if (!ok) return NextResponse.json({ erro: motivo }, { status: 400 });

    const novoProgresso = lessonNumber; // lições 1..lessonNumber concluídas
    await db.participant.update({
      where: { id: p.id },
      data: { lessonProgress: novoProgresso, lastActiveAt: new Date() },
    });

    const trilhaCompleta = novoProgresso >= TRILHA_LICOES;

    return NextResponse.json({
      progresso: novoProgresso,
      proximaLicao: trilhaCompleta ? null : novoProgresso + 1,
      trilhaCompleta,
    });
  } catch (e) {
    console.error("[trilha/avancar]", e);
    return NextResponse.json({ erro: "Erro ao concluir a lição." }, { status: 500 });
  }
}
