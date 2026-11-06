import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { responderSchema, mensagemDeErro } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";
import { gerarTexto } from "@/lib/ai/providers";
import { promptAvaliarDigitada } from "@/lib/ai/prompts";
import { parseVeredito } from "@/lib/ai/parse";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import {
  respostaDigitadaCorreta,
  respostaSelecaoCorreta,
  respostaOrdenacaoCorreta,
  respostaAssociacaoCorreta,
} from "@/lib/avaliacao";
import { formatarExercicio } from "@/lib/formatar";

type Resposta = string | string[] | { esq: string; dir: string }[];

// Responde UM exercício de uma atividade. Avaliação determinística no
// servidor (o gabarito nunca sai antes); respostas digitadas sem casamento
// exato podem ir à IA (veredito estrito) — fallback nunca mente o resultado.
export async function POST(req: Request) {
  try {
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 90)) {
      return NextResponse.json({ erro: "Muitas respostas em seguida. Aguarde um pouco." }, { status: 429 });
    }
    const analise = responderSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { exerciseId, resposta } = analise.data;

    const ex = await db.exercise.findUnique({
      where: { id: exerciseId },
      include: { session: { include: { participant: true } } },
    });
    if (!ex) return NextResponse.json({ erro: "Exercício não encontrado." }, { status: 404 });
    if (ex.session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta atividade já foi encerrada." }, { status: 409 });
    }
    if (ex.respondidoEm) {
      return NextResponse.json({ erro: "Esta questão já foi respondida." }, { status: 409 });
    }

    let correta: boolean;
    let nota: number;
    let explicacao: string = ex.explicacao || "";

    const tolerancias: string[] = ex.tolerancias ? JSON.parse(ex.tolerancias) : [];

    if (ex.tipo === "multipla") {
      correta = respostaSelecaoCorreta(resposta as string, ex.gabarito);
      nota = correta ? 10 : 0;
    } else if (ex.tipo === "ordenar") {
      correta = respostaOrdenacaoCorreta(resposta as string[], ex.gabarito);
      nota = correta ? 10 : 0;
    } else if (ex.tipo === "associar") {
      // gabarito normalizado: [{esq,dir}]; defende-se do formato legado [[esq,dir]]
      const gabaritoPares = (JSON.parse(ex.gabarito) as unknown[]).map((p) =>
        Array.isArray(p) ? { esq: String(p[0]), dir: String(p[1]) } : (p as { esq: string; dir: string })
      );
      correta = respostaAssociacaoCorreta(resposta as { esq: string; dir: string }[], gabaritoPares);
      nota = correta ? 10 : 0;
    } else {
      // digitada: 1) casamento exato/tolerâncias (determinístico)
      correta = respostaDigitadaCorreta(resposta as string, ex.gabarito, tolerancias);
      nota = correta ? 10 : 0;
      // 2) sem casamento exato → veredito da IA (variações linguisticamente corretas)
      if (!correta) {
        const perfil = await construirPerfilParticipante(ex.session.participantId);
        const ctx = await obterContextoAula(
          ex.session.participant.language,
          ex.session.lessonNumber,
          ex.session.mode,
          perfil,
          ex.session.participant.selfLevel
        );
        if (ctx) {
          const { texto } = await gerarTexto(
            promptAvaliarDigitada(ctx, {
              enunciado: ex.enunciado,
              gabarito: ex.gabarito,
              tolerancias,
              resposta: resposta as string,
            }),
            { temperatura: 0.2 }
          );
          const veredito = parseVeredito(texto);
          if (veredito.correta !== null) {
            correta = veredito.correta;
            nota = correta ? 10 : 0;
            if (veredito.explicacao) explicacao = veredito.explicacao;
          }
          // IA indisponível/formato inválido → mantém INCORRETO (nunca "empata" o gabarito)
        }
      }
    }

    // persiste a resposta
    const gravacao = await db.exercise.updateMany({
      where: { id: exerciseId, respondidoEm: null },
      data: {
        respostaAluno: JSON.stringify(resposta),
        correta,
        nota,
        explicacao: explicacao || ex.explicacao,
        respondidoEm: new Date(),
      },
    });
    if (gravacao.count === 0) {
      return NextResponse.json({ erro: "Esta questão já foi respondida." }, { status: 409 });
    }
    const atualizado = await db.exercise.findUniqueOrThrow({ where: { id: exerciseId } });

    // contadores da sessão — fonte de verdade dos números exibidos
    await db.lessonSession.update({
      where: { id: ex.sessionId },
      data: {
        interactionCount: { increment: 1 },
        exercisesTotal: { increment: 1 },
        exercisesCorrect: { increment: correta ? 1 : 0 },
      },
    });

    const totalLote = await db.exercise.count({ where: { sessionId: ex.sessionId } });
    const respondidas = await db.exercise.count({
      where: { sessionId: ex.sessionId, respondidoEm: { not: null } },
    });
    const acertos = await db.exercise.count({
      where: { sessionId: ex.sessionId, correta: true },
    });

    return NextResponse.json({
      exercicio: formatarExercicio(atualizado),
      correta,
      nota,
      gabarito: ex.tipo === "associar" ? JSON.parse(ex.gabarito) : ex.gabarito,
      explicacao: explicacao || ex.explicacao,
      progresso: { respondidas, total: totalLote, acertos },
      concluida: respondidas >= totalLote,
    });
  } catch (e) {
    console.error("[licao/atividade/responder]", e);
    return NextResponse.json({ erro: "Erro ao registrar a resposta." }, { status: 500 });
  }
}
