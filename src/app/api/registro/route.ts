import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { IDIOMAS, gerarCodigoParticipante } from "@/lib/pesquisa";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const age = Number(body.age);
    const selfLevel = Number(body.selfLevel);
    const language = String(body.language || "");
    const tceAccepted = body.tceAccepted === true;

    if (!firstName || !lastName) {
      return NextResponse.json({ erro: "Informe nome e sobrenome." }, { status: 400 });
    }
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      return NextResponse.json(
        { erro: "A pesquisa é restrita a participantes maiores de 18 anos." },
        { status: 400 }
      );
    }
    if (!Number.isInteger(selfLevel) || selfLevel < 1 || selfLevel > 5) {
      return NextResponse.json({ erro: "Selecione seu nível (1 a 5)." }, { status: 400 });
    }
    if (!IDIOMAS.includes(language as (typeof IDIOMAS)[number])) {
      return NextResponse.json({ erro: "Selecione um dos três idiomas." }, { status: 400 });
    }
    if (!tceAccepted) {
      return NextResponse.json(
        { erro: "É necessário aceitar o Termo de Consentimento (TCLE)." },
        { status: 400 }
      );
    }

    // código único de participante
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
