"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, formatarTempo, type ResultadoEncerrar } from "./tipos";
import { Likert } from "./Likert";
import { ClipboardList, Star, Target, Timer, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

interface Props {
  codigo: string;
  sessionId: string;
  lessonNumber: number;
  resultado: ResultadoEncerrar;
  onVoltarTrilha: () => void;
}

const ITENS_MICRO: { campo: "ml1" | "ml2" | "ml3" | "ml4"; codigo: string; afirmacao: string }[] = [
  { campo: "ml1", codigo: "ML1", afirmacao: "A lição de hoje foi útil para o meu aprendizado." },
  { campo: "ml2", codigo: "ML2", afirmacao: "O feedback desta lição foi claro." },
  { campo: "ml3", codigo: "ML3", afirmacao: "A dificuldade desta lição foi adequada." },
  { campo: "ml4", codigo: "ML4", afirmacao: "A conversa desta lição foi realista." },
];

export function Resumo({ codigo, sessionId, lessonNumber, resultado, onVoltarTrilha }: Props) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [tempoMin, setTempoMin] = useState(String(Math.max(1, Math.round(resultado.tempoSec / 60))));
  const [enviando, setEnviando] = useState(false);
  const [respondido, setRespondido] = useState(false);

  const completo = ITENS_MICRO.every((i) => respostas[i.campo] != null);

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

  return (
    <div className="min-h-screen bg-creme">
      <header className="bg-verde text-creme">
        <div className="mx-auto max-w-2xl px-6 py-7">
          <Badge className="bg-amarelo text-verde-d hover:bg-amarelo font-semibold">Lição {lessonNumber} encerrada</Badge>
          <h1 className="fonte-marca text-2xl sm:text-3xl font-semibold mt-2">Resumo da lição</h1>
          <p className="mt-1.5 text-sm text-creme/75">
            Confira seu desempenho e responda 4 pergatinhas rápidas — fazem parte da pesquisa.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {/* métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icone: Star, rotulo: "Nota final", valor: `${resultado.score.toFixed(1)}/10` },
            { icone: Target, rotulo: "Acertos", valor: `${resultado.acertos} de ${resultado.interacoes}` },
            { icone: Timer, rotulo: "Tempo em tela", valor: formatarTempo(resultado.tempoSec) },
            { icone: Lightbulb, rotulo: "Dicas usadas", valor: String(resultado.dicas) },
          ].map((m) => (
            <Card key={m.rotulo} className="bg-white border-verde/20">
              <CardContent className="p-4">
                <m.icone className="w-5 h-5 text-ruivo" aria-hidden />
                <div className="mt-1.5 text-2xl font-bold fonte-marca">{m.valor}</div>
                <div className="text-xs text-muted-foreground">{m.rotulo}</div>
              </CardContent>
            </Card>
          ))}
        </div>

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

        {/* micro-questionário */}
        {!respondido ? (
          <Card className="border-verde/30 bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 fonte-marca text-lg font-semibold">
                <ClipboardList className="w-5 h-5 text-ruivo" aria-hidden />
                Sua percepção desta lição
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
                  Tempo aproximado gasto na lição (min):
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
              <p className="mt-1 text-sm text-tinta/70">
                Questionário desta lição salvo com sucesso.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pb-4">
          <Button
            size="lg"
            onClick={onVoltarTrilha}
            disabled={!respondido && false}
            className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-8 h-12"
          >
            {lessonNumber >= 10 ? "Ir para o encerramento" : "Voltar à trilha"}
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden />
          </Button>
        </div>
      </main>
    </div>
  );
}
