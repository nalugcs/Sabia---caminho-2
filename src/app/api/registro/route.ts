import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarCodigoParticipante } from "@/lib/pesquisa";
import { registroSchema, mensagemDeErro } from "@/lib/schemas";
import { permitir, ipDe } from "@/lib/security";

export async function POST(req: Request) {
  try {
    // rate limit: 20 cadastros por minuto por IP (Fase A)
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 20)) {
      return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
    }

    const analise = registroSchema.safeParse(await req.json());
    if (!analise.success) {
      return NextResponse.json({ erro: mensagemDeErro(analise) }, { status: 400 });
    }
    const { firstName, lastName, age, selfLevel, language } = analise.data;
    // (tceAccepted: true garantido pelo schema — z.literal(true))

    // código único de participante (retry em caso de colisão raríssima)
    let code = gerarCodigoParticipante();
    for (let i = 0; i < 5; i++) {
      const existe = await db.participant.findUnique({ where: { code } });
      if (!existe) break;
      code = gerarCodigoParticipante();
    }

    const participante = await db.participant.create({
      data: {
        code,
        firstName,
        lastName,
        age,
        selfLevel,
        language,
        tceAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({ code: participante.code });
  } catch (e) {
    console.error("[registro]", e);
    return NextResponse.json({ erro: "Erro ao registrar. Tente novamente." }, { status: 500 });
  }
}
