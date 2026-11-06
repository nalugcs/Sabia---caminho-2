import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TRILHA_LICOES, QUESTOES_POR_MODO } from "@/lib/pesquisa";
import { iniciarLicaoSchema, mensagemDeErro } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";
import { gerarTexto } from "@/lib/ai/providers";
import { promptAberturaConversa } from "@/lib/ai/prompts";
import { extrairNotaOculta } from "@/lib/ai/parse";
import { gerarLoteExercicios } from "@/lib/ai/exercicios";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem, formatarExercicio } from "@/lib/formatar";

// Inicia (ou retoma) uma atividade de uma lição.
// Modos de exercício (completar/jogo): gera o lote de questões com gabarito no servidor.
// Conversa: abertura natural da professora-IA. Revisão de lições concluídas permitida.
export async function POST(req: Request) {
  try {
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 60)) {
      return NextResponse.json({ erro: "Muitas aberturas em seguida. Aguarde um minuto." }, { status: 429 });
    }
    const analise = iniciarLicaoSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { code, lessonNumber, mode } = analise.data;

    const p = await db.participant.findUnique({ where: { code } });
    if (!p) return NextResponse.json({ erro: "Participante não encontrado." }, { status: 404 });

    const progresso = p.lessonProgress; // lições concluídas (avançadas)

    // Regras de acesso: próxima lição, revisão de concluída, ou retomada em andamento.
    const emAndamento = await db.lessonSession.findFirst({
      where: { participantId: p.id, lessonNumber, status: "EM_ANDAMENTO" },
    });
    if (!emAndamento && lessonNumber > progresso + 1) {
      return NextResponse.json(
        { erro: "Esta lição ainda está bloqueada — siga a trilha na ordem." },
        { status: 400 }
      );
    }
    if (lessonNumber > TRILHA_LICOES) {
      return NextResponse.json({ erro: "Lição inválida." }, { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { language_number: { language: p.language, number: lessonNumber } },
    });
    if (!lesson) return NextResponse.json({ erro: "Lição não encontrada no catálogo." }, { status: 404 });

    const licaoFmt = {
      numero: lessonNumber,
      nivel: lesson.level,
      tema: lesson.theme,
      objetivo: lesson.objective,
      conteudo: JSON.parse(lesson.content) as string[],
    };

    // Retomada de atividade em andamento nesta lição
    if (emAndamento) {
      const mensagens = await db.chatMessage.findMany({
        where: { sessionId: emAndamento.id },
        orderBy: { createdAt: "asc" },
      });
      const exercicios = await db.exercise.findMany({
        where: { sessionId: emAndamento.id },
        orderBy: { ordem: "asc" },
      });
      return NextResponse.json({
        retomada: true,
        revisao: emAndamento.isReview,
        sessionId: emAndamento.id,
        modo: emAndamento.mode,
        licao: licaoFmt,
        mensagens: mensagens.map(formatarMensagem),
        exercicios: exercicios.map(formatarExercicio),
        provedor: emAndamento.provider,
      });
    }

    // Nova atividade
    const eRevisao = lessonNumber <= progresso;
    const perfil = await construirPerfilParticipante(p.id);
    const ctx = await obterContextoAula(p.language, lessonNumber, mode, perfil, p.selfLevel);
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada no catálogo." }, { status: 404 });

    const session = await db.lessonSession.create({
      data: { participantId: p.id, lessonNumber, mode, isReview: eRevisao },
    });

    // Conversa: abertura natural
    if (mode === "conversa") {
      const { texto, provedor, latencyMs } = await gerarTexto(promptAberturaConversa(ctx));
      const { exibicao, nota } = extrairNotaOculta(texto);
      const msg = await db.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "PROFESSORA",
          content: exibicao,
          nota,
          provider: provedor,
          latencyMs,
        },
      });
      await db.lessonSession.update({ where: { id: session.id }, data: { provider: provedor } });
      return NextResponse.json({
        retomada: false,
        revisao: eRevisao,
        sessionId: session.id,
        modo: mode,
        licao: licaoFmt,
        mensagens: [formatarMensagem(msg)],
        exercicios: [],
        provedor,
      });
    }

    // Atividade de exercícios: gera o lote (IA → fallback local)
    const quantidade = QUESTOES_POR_MODO[mode] ?? 8;
    const { exercicios, provedor } = await gerarLoteExercicios(ctx, quantidade, mode);
    const criados = await Promise.all(
      exercicios.map((ex, i) =>
        db.exercise.create({
          data: {
            sessionId: session.id,
            ordem: i + 1,
            tipo: ex.tipo,
            dificuldade: ex.dificuldade,
            enunciado: ex.enunciado,
            alternativas: ex.alternativas || ex.palavras ? JSON.stringify(ex.alternativas ?? ex.palavras) : null,
            pares: ex.pares ? JSON.stringify(ex.pares) : null,
            gabarito: ex.gabarito,
            tolerancias: ex.tolerancias && ex.tolerancias.length > 0 ? JSON.stringify(ex.tolerancias) : null,
            dica: ex.dica,
            explicacao: ex.explicacao,
          },
        })
      )
    );
    await db.lessonSession.update({ where: { id: session.id }, data: { provider: provedor } });

    return NextResponse.json({
      retomada: false,
      revisao: eRevisao,
      sessionId: session.id,
      modo: mode,
      licao: licaoFmt,
      mensagens: [],
      exercicios: criados.map(formatarExercicio),
      provedor,
    });
  } catch (e) {
    console.error("[licao/iniciar]", e);
    return NextResponse.json({ erro: "Erro ao iniciar a lição." }, { status: 500 });
  }
}
