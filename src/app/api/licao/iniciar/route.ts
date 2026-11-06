import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES } from "@/lib/pesquisa";
import { iniciarLicaoSchema, mensagemDeErro } from "@/lib/schemas";
import { gerarTexto } from "@/lib/ai/providers";
import { promptAberturaAula } from "@/lib/ai/prompts";
import { parseFeedback } from "@/lib/ai/parse";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem } from "@/lib/formatar";

// Inicia (ou retoma) uma lição: cria a sessão e gera a abertura da professora-IA.
export async function POST(req: Request) {
  try {
    const analise = iniciarLicaoSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { code, lessonNumber, mode } = analise.data;

    const p = await db.participant.findUnique({ where: { code } });
    if (!p) return NextResponse.json({ erro: "Participante não encontrado." }, { status: 404 });
    // Trilha sequencial: só a próxima lição (ou retomar a em andamento)
    const encerradas = await db.lessonSession.count({
      where: { participantId: p.id, status: "ENCERRADA" },
    });
    const emAndamento = await db.lessonSession.findFirst({
      where: { participantId: p.id, status: "EM_ANDAMENTO" },
    });

    if (emAndamento && emAndamento.lessonNumber !== lessonNumber) {
      return NextResponse.json(
        { erro: `Finalize primeiro a lição ${emAndamento.lessonNumber} em andamento.`, sessionId: emAndamento.id },
        { status: 409 }
      );
    }
    if (!emAndamento && lessonNumber !== encerradas + 1) {
      return NextResponse.json(
        { erro: "Siga a trilha na ordem — abra a próxima lição disponível." },
        { status: 400 }
      );
    }
    // (lessonNumber 1..TRILHA_LICOES já garantido pelo schema)

    // Retomada de sessão já aberta
    if (emAndamento && emAndamento.lessonNumber === lessonNumber) {
      const mensagens = await db.chatMessage.findMany({
        where: { sessionId: emAndamento.id },
        orderBy: { createdAt: "asc" },
      });
      const lesson = await db.lesson.findUnique({
        where: { language_number: { language: p.language, number: lessonNumber } },
      });
      return NextResponse.json({
        retomada: true,
        sessionId: emAndamento.id,
        modo: emAndamento.mode,
        licao: {
          numero: lessonNumber,
          nivel: lesson?.level,
          tema: lesson?.theme,
          objetivo: lesson?.objective,
          conteudo: lesson ? JSON.parse(lesson.content) : [],
        },
        mensagens: mensagens.map(formatarMensagem),
      });
    }

    // Nova sessão
    const perfil = await construirPerfilParticipante(p.id);
    const ctx = await obterContextoAula(p.language, lessonNumber, mode, perfil);
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada no catálogo." }, { status: 404 });

    const session = await db.lessonSession.create({
      data: { participantId: p.id, lessonNumber, mode },
    });

    const { texto, provedor, latencyMs } = await gerarTexto(promptAberturaAula(ctx));
    const fb = parseFeedback(texto);

    const msg = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "PROFESSORA",
        content: fb.exibicao,
        correcao: fb.correcao,
        explicacao: fb.explicacao,
        exemplo: fb.exemplo,
        nota: fb.nota,
        proximoExercicio: fb.proximoExercicio,
        provider: provedor,
        latencyMs,
      },
    });

    await db.lessonSession.update({
      where: { id: session.id },
      data: { provider: provedor },
    });

    return NextResponse.json({
      retomada: false,
      sessionId: session.id,
      modo: mode,
      licao: {
        numero: lessonNumber,
        nivel: ctx.nivel,
        tema: ctx.tema,
        objetivo: ctx.objetivo,
        conteudo: ctx.conteudo,
      },
      mensagens: [formatarMensagem(msg)],
    });
  } catch (e) {
    console.error("[licao/iniciar]", e);
    return NextResponse.json({ erro: "Erro ao iniciar a lição." }, { status: 500 });
  }
}
