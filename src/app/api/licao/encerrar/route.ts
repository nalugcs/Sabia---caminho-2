import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionIdSchema, mensagemDeErro } from "@/lib/schemas";
import { gerarTexto } from "@/lib/ai/providers";
import { promptFeedbackFinal } from "@/lib/ai/prompts";
import { limparMarkdown } from "@/lib/ai/markdown";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { metricasSessao, notaFinalSessao, type SessaoParaMetrica } from "@/lib/metricas";
import { formatarExercicio } from "@/lib/formatar";

// Encerra a ATIVIDADE (sessão). Métricas exatas vindas dos exercícios
// respondidos (fonte única de verdade) ou, no modo conversa, das notas das
// interações. A LIÇÃO não é concluída aqui — o avanço é uma escolha explícita
// do aluno em /api/trilha/avancar.
export async function POST(req: Request) {
  try {
    const analise = sessionIdSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const sessionId = analise.data.sessionId;

    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta atividade já foi encerrada." }, { status: 409 });
    }

    const exercicios = await db.exercise.findMany({
      where: { sessionId },
      orderBy: { ordem: "asc" },
    });
    const mensagens = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, nota: true },
    });

    // ---- métricas: fonte única de verdade (recalculadas do que existe) ----
    const notasConversa = mensagens
      .filter((m) => m.role === "PROFESSORA" && m.nota != null)
      .map((m) => m.nota as number);
    const interacoes = mensagens.filter((m) => m.role === "ALUNO").length;

    // exercícios: contam-se somente os RESPONDIDOS (incompletos não contam)
    const respondidos = exercicios.filter((e) => e.respondidoEm != null);
    const exercisesTotal = respondidos.length;
    const exercisesCorrect = respondidos.filter((e) => e.correta === true).length;

    const paraMetricas: SessaoParaMetrica = {
      mode: session.mode,
      exercisesTotal,
      exercisesCorrect,
      interactionCount: session.mode === "conversa" ? interacoes : exercisesTotal,
      correctCount: session.mode === "conversa" ? notasConversa.filter((n) => n >= 7).length : exercisesCorrect,
      notas: notasConversa,
    };
    const metricas = metricasSessao(paraMetricas);
    const notaFinal = notaFinalSessao(paraMetricas);

    const durationSec = Math.max(
      0,
      Math.round((Date.now() - session.startedAt.getTime()) / 1000)
    );

    // ---- feedback final da IA com as métricas oficiais incluídas ----
    const perfil = await construirPerfilParticipante(session.participantId);
    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode,
      perfil,
      session.participant.selfLevel
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const descricaoMetricas =
      session.mode === "conversa"
        ? `- Interações do aluno: ${interacoes}\n- Nota média das interações: ${metricas.notaMedia.toFixed(1)}/10\n- Dicas usadas: ${session.hintsUsed}\n- Tempo: ${Math.round(durationSec / 60)} min`
        : `- Questões respondidas: ${exercisesTotal} de ${exercicios.length}\n- Acertos: ${exercisesCorrect} (${metricas.percentual}%)\n- Dicas usadas: ${session.hintsUsed}\n- Tempo: ${Math.round(durationSec / 60)} min`;

    const { texto, provedor } = await gerarTexto(
      promptFeedbackFinal(
        ctx,
        mensagens.map((m) => ({ role: m.role, content: m.content })),
        { descricao: descricaoMetricas }
      )
    );

    await db.lessonSession.update({
      where: { id: sessionId },
      data: {
        status: "ENCERRADA",
        endedAt: new Date(),
        score: Math.round(notaFinal * 10) / 10,
        interactionCount: paraMetricas.interactionCount,
        correctCount: paraMetricas.correctCount,
        exercisesTotal,
        exercisesCorrect,
        durationSec,
        finalFeedback: JSON.stringify({ texto, provedor }),
        provider: provedor,
      },
    });

    // ações disponíveis pós-atividade (navegação livre — feedback item 6)
    const encerradasNestaLicao = await db.lessonSession.count({
      where: { participantId: session.participantId, lessonNumber: session.lessonNumber, status: "ENCERRADA" },
    });
    const progresso = session.participant.lessonProgress;
    const eProxima = session.lessonNumber === progresso + 1;
    const incompletas = exercicios.length - exercisesTotal;
    const proxima = session.lessonNumber + 1;

    return NextResponse.json({
      score: Math.round(notaFinal * 10) / 10,
      metricas,
      incompletas,
      dicas: session.hintsUsed,
      tempoSec: durationSec,
      feedbackFinal: limparMarkdown(texto),
      exercicios: exercicios.map(formatarExercicio),
      acoes: {
        podeAvancar: eProxima && encerradasNestaLicao > 0,
        proximaLicao: eProxima && proxima <= 10 ? proxima : null,
        revisao: session.isReview,
      },
    });
  } catch (e) {
    console.error("[licao/encerrar]", e);
    return NextResponse.json({ erro: "Erro ao encerrar a atividade." }, { status: 500 });
  }
}
