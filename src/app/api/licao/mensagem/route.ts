import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mensagemSchema, mensagemDeErro } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";
import { gerarTexto } from "@/lib/ai/providers";
import { promptMensagemConversa } from "@/lib/ai/prompts";
import { extrairNotaOculta } from "@/lib/ai/parse";
import { construirPerfilParticipante, obterContextoAula } from "@/lib/ai/personalizacao";
import { formatarMensagem } from "@/lib/formatar";

// Envia a mensagem do aluno no modo CONVERSA e devolve a resposta natural
// da professora-IA (correção breve integrada, nota oculta para métricas).
export async function POST(req: Request) {
  try {
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 60)) {
      return NextResponse.json({ erro: "Muitas mensagens em seguida. Aguarde um pouco." }, { status: 429 });
    }
    const analise = mensagemSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { sessionId, content } = analise.data;

    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: { participant: true },
    });
    if (!session) return NextResponse.json({ erro: "Sessão não encontrada." }, { status: 404 });
    if (session.status !== "EM_ANDAMENTO") {
      return NextResponse.json({ erro: "Esta atividade já foi encerrada." }, { status: 409 });
    }
    if (session.mode !== "conversa" && session.mode !== "escrita") {
      return NextResponse.json(
        { erro: "Esta rota é só do modo conversa — use /api/licao/atividade/responder para exercícios." },
        { status: 400 }
      );
    }

    // persiste a mensagem do aluno
    await db.chatMessage.create({ data: { sessionId, role: "ALUNO", content } });

    const historico = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    const perfil = await construirPerfilParticipante(session.participantId);
    const ctx = await obterContextoAula(
      session.participant.language,
      session.lessonNumber,
      session.mode,
      perfil,
      session.participant.selfLevel
    );
    if (!ctx) return NextResponse.json({ erro: "Lição não encontrada." }, { status: 404 });

    const { texto, provedor, latencyMs } = await gerarTexto(
      promptMensagemConversa(ctx, content, historico)
    );
    const { exibicao, nota } = extrairNotaOculta(texto);

    const msg = await db.chatMessage.create({
      data: {
        sessionId,
        role: "PROFESSORA",
        content: exibicao,
        nota,
        provider: provedor,
        latencyMs,
      },
    });

    // métricas por interação: uma nota por mensagem do aluno
    const acertou = nota != null && nota >= 7 ? 1 : 0;
    await db.lessonSession.update({
      where: { id: sessionId },
      data: {
        interactionCount: { increment: 1 },
        correctCount: { increment: acertou },
        provider: provedor,
      },
    });

    return NextResponse.json({ mensagem: formatarMensagem(msg), acertou });
  } catch (e) {
    console.error("[licao/mensagem]", e);
    return NextResponse.json({ erro: "Erro ao processar a resposta. Tente reenviar." }, { status: 500 });
  }
}
