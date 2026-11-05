import { db } from "@/lib/db";
import { PIN_PESQUISADORA } from "@/lib/pesquisa";

// Exportação CSV pseudonimizada para análise (código, nunca nome).
// ?tipo=metricas | micro | final
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pin = req.headers.get("x-researcher-pin") || "";
    const tipo = url.searchParams.get("tipo") || "metricas";
    if (!PIN_PESQUISADORA || pin !== PIN_PESQUISADORA) {
      return new Response("PIN inválido.", { status: 401 });
    }

    let cabecalho: string[] = [];
    let linhas: string[][] = [];

    if (tipo === "metricas") {
      const sessoes = await db.lessonSession.findMany({
        where: { status: "ENCERRADA" },
        include: { participant: true, micro: true },
        orderBy: [{ participant: { code: "asc" } }, { lessonNumber: "asc" }],
      });
      cabecalho = [
        "codigo", "idioma", "idade", "nivel_declarado", "licao", "nivel_licao", "modo",
        "nota", "acertos", "interacoes", "dicas", "tempo_seg", "provedor", "micro_respondido", "data_encerramento",
      ];
      linhas = sessoes.map((s) => [
        s.participant.code,
        s.participant.language,
        String(s.participant.age),
        String(s.participant.selfLevel),
        String(s.lessonNumber),
        s.participant.language === "" ? "" : nivelFaixa(s.lessonNumber),
        s.mode,
        String(s.score ?? ""),
        String(s.correctCount),
        String(s.interactionCount),
        String(s.hintsUsed),
        String(s.durationSec ?? ""),
        s.provider || "",
        s.micro ? "1" : "0",
        (s.endedAt || s.startedAt).toISOString(),
      ]);
    } else if (tipo === "micro") {
      const micros = await db.microQuestionnaire.findMany({
        include: { participant: true },
        orderBy: [{ participant: { code: "asc" } }, { lessonNumber: "asc" }],
      });
      cabecalho = ["codigo", "idioma", "licao", "ml1_utilidade", "ml2_clareza", "ml3_dificuldade", "ml4_realismo", "tempo_min"];
      linhas = micros.map((m) => [
        m.participant.code,
        m.participant.language,
        String(m.lessonNumber),
        String(m.ml1),
        String(m.ml2),
        String(m.ml3),
        String(m.ml4),
        String(m.tempoMin ?? ""),
      ]);
    } else if (tipo === "final") {
      const finais = await db.finalQuestionnaire.findMany({
        include: { participant: true },
        orderBy: { participant: { code: "asc" } },
      });
      cabecalho = [
        "codigo", "idioma", "idade", "nivel_declarado",
        "ut1", "ut2", "ut3", "ut4",
        "cf1", "cf2", "cf3", "cf4",
        "df1", "df2", "df3", "df4",
        "re1", "re2", "re3", "re4",
        "ct1", "ct2", "ct3", "ct4",
        "dg1_satisfacao", "dg2_recomendacao", "dg3_comparacao",
        "qa1", "qa2", "qa3",
      ];
      linhas = finais.map((f) => [
        f.participant.code,
        f.participant.language,
        String(f.participant.age),
        String(f.participant.selfLevel),
        String(f.ut1), String(f.ut2), String(f.ut3), String(f.ut4),
        String(f.cf1), String(f.cf2), String(f.cf3), String(f.cf4),
        String(f.df1), String(f.df2), String(f.df3), String(f.df4),
        String(f.re1), String(f.re2), String(f.re3), String(f.re4),
        String(f.ct1), String(f.ct2), String(f.ct3), String(f.ct4),
        String(f.dg1), String(f.dg2), f.dg3,
        f.qa1 || "", f.qa2 || "", f.qa3 || "",
      ]);
    } else {
      return new Response("Tipo inválido (metricas | micro | final).", { status: 400 });
    }

    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cabecalho.map(esc).join(","), ...linhas.map((l) => l.map(esc).join(","))].join("\n");

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sabia_${tipo}.csv"`,
      },
    });
  } catch (e) {
    console.error("[pesquisa/export]", e);
    return new Response("Erro ao exportar.", { status: 500 });
  }
}

function nivelFaixa(licao: number): string {
  if (licao <= 5) return "Basico";
  if (licao <= 10) return "Intermediario";
  if (licao <= 15) return "Avancado";
  return "Fluente";
}
