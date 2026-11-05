"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { chamarAPI } from "./tipos";
import { Likert } from "./Likert";
import { Feather, ClipboardCheck } from "lucide-react";

interface Props {
  codigo: string;
  onConcluido: () => void;
  onVoltar: () => void;
}

type CampoLikert =
  | "ut1" | "ut2" | "ut3" | "ut4"
  | "cf1" | "cf2" | "cf3" | "cf4"
  | "df1" | "df2" | "df3" | "df4"
  | "re1" | "re2" | "re3" | "re4"
  | "ct1" | "ct2" | "ct3" | "ct4";

interface ItemLikert { campo: CampoLikert; codigo: string; afirmacao: string }

const SUBESCALAS: { titulo: string; itens: ItemLikert[] }[] = [
  {
    titulo: "C.1 — Utilidade percebida (UT)",
    itens: [
      { campo: "ut1", codigo: "UT1", afirmacao: "O aplicativo me ajudou a praticar conteúdo relevante para conversas reais." },
      { campo: "ut2", codigo: "UT2", afirmacao: "As atividades propostas serviram ao meu objetivo de aprendizado." },
      { campo: "ut3", codigo: "UT3", afirmacao: "Considero o aplicativo uma ferramenta útil para estudar idiomas." },
      { campo: "ut4", codigo: "UT4", afirmacao: "Eu usaria o aplicativo no meu dia a dia de estudo." },
    ],
  },
  {
    titulo: "C.2 — Clareza do feedback (CF)",
    itens: [
      { campo: "cf1", codigo: "CF1", afirmacao: "As correções feitas pelo aplicativo foram fáceis de entender." },
      { campo: "cf2", codigo: "CF2", afirmacao: "O feedback indicava claramente o que eu deveria melhorar." },
      { campo: "cf3", codigo: "CF3", afirmacao: "As sugestões de frases melhores me ajudaram a corrigir meus erros." },
      { campo: "cf4", codigo: "CF4", afirmacao: "A nota atribuída às minhas respostas era compreensível e justa." },
    ],
  },
  {
    titulo: "C.3 — Dificuldade percebida (DF)",
    itens: [
      { campo: "df1", codigo: "DF1", afirmacao: "O nível de dificuldade das lições foi adequado ao meu nível." },
      { campo: "df2", codigo: "DF2", afirmacao: "A adaptação do conteúdo ao meu perfil tornou as atividades mais alcançáveis." },
      { campo: "df3", codigo: "DF3", afirmacao: "As lições me desafiaram sem me desmotivar." },
      { campo: "df4", codigo: "DF4", afirmacao: "O ritmo das lições foi apropriado para aprender." },
    ],
  },
  {
    titulo: "C.4 — Realismo das conversas (RE)",
    itens: [
      { campo: "re1", codigo: "RE1", afirmacao: "As conversas simularam situações realistas do dia a dia." },
      { campo: "re2", codigo: "RE2", afirmacao: "Os temas das lições corresponderam a contextos que encontro de fato." },
      { campo: "re3", codigo: "RE3", afirmacao: "A interação com a inteligência artificial pareceu uma conversa natural." },
      { campo: "re4", codigo: "RE4", afirmacao: "Me senti como se estivesse me comunicando de verdade no idioma." },
    ],
  },
  {
    titulo: "C.5 — Contribuição para o aprendizado (CT)",
    itens: [
      { campo: "ct1", codigo: "CT1", afirmacao: "Percebo que meu vocabulário ampliou com o uso do aplicativo." },
      { campo: "ct2", codigo: "CT2", afirmacao: "Percebo mais segurança para me expressar no idioma." },
      { campo: "ct3", codigo: "CT3", afirmacao: "A prática com o aplicativo contribuiu para a minha evolução ao longo das lições." },
      { campo: "ct4", codigo: "CT4", afirmacao: "No geral, o aplicativo contribuiu para o meu aprendizado de idiomas." },
    ],
  },
];

const COMPARACAO = [
  "Muito pior", "Pior", "Igual", "Melhor", "Muito melhor", "Nunca usei outro aplicativo",
];

export function QuestionarioFinal({ codigo, onConcluido, onVoltar }: Props) {
  const [likert, setLikert] = useState<Partial<Record<CampoLikert, number>>>({});
  const [dg1, setDg1] = useState<number | null>(null);
  const [dg2, setDg2] = useState<number | null>(null);
  const [dg3, setDg3] = useState("");
  const [qa1, setQa1] = useState("");
  const [qa2, setQa2] = useState("");
  const [qa3, setQa3] = useState("");
  const [enviando, setEnviando] = useState(false);

  const todosLikert = SUBESCALAS.flatMap((s) => s.itens).every((i) => likert[i.campo] != null);
  const podeEnviar = todosLikert && dg1 != null && dg2 != null && dg3 !== "";

  async function enviar() {
    setEnviando(true);
    try {
      await chamarAPI("/api/questionario/final", {
        code: codigo,
        ...likert,
        dg1,
        dg2,
        dg3,
        qa1,
        qa2,
        qa3,
      });
      onConcluido();
    } catch (e) {
      toast({ title: "Erro ao enviar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-creme">
      <header className="bg-verde text-creme">
        <div className="mx-auto max-w-2xl px-6 py-7">
          <Badge className="bg-amarelo text-verde-d hover:bg-amarelo font-semibold">Encerramento</Badge>
          <h1 className="fonte-marca text-2xl sm:text-3xl font-semibold mt-2">
            Questionário de percepção de uso
          </h1>
          <p className="mt-1.5 text-sm text-creme/75">
            20 afirmações (1 = discordo totalmente · 5 = concordo totalmente), avaliação global e
            três perguntas abertas. ~8–10 minutos. Não há resposta certa ou errada.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {SUBESCALAS.map((s) => (
          <Card key={s.titulo} className="bg-white border-verde/20">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 fonte-marca text-lg font-semibold">
                <Feather className="w-4 h-4 text-ruivo" aria-hidden />
                {s.titulo}
              </div>
              <div className="mt-1 divide-y divide-border/70">
                {s.itens.map((i) => (
                  <Likert
                    key={i.campo}
                    codigo={i.codigo}
                    afirmacao={i.afirmacao}
                    valor={likert[i.campo] ?? null}
                    onChange={(v) => setLikert((l) => ({ ...l, [i.campo]: v }))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Seção D — avaliação global */}
        <Card className="bg-white border-verde/20">
          <CardContent className="p-5 sm:p-6">
            <div className="fonte-marca text-lg font-semibold">Seção D — Avaliação global</div>

            <div className="mt-3">
              <div className="text-[15px] font-medium">
                DG1 — Satisfação geral com o aplicativo (1 = muito insatisfeito · 5 = muito satisfeito)
              </div>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDg1(n)}
                    aria-label={`Satisfação ${n}`}
                    className={`h-11 w-11 rounded-full border font-semibold transition-all ${
                      dg1 === n ? "bg-verde text-creme border-verde scale-105" : "bg-white hover:border-verde/60"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[15px] font-medium">
                DG2 — Quanto você recomendaria o aplicativo a um colega? (0 = não recomendaria · 10 = recomendaria muito)
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDg2(n)}
                    aria-label={`Recomendação ${n}`}
                    className={`h-10 w-10 rounded-lg border font-semibold transition-all ${
                      dg2 === n ? "bg-ruivo text-creme border-ruivo scale-105" : "bg-white hover:border-ruivo/60"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[15px] font-medium">
                DG3 — Comparado a outros aplicativos de idiomas que você já usou, o Sabiá é:
              </div>
              <RadioGroup value={dg3} onValueChange={setDg3} className="mt-2 grid grid-cols-2 gap-2">
                {COMPARACAO.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm has-[button[data-state=checked]]:border-verde has-[button[data-state=checked]]:bg-areia/50">
                    <RadioGroupItem value={c} />
                    {c}
                  </label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Seção E — abertas */}
        <Card className="bg-white border-verde/20">
          <CardContent className="p-5 sm:p-6">
            <div className="fonte-marca text-lg font-semibold">Seção E — Questões abertas</div>
            <div className="mt-3 space-y-5">
              {[
                { label: "QA1 — O que você mais gostou no aplicativo? Por quê?", valor: qa1, set: setQa1 },
                { label: "QA2 — O que você mudaria ou acrescentaria no aplicativo? Por quê?", valor: qa2, set: setQa2 },
                {
                  label: "QA3 — Descreva uma situação em que o feedback do aplicativo ajudou (ou não ajudou) você a corrigir um erro.",
                  valor: qa3,
                  set: setQa3,
                },
              ].map((q) => (
                <div key={q.label}>
                  <label className="text-[15px] font-medium" htmlFor={q.label.slice(0, 3)}>
                    {q.label}
                  </label>
                  <Textarea
                    id={q.label.slice(0, 3)}
                    value={q.valor}
                    onChange={(e) => q.set(e.target.value)}
                    className="mt-1.5 bg-white min-h-[90px]"
                    placeholder="Responda com suas palavras (opcional, mas ajuda muito a pesquisa)..."
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4">
          <Button variant="outline" onClick={onVoltar}>Voltar à trilha</Button>
          <Button
            onClick={enviar}
            disabled={!podeEnviar || enviando}
            className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-8 h-12"
          >
            <ClipboardCheck className="w-5 h-5 mr-1.5" aria-hidden />
            {enviando ? "Enviando..." : "Concluir participação"}
          </Button>
        </div>
      </main>
    </div>
  );
}
