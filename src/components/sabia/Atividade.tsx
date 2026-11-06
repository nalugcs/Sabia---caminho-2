"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, type Exercicio, type RespostaExercicio } from "./tipos";
import {
  Check,
  X,
  Lightbulb,
  ChevronRight,
  Trash2,
  Link2,
  Unlink2,
  Loader2,
  Trophy,
  Flame,
  Zap,
} from "lucide-react";

interface Props {
  sessionId: string;
  exercicios: Exercicio[];
  modo: string; // completar | jogo
  onEncerrar: () => void;
}

type Resposta = string | string[] | { esq: string; dir: string }[];

const ROTULO_DIFICULDADE: Record<string, string> = {
  facil: "Fácil",
  medio: "Média",
  dificil: "Difícil",
};

const ROTULO_TIPO: Record<string, string> = {
  multipla: "Escolha a correta",
  digitada: "Escreva a resposta",
  ordenar: "Monte a frase",
  associar: "Associe os pares",
};

export function Atividade({ sessionId, exercicios, modo, onEncerrar }: Props) {
  const [lista, setLista] = useState<Exercicio[]>(exercicios);
  const [indice, setIndice] = useState(() => {
    const primeiro = exercicios.findIndex((e) => !e.respondida);
    return primeiro === -1 ? 0 : primeiro;
  });
  const [digitado, setDigitado] = useState("");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [montada, setMontada] = useState<string[]>([]);
  const [pares, setPares] = useState<{ esq: string; dir: string; ligadoA?: string }[]>([]);
  const [resultado, setResultado] = useState<RespostaExercicio | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [dica, setDica] = useState<string | null>(null);
  const [carregandoDica, setCarregandoDica] = useState(false);
  const [acertos, setAcertos] = useState(() =>
    exercicios.filter((e) => e.respondida && e.correta === true).length
  );
  const [respondidas, setRespondidas] = useState(() =>
    exercicios.filter((e) => e.respondida).length
  );
  const [sequencia, setSequencia] = useState(0); // acertos seguidos
  const [encerrando, setEncerrando] = useState(false);
  const [flash, setFlash] = useState<null | "ok" | "erro">(null);

  const ex = lista[indice];
  const total = lista.length;
  const concluida = respondidas >= total;

  // estado dos pares (associar) ao trocar de questão
  useEffect(() => {
    setDica(null);
    setResultado(null);
    setDigitado("");
    setSelecionada(null);
    setMontada([]);
    setSequencia((s) => (resultado?.correta ? s : 0));
    if (ex?.tipo === "associar" && ex.colunaEsq && ex.colunaDir) {
      setPares([
        ...ex.colunaEsq.map((esq) => ({ esq, dir: "", ligadoA: undefined })),
        ...ex.colunaDir.map((dir) => ({ esq: "", dir, ligadoA: undefined })),
      ]);
    }
    // reset proposital a cada TROCA de questão (indice); resultado/ex são lidos
    // do fechamento apenas para o reset — não devem re-disparar o efeito
  }, [indice]);

  // flash de acerto/erro (animação discreta)
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  const palavrasRestantes = useMemo(() => {
    if (!ex || ex.tipo !== "ordenar" || !ex.palavras) return [];
    const usadas = [...montada];
    const restantes: string[] = [];
    for (const p of ex.palavras) {
      const i = usadas.indexOf(p);
      if (i >= 0) usadas.splice(i, 1);
      else restantes.push(p);
    }
    return restantes;
  }, [ex, montada]);

  async function pedirDica() {
    if (carregandoDica || resultado) return;
    setCarregandoDica(true);
    try {
      const r = await chamarAPI<{ dica: string }>("/api/licao/dica", { sessionId });
      setDica(r.dica);
    } catch (e) {
      toast({ title: "Erro ao pedir dica", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCarregandoDica(false);
    }
  }

  function respostaValida(): boolean {
    if (!ex || resultado) return false;
    if (ex.tipo === "multipla") return !!selecionada;
    if (ex.tipo === "digitada") return digitado.trim().length > 0;
    if (ex.tipo === "ordenar") return montada.length > 0;
    if (ex.tipo === "associar") return pares.filter((p) => p.esq && p.ligadoA).length > 0;
    return false;
  }

  function montarResposta(): Resposta {
    if (!ex) return "";
    if (ex.tipo === "multipla") return selecionada as string;
    if (ex.tipo === "digitada") return digitado.trim();
    if (ex.tipo === "ordenar") return montada;
    if (ex.tipo === "associar") {
      const links = pares.filter((p) => p.esq && p.ligadoA);
      return links.map((l) => {
        const dir = pares.find((p) => p.dir && p.dir === l.ligadoA);
        return { esq: l.esq, dir: l.ligadoA as string };
      });
    }
    return "";
  }

  async function responder() {
    if (!ex || enviando || !respostaValida()) return;
    setEnviando(true);
    try {
      const r = await chamarAPI<RespostaExercicio>("/api/licao/atividade/responder", {
        exerciseId: ex.id,
        resposta: montarResposta(),
      });
      setResultado(r);
      setRespondidas(r.progresso.respondidas);
      setAcertos(r.progresso.acertos);
      setFlash(r.correta ? "ok" : "erro");
      if (r.correta) setSequencia((s) => s + 1);
      else setSequencia(0);
      setLista((l) => l.map((e) => (e.id === ex.id ? r.exercicio : e)));
    } catch (e) {
      toast({ title: "Erro ao enviar resposta", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  }

  function proxima() {
    if (indice < total - 1) setIndice(indice + 1);
  }

  async function encerrar() {
    if (encerrando) return;
    if (!concluida && respondidas < total) {
      const seguir = window.confirm(
        `Você respondeu ${respondidas} de ${total} questões. As não respondidas não contam como concluídas. Encerrar assim mesmo?`
      );
      if (!seguir) return;
    }
    setEncerrando(true);
    try {
      onEncerrar();
    } finally {
      setEncerrando(false);
    }
  }

  if (!ex && !concluida) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-tinta/60">
        Nenhum exercício foi gerado para esta atividade.
      </div>
    );
  }

  // ---------- Tela de atividade concluída ----------
  if (concluida) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center animar-entrada">
        <div className="w-20 h-20 rounded-full bg-verde text-creme flex items-center justify-center shadow-lg">
          <Trophy className="w-10 h-10 text-amarelo" aria-hidden />
        </div>
        <h2 className="fonte-marca text-2xl font-semibold mt-5">Atividade concluída!</h2>
        <p className="mt-2 text-[15px] text-tinta/75 max-w-sm leading-relaxed">
          {acertos} de {respondidas} questões corretas ({respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0}%).
          Veja o resumo detalhado e o que fazer a seguir.
        </p>
        {sequencia >= 3 && (
          <Badge className="mt-3 bg-ruivo text-creme gap-1">
            <Flame className="w-3.5 h-3.5" aria-hidden /> sequência de {sequencia} acertos!
          </Badge>
        )}
        <Button
          size="lg"
          onClick={encerrar}
          disabled={encerrando}
          className="mt-7 bg-verde hover:bg-verde/90 text-creme rounded-full px-8 h-12"
        >
          {encerrando ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <ChevronRight className="w-5 h-5" aria-hidden />}
          Ver resumo da atividade
        </Button>
      </div>
    );
  }

  // ---------- Jogador de exercícios ----------
  const atualRespondida = ex?.respondida || resultado;

  return (
    <div className="flex-1 flex flex-col mx-auto w-full max-w-2xl px-4 sm:px-6 py-5">
      {/* progresso da atividade */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-tinta/70 mb-1.5">
          <span className="font-semibold">
            Questão {Math.min(indice + 1, total)} de {total}
          </span>
          <span className="flex items-center gap-3">
            {modo === "jogo" && sequencia >= 2 && (
              <span className="flex items-center gap-1 text-ruivo font-semibold">
                <Flame className="w-3.5 h-3.5" aria-hidden /> {sequencia}
              </span>
            )}
            <span>
              {acertos}/{respondidas || 0} ✓
            </span>
          </span>
        </div>
        <Progress value={(respondidas / total) * 100} className="h-2 bg-areia [&>div]:bg-verde" />
      </div>

      {/* cartão da questão */}
      {ex && (
        <div
          key={ex.id}
          className={`rounded-2xl border bg-white shadow-sm p-5 sm:p-6 animar-entrada ${
            flash === "ok"
              ? "border-verde vibrar-ok"
              : flash === "erro"
                ? "border-ruivo vibrar-erro"
                : "border-verde/20"
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-areia text-tinta hover:bg-areia font-semibold gap-1">
              {ex.tipo === "jogo-rapido" ? <Zap className="w-3 h-3" aria-hidden /> : null}
              {ROTULO_TIPO[ex.tipo] || "Exercício"}
            </Badge>
            <Badge variant="outline" className="border-verde/30 text-verde">
              {ROTULO_DIFICULDADE[ex.dificuldade] || ex.dificuldade}
            </Badge>
          </div>
          <p className="mt-3 text-lg leading-relaxed font-medium">{ex.enunciado}</p>

          {/* --- MULTIPLA: alternativas clicáveis --- */}
          {ex.tipo === "multipla" && ex.alternativas && (
            <div className="mt-4 grid gap-2.5">
              {ex.alternativas.map((alt) => {
                const escolhida = selecionada === alt;
                const revelada = !!atualRespondida;
                const eGabarito = atualRespondida && resultado?.gabarito === alt;
                const errou = revelada && escolhida && !resultado?.correta;
                return (
                  <button
                    key={alt}
                    type="button"
                    disabled={revelada || enviando}
                    onClick={() => setSelecionada(alt)}
                    className={`text-left rounded-xl border-2 px-4 py-3.5 text-[15px] leading-snug transition-all touch-manipulation ${
                      eGabarito
                        ? "border-verde bg-verde/10 text-tinta"
                        : errou
                          ? "border-ruivo bg-ruivo/10 text-tinta"
                          : escolhida
                            ? "border-verde bg-areia/70 scale-[1.01]"
                            : "border-border bg-white hover:border-verde/50 hover:bg-areia/40"
                    }`}
                    aria-pressed={escolhida}
                  >
                    {alt}
                    {eGabarito && <Check className="inline w-4 h-4 ml-2 text-verde" aria-label="Correta" />}
                    {errou && <X className="inline w-4 h-4 ml-2 text-ruivo" aria-label="Incorreta" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* --- DIGITADA: teclado --- */}
          {ex.tipo === "digitada" && (
            <div className="mt-4">
              <Textarea
                value={digitado}
                onChange={(e) => setDigitado(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    responder();
                  }
                }}
                disabled={!!atualRespondida || enviando}
                placeholder="Digite sua resposta no idioma estudado..."
                className="min-h-[64px] bg-white text-[15px] resize-none"
                rows={2}
                aria-label="Sua resposta"
              />
            </div>
          )}

          {/* --- ORDENAR: montar frase por toque --- */}
          {ex.tipo === "ordenar" && (
            <div className="mt-4">
              <div className="min-h-[64px] rounded-xl border-2 border-dashed border-verde/30 bg-areia/30 p-3 flex flex-wrap gap-2 items-center">
                {montada.length === 0 && (
                  <span className="text-sm text-tinta/50">Toque nas palavras abaixo para montar a frase…</span>
                )}
                {montada.map((p, i) => (
                  <button
                    key={`${p}-${i}`}
                    type="button"
                    disabled={!!atualRespondida || enviando}
                    onClick={() => setMontada((m) => m.filter((_, j) => j !== i))}
                    className="rounded-lg bg-verde text-creme px-3 py-1.5 text-sm font-medium transition-transform hover:scale-105 active:scale-95 touch-manipulation"
                    aria-label={`Remover ${p}`}
                  >
                    {p}
                  </button>
                ))}
                {!atualRespondida && montada.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMontada([])}
                    className="ml-auto text-xs text-ruivo flex items-center gap-1"
                    aria-label="Limpar frase"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden /> limpar
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {palavrasRestantes.map((p, i) => (
                  <button
                    key={`${p}-r-${i}`}
                    type="button"
                    disabled={!!atualRespondida || enviando}
                    onClick={() => setMontada((m) => [...m, p])}
                    className="rounded-lg border border-verde/40 bg-white px-3 py-1.5 text-sm font-medium transition-all hover:bg-areia/60 hover:scale-105 active:scale-95 touch-manipulation"
                    aria-label={`Adicionar ${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- ASSOCIAR: ligar colunas --- */}
          {ex.tipo === "associar" && ex.colunaEsq && ex.colunaDir && (
            <Associar
              esq={ex.colunaEsq}
              dir={ex.colunaDir}
              pares={pares}
              setPares={setPares}
              travado={!!atualRespondida || enviando}
            />
          )}

          {/* dica */}
          {!atualRespondida && (
            <div className="mt-4">
              {dica ? (
                <div className="rounded-xl bg-amarelo/15 border border-amarelo/40 px-3.5 py-2.5 text-sm text-tinta/85 flex gap-2">
                  <Lightbulb className="w-4 h-4 text-amarelo shrink-0 mt-0.5" aria-hidden />
                  <span>{dica}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={pedirDica}
                  disabled={carregandoDica || enviando}
                  className="text-sm text-verde hover:text-verde-folha flex items-center gap-1.5"
                >
                  {carregandoDica ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    <Lightbulb className="w-4 h-4" aria-hidden />
                  )}
                  Pedir dica (conta nas métricas)
                </button>
              )}
            </div>
          )}

          {/* feedback imediato pós-resposta */}
          {atualRespondida && resultado && (
            <div
              className={`mt-4 rounded-xl px-4 py-3.5 animar-entrada ${
                resultado.correta ? "bg-verde/10 border border-verde/40" : "bg-ruivo/10 border border-ruivo/40"
              }`}
              role="status"
            >
              <div className="flex items-center gap-2 font-semibold">
                {resultado.correta ? (
                  <>
                    <Check className="w-5 h-5 text-verde" aria-hidden />
                    <span className="text-verde">Muito bem! Resposta correta.</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-ruivo" aria-hidden />
                    <span className="text-ruivo">Não foi essa — veja o gabarito:</span>
                  </>
                )}
              </div>
              {typeof resultado.gabarito === "string" && !resultado.correta && (
                <p className="mt-1.5 text-[15px] font-medium text-tinta">{resultado.gabarito}</p>
              )}
              {Array.isArray(resultado.gabarito) && !resultado.correta && (
                <ul className="mt-1.5 text-[15px] text-tinta list-disc pl-5">
                  {(resultado.gabarito as { esq: string; dir: string }[]).map((p, i) => (
                    <li key={i}>
                      {p.esq} → {p.dir}
                    </li>
                  ))}
                </ul>
              )}
              {resultado.explicacao && (
                <p className="mt-1.5 text-sm text-tinta/75 leading-relaxed">{resultado.explicacao}</p>
              )}
            </div>
          )}

          {/* ações */}
          <div className="mt-5 flex justify-between items-center gap-3">
            {!atualRespondida ? (
              <Button
                onClick={responder}
                disabled={!respostaValida() || enviando}
                className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-6"
              >
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Check className="w-4 h-4" aria-hidden />}
                Confirmar resposta
              </Button>
            ) : indice < total - 1 ? (
              <Button
                onClick={proxima}
                className="bg-verde hover:bg-verde/90 text-creme rounded-full px-6"
              >
                Próxima questão
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Button>
            ) : (
              <Button onClick={encerrar} className="bg-verde hover:bg-verde/90 text-creme rounded-full px-6">
                Ver resumo
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Associação de pares (colunas clicáveis) ----------

function Associar({
  esq,
  dir,
  pares,
  setPares,
  travado,
}: {
  esq: string[];
  dir: string[];
  pares: { esq: string; dir: string; ligadoA?: string }[];
  setPares: React.Dispatch<React.SetStateAction<{ esq: string; dir: string; ligadoA?: string }[]>>;
  travado: boolean;
}) {
  const [selecionadoEsq, setSelecionadoEsq] = useState<string | null>(null);

  // clique na esquerda: marca (ou desmarca); se já ligado, desliga
  function clicarEsquerda(e: string) {
    const ligado = pares.find((p) => p.esq === e)?.ligadoA;
    if (ligado) {
      setPares((ps) => ps.map((p) => (p.esq === e ? { ...p, ligadoA: undefined } : p)));
      return;
    }
    setSelecionadoEsq((atual) => (atual === e ? null : e));
  }

  // clique na direita: se há item esquerdo marcado, liga o par
  function clicarDireita(d: string) {
    if (!selecionadoEsq) return;
    setPares((ps) => {
      const liberados = ps.map((p) => (p.ligadoA === d ? { ...p, ligadoA: undefined } : p));
      return liberados.map((p) => (p.esq === selecionadoEsq ? { ...p, ligadoA: d } : p));
    });
    setSelecionadoEsq(null);
  }

  const ligadoDe = (d: string) => pares.find((p) => p.ligadoA === d && p.esq);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {esq.map((e) => {
          const ligado = pares.find((p) => p.esq === e)?.ligadoA;
          const ativo = selecionadoEsq === e;
          return (
            <button
              key={e}
              type="button"
              disabled={travado}
              onClick={() => clicarEsquerda(e)}
              className={`w-full text-left rounded-xl border-2 px-3.5 py-3 text-sm font-medium transition-all touch-manipulation flex items-center justify-between gap-2 ${
                ativo
                  ? "border-ruivo bg-ruivo/10"
                  : ligado
                    ? "border-verde bg-verde/10"
                    : "border-border bg-white hover:border-verde/50"
              }`}
              aria-pressed={ativo}
            >
              <span>{e}</span>
              {ligado ? (
                <span className="text-[11px] text-verde font-semibold flex items-center gap-1 truncate">
                  <Link2 className="w-3.5 h-3.5 shrink-0" aria-hidden /> {ligado}
                </span>
              ) : (
                <Unlink2 className="w-3.5 h-3.5 text-tinta/25 shrink-0" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {dir.map((d) => {
          const usadoPor = ligadoDe(d);
          const ativo = pares.find((p) => p.ligadoA === d && p.esq === selecionadoEsq);
          return (
            <button
              key={d}
              type="button"
              disabled={travado}
              onClick={() => clicarDireita(d)}
              className={`w-full text-left rounded-xl border-2 px-3.5 py-3 text-sm font-medium transition-all touch-manipulation ${
                ativo
                  ? "border-ruivo bg-ruivo/10"
                  : usadoPor
                    ? "border-verde bg-verde/10"
                    : "border-border bg-white hover:border-verde/50"
              }`}
              aria-pressed={!!ativo}
            >
              {d}
              {usadoPor && <span className="block text-[11px] text-verde font-semibold mt-0.5 truncate">← {usadoPor.esq}</span>}
            </button>
          );
        })}
      </div>
      <p className="col-span-2 text-xs text-tinta/60">
        Toque em um item da esquerda e depois no da direita para ligar. Toque de novo para desligar.
      </p>
    </div>
  );
}
