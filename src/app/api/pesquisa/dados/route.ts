import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PIN_PESQUISADORA, TRILHA_LICOES } from "@/lib/pesquisa";
import { pinCorreto, permitir, ipDe } from "@/lib/security";

// Painel da pesquisadora — dados pseudonimizados (código, nunca nome).
export async function GET(req: Request) {
  try {
    // rate limit: 10 tentativas de PIN por minuto por IP (Fase A)
    if (!permitir(`${new URL(req.url).pathname}:${ipDe(req)}`, 10)) {
      return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
    }
    const pin = req.headers.get("x-researcher-pin") || "";
    if (!PIN_PESQUISADORA || !pinCorreto(pin, PIN_PESQUISADORA)) {
      return NextResponse.json({ erro: "PIN inválido." }, { status: 401 });
    }

    const participantes = await db.participant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        sessions: {
          where: { status: "ENCERRADA" },
          orderBy: { lessonNumber: "asc" },
          select: { lessonNumber: true, score: true, correctCount: true, durationSec: true },
        },
        finalAnswer: { select: { dg1: true, dg2: true } },
      },
    });

    const lista = participantes.map((p) => {
      const notas = p.sessions.map((s) => s.score || 0);
      const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
      return {
        codigo: p.code,
        idioma: p.language,
        idade: p.age,
        nivelDeclarado: p.selfLevel,
        status: p.status,
        criadoEm: p.createdAt,
        concluidas: p.sessions.length,
        mediaNotas: media != null ? Math.round(media * 10) / 10 : null,
        evolucao: p.sessions.map((s) => ({ licao: s.lessonNumber, nota: s.score })),
        questionarioFinal: !!p.finalAnswer,
      };
    });

    // métricas agregadas por lição
    const sessoes = await db.lessonSession.findMany({
      where: { status: "ENCERRADA" },
      select: { lessonNumber: true, score: true, correctCount: true, durationSec: true, interactionCount: true, hintsUsed: true },
    });
    const porLicao: Record<number, { n: number; somaNota: number; somaAcertos: number; somaTempo: number }> = {};
    for (const s of sessoes) {
      const g = (porLicao[s.lessonNumber] ||= { n: 0, somaNota: 0, somaAcertos: 0, somaTempo: 0 });
      g.n++;
      g.somaNota += s.score || 0;
      g.somaAcertos += s.correctCount;
      g.somaTempo += s.durationSec || 0;
    }
    const metricasPorLicao = Object.entries(porLicao)
      .map(([licao, g]) => ({
        licao: Number(licao),
        n: g.n,
        mediaNota: Math.round((g.somaNota / g.n) * 10) / 10,
        mediaAcertos: Math.round((g.somaAcertos / g.n) * 10) / 10,
        mediaTempoMin: Math.round((g.somaTempo / g.n / 60) * 10) / 10,
      }))
      .sort((a, b) => a.licao - b.licao);

    // micro-questionários: médias ML1..ML4 por lição
    const micros = await db.microQuestionnaire.findMany();
    const microPorLicao: Record<number, { n: number; ml: [number, number, number, number] }> = {};
    for (const m of micros) {
      const g = (microPorLicao[m.lessonNumber] ||= { n: 0, ml: [0, 0, 0, 0] });
      g.n++;
      g.ml[0] += m.ml1;
      g.ml[1] += m.ml2;
      g.ml[2] += m.ml3;
      g.ml[3] += m.ml4;
    }
    const microResumo = Object.entries(microPorLicao)
      .map(([licao, g]) => ({
        licao: Number(licao),
        n: g.n,
        ml1: Math.round((g.ml[0] / g.n) * 10) / 10,
        ml2: Math.round((g.ml[1] / g.n) * 10) / 10,
        ml3: Math.round((g.ml[2] / g.n) * 10) / 10,
        ml4: Math.round((g.ml[3] / g.n) * 10) / 10,
      }))
      .sort((a, b) => a.licao - b.licao);

    // questionário final: médias por subescala
    const finais = await db.finalQuestionnaire.findMany();
    const subescalas: { prefixo: string; itens: string[] }[] = [
      { prefixo: "UT", itens: ["ut1", "ut2", "ut3", "ut4"] },
      { prefixo: "CF", itens: ["cf1", "cf2", "cf3", "cf4"] },
      { prefixo: "DF", itens: ["df1", "df2", "df3", "df4"] },
      { prefixo: "RE", itens: ["re1", "re2", "re3", "re4"] },
      { prefixo: "CT", itens: ["ct1", "ct2", "ct3", "ct4"] },
    ];
    const questionarioResumo =
      finais.length > 0
        ? subescalas.map((s) => {
            const media =
              s.itens.reduce((acc, k) => {
                const soma = finais.reduce((a, f) => a + ((f as unknown as Record<string, number>)[k] || 0), 0);
                return acc + soma / finais.length;
              }, 0) / s.itens.length;
            return { subescala: s.prefixo, media: Math.round(media * 10) / 10 };
          })
        : [];
    const dg = finais.length
      ? {
          satisfacao: Math.round((finais.reduce((a, f) => a + f.dg1, 0) / finais.length) * 10) / 10,
          recomendacao: Math.round((finais.reduce((a, f) => a + f.dg2, 0) / finais.length) * 10) / 10,
        }
      : null;

    // confiabilidade: incidentes por provedor
    const incidentes = await db.incidentLog.groupBy({
      by: ["provider", "type"],
      _count: { _all: true },
    });

    return NextResponse.json({
      resumo: {
        totalParticipantes: participantes.length,
        finalizados: participantes.filter((p) => p.status === "FINALIZADO").length,
        totalLicoes: sessoes.length,
        idiomas: {
          Ingles: lista.filter((p) => p.idioma === "Inglês").length,
          Espanhol: lista.filter((p) => p.idioma === "Espanhol").length,
          Frances: lista.filter((p) => p.idioma === "Francês").length,
        },
      },
      participantes: lista,
      metricasPorLicao,
      microResumo,
      questionarioResumo,
      dg,
      incidentes,
      trilha: TRILHA_LICOES,
    });
  } catch (e) {
    console.error("[pesquisa/dados]", e);
    return NextResponse.json({ erro: "Erro ao carregar dados." }, { status: 500 });
  }
}
