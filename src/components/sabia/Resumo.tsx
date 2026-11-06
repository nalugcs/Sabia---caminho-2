"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, formatarTempo, type ResultadoEncerrar, type Exercicio } from "./tipos";
import { Likert } from "./Likert";
import { BotaoCopiar } from "./BotaoCopiar";
import { MODOS } from "@/lib/pesquisa";
import {
  ClipboardList,
  Star,
  Target,
  Timer,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Layers,
  Check,
  X,
  ListChecks,
} from "lucide-react";

interface Props {
  codigo: string;
  sessionId: string;
  lessonNumber: number;
  mode: string;
  resultado: ResultadoEncerrar;
  onPraticarOutroModo: () => void; // volta à escolha de modos da MESMA lição
  onRepetirAtividade: () => void; // repete o mesmo modo
  onAvancarLicao: () => void; // conclui a lição e vai à próxima
  onVoltarTrilha: () => void;
}

const ITENS_MICRO: { campo: "ml1" | "ml2" | "ml3" | "ml4"; codigo: string; afirmacao: string }[] = [
  { campo: "ml1", codigo: "ML1", afirmacao: "A atividade de hoje foi útil para o meu aprendizado." },
  { campo: "ml2", codigo: "ML2", afirmacao: "O feedback desta atividade foi claro." },
  { campo: "ml3", codigo: "ML3", afirmacao: "A dificuldade desta atividade foi adequada." },
  { campo: "ml4", codigo: "ML4", afirmacao: "A prática desta atividade foi realista." },
];

export function Resumo({
  codigo,
  sessionId,
  lessonNumber,
  mode,
  resultado,
  onPraticarOutroModo,
  onRepetirAtividade,
  onAvancarLicao,
  onVoltarTrilha,
}: Props) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [tempoMin, setTempoMin] = useState(String(Math.max(1, Math.round(resultado.tempoSec / 60))));
  const [enviando, setEnviando] = useState(false);
  const [respondido, setRespondido] = useState(false);
  const [avancando, setAvancando] = useState(false);

  const completo = ITENS_MICRO.every((i) => respostas[i.campo] != null);
  const m = resultado.metricas;
  const eExercicios = m.tipo === "exercicios";
  const exerciciosRespondidos = (resultado.exercicios || []).filter((e) => e.respondida);

  async function enviarMicro() {
    setEnviando(true);
    try {
      await chamarAPI("/api/questionario/micro", {
        sessionId,
        ml1: respostas.ml1,
        ml2: respostas.ml2,
        ml3: respostas.ml3,
        ml4: respostas.ml4,
        tempoMin: Number(tempoMin) || null,
      });
      setRespondido(true);
      toast({ title: "Questionário registrado — obrigada!" });
    } catch (e) {
      toast({ title: "Erro ao registrar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  }

  async function avancar() {
    setAvancando(true);
    try {
      await chamarAPI("/api/trilha/avancar", { code: codigo, lessonNumber });
      toast({ title: `Lição ${lessonNumber} concluída!` });
      onAvancarLicao();
    } catch (e) {
      toast({ title: "Não foi possível avançar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAvancando(false);
    }
  }

  return (
    <div className="min-h-screen bg-creme">
      <header className="bg-verde text-creme">
        <div className="mx-auto max-w-2xl px-6 py-7">
          <Badge className="bg-amarelo text-verde-d hover:bg-amarelo font-semibold">
            {eExercicios ? "Atividade concluída" : "Conversa encerrada"} · Lição {lessonNumber}
          </Badge>
          <h1 className="fonte-marca text-2xl sm:text-3xl font-semibold mt-2">Resumo da atividade</h1>
          <p className="mt-1.5 text-sm text-creme/75">
            Confira seu desempenho real, responda 4 pergadinhas rápidas e escolha o que fazer a seguir.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {/* MÉTRICAS EXATAS — refletem exatamente as respostas realizadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {eExercicios ? (
            <>
              <CardMetrica
                icone={Target}
                rotulo="Acertos"
                valor={`${m.acertos} de ${m.total}`}
                destaque
              />
              <CardMetrica icone={Star} rotulo="Aproveitamento" valor={`${m.percentual}%`} destaque />
              <CardMetrica icone={Timer} rotulo="Tempo em tela" valor={formatarTempo(resultado.tempoSec)} />
              <CardMetrica icone={Lightbulb} rotulo="Dicas usadas" valor={String(resultado.dicas)} />
            </>
          ) : (
            <>
              <CardMetrica icone={TrendingUp} rotulo="Interações" valor={String(m.interacoes)} />
              <CardMetrica icone={Star} rotulo="Nota média" valor={`${m.notaMedia.toFixed(1)}/10`} />
              <CardMetrica icone={Timer} rotulo="Tempo em tela" valor={formatarTempo(resultado.tempoSec)} />
              <CardMetrica icone={Lightbulb} rotulo="Dicas usadas" valor={String(resultado.dicas)} />
            </>
          )}
        </div>

        {eExercicios && resultado.incompletas > 0 && (
          <div className="rounded-xl bg-areia/70 border border-verde/20 px-4 py-3 text-sm text-tinta/80">
            {resultado.incompletas} questão(ões) ficaram sem resposta e <b>não contaram</b> no resultado —
            concluí-las conta como prática nova ao repetir a atividade.
          </div>
        )}

        {/* detalhamento por questão (exercícios) */}
        {eExercicios && exerciciosRespondidos.length > 0 && (
          <Card className="bg-white border-verde/20">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 font-semibold text-[15px]">
                <ListChecks className="w-5 h-5 text-ruivo" aria-hidden />
                Questão por questão
              </div>
              <ul className="mt-3 divide-y divide-border/70">
                {exerciciosRespondidos.map((e: Exercicio, i: number) => (
                  <li key={e.id} className="py-2.5 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      aria-hidden>
                      {e.correta ? (
                        <Check className="w-5 h-5 text-verde" />
                      ) : (
                        <X className="w-5 h-5 text-ruivo" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-tinta/60 font-mono">Q{i + 1} · {e.tipo}</div>
                      <div className="text-[15px] leading-snug">{e.enunciado}</div>
                      {e.correta !== true && e.gabarito && (
                        <div className="mt-1 text-sm">
                          <span className="text-tinta/60">Gabarito: </span>
                          <span className="font-medium">{gabaritoTexto(e)}</span>
                        </div>
                      )}
                      {e.correta !== true && e.respostaAluno != null && (
                        <div className="text-sm text-tinta/60">
                          Sua resposta: <span className="font-medium">{respostaTexto(e)}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* feedback final da professora */}
        <Card className="bg-white">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 font-semibold text-[15px]">
              <TrendingUp className="w-5 h-5 text-verde" aria-hidden />
              Feedback da professora
            </div>
            <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap text-tinta/90">
              {resultado.feedbackFinal}
            </div>
          </CardContent>
        </Card>

        {/* ESCOLHAS PÓS-ATIVIDADE (feedback item 6): continuar na mesma lição */}
        <Card className="bg-white border-verde/30">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 fonte-marca text-lg font-semibold">
              <Layers className="w-5 h-5 text-ruivo" aria-hidden />
              O que você quer fazer agora?
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Você decide seu ritmo: praticar mais nesta lição, repetir esta atividade ou avançar.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={onPraticarOutroModo}
                className="h-auto py-3 flex flex-col items-center gap-1.5 border-verde/40 text-verde hover:bg-areia/60"
              >
                <Layers className="w-5 h-5" aria-hidden />
                <span className="text-sm font-semibold">Praticar outra modalidade</span>
                <span className="text-[11px] text-tinta/60 font-normal">
                  {MODOS.filter((mo) => mo.id !== mode).map((mo) => mo.label).join(" · ")}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={onRepetirAtividade}
                className="h-auto py-3 flex flex-col items-center gap-1.5 border-verde/40 text-verde hover:bg-areia/60"
              >
                <RefreshCw className="w-5 h-5" aria-hidden />
                <span className="text-sm font-semibold">Repetir esta atividade</span>
                <span className="text-[11px] text-tinta/60 font-normal">novas questões, mesmo modo</span>
              </Button>
              {resultado.acoes.podeAvancar ? (
                <Button
                  onClick={avancar}
                  disabled={avancando}
                  className="h-auto py-3 flex flex-col items-center gap-1.5 bg-ruivo hover:bg-ruivo/90 text-creme"
                >
                  <ArrowRight className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-semibold">Concluir lição e avançar</span>
                  <span className="text-[11px] text-creme/70 font-normal">
                    abre a lição {resultado.acoes.proximaLicao}
                  </span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onVoltarTrilha}
                  className="h-auto py-3 flex flex-col items-center gap-1.5 border-verde/40 text-verde hover:bg-areia/60"
                >
                  <ArrowRight className="w-5 h-5" aria-hidden />
                  <span className="text-sm font-semibold">
                    {resultado.acoes.revisao ? "Voltar à trilha (revisão)" : "Voltar à trilha"}
                  </span>
                  <span className="text-[11px] text-tinta/60 font-normal">
                    {resultado.acoes.revisao ? "lição já concluída" : "pratique outro modo antes de avançar"}
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* micro-questionário */}
        {!respondido ? (
          <Card className="border-verde/30 bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 fonte-marca text-lg font-semibold">
                <ClipboardList className="w-5 h-5 text-ruivo" aria-hidden />
                Sua percepção desta atividade
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Marque de 1 (discordo totalmente) a 5 (concordo totalmente). Leva ~30 segundos.
              </p>
              <div className="mt-2 divide-y divide-border/70">
                {ITENS_MICRO.map((i) => (
                  <Likert
                    key={i.campo}
                    codigo={i.codigo}
                    afirmacao={i.afirmacao}
                    valor={respostas[i.campo] ?? null}
                    onChange={(v) => setRespostas((r) => ({ ...r, [i.campo]: v }))}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="tempo" className="text-[15px] shrink-0">
                  Tempo aproximado gasto na atividade (min):
                </label>
                <Input
                  id="tempo"
                  inputMode="numeric"
                  value={tempoMin}
                  onChange={(e) => setTempoMin(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="w-20 bg-white"
                />
              </div>
              <div className="mt-5 flex justify-end">
                <Button
                  onClick={enviarMicro}
                  disabled={!completo || enviando}
                  className="bg-verde hover:bg-verde/90 text-creme"
                >
                  {enviando ? "Registrando..." : "Registrar respostas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-verde/40 bg-verde/5">
            <CardContent className="p-5 text-center">
              <div className="fonte-marca text-lg font-semibold">Registrado — obrigada!</div>
              <p className="mt-1 text-sm text-tinta/70">Questionário desta atividade salvo com sucesso.</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col items-center gap-3 pb-4">
          <Button
            size="lg"
            onClick={onVoltarTrilha}
            className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-8 h-12"
          >
            Ver minha trilha
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden />
          </Button>
          <div className="flex items-center gap-2 text-xs text-tinta/60">
            <span className="font-mono">{codigo}</span>
            <BotaoCopiar valor={codigo} texto={`Meu código no Sabiá: ${codigo}`} rotulo="Copiar código" />
          </div>
        </div>
      </main>
    </div>
  );
}

function CardMetrica({
  icone: Icone,
  rotulo,
  valor,
  destaque,
}: {
  icone: typeof Star;
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <Card className={`bg-white ${destaque ? "border-verde/40" : "border-verde/20"}`}>
      <CardContent className="p-4">
        <Icone className="w-5 h-5 text-ruivo" aria-hidden />
        <div className={`mt-1.5 font-bold fonte-marca ${destaque ? "text-2xl text-verde" : "text-2xl"}`}>{valor}</div>
        <div className="text-xs text-muted-foreground">{rotulo}</div>
      </CardContent>
    </Card>
  );
}

function gabaritoTexto(e: Exercicio): string {
  if (Array.isArray(e.gabarito)) {
    return (e.gabarito as { esq: string; dir: string }[]).map((p) => `${p.esq} → ${p.dir}`).join("; ");
  }
  return String(e.gabarito ?? "—");
}

function respostaTexto(e: Exercicio): string {
  const r = e.respostaAluno;
  if (Array.isArray(r)) {
    if (r.length > 0 && typeof r[0] === "object" && r[0] !== null && "esq" in (r[0] as object)) {
      return (r as { esq: string; dir: string }[]).map((p) => `${p.esq} → ${p.dir}`).join("; ");
    }
    return (r as string[]).join(" ");
  }
  return String(r ?? "—");
}
