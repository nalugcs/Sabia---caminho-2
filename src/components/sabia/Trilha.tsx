"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, formatarTempo, type EstadoSessao } from "./tipos";
import { MODOS, ENCONTROS, nivelDaLicao } from "@/lib/pesquisa";
import { Check, Lock, Play, MessageCircle, PenLine, ListChecks, Gamepad2, ClipboardList, Bird } from "lucide-react";

const ICONES_MODO: Record<string, typeof MessageCircle> = {
  conversa: MessageCircle,
  escrita: PenLine,
  completar: ListChecks,
  jogo: Gamepad2,
};

interface Props {
  estado: EstadoSessao;
  codigo: string;
  onAbrirLicao: (lessonNumber: number, mode: string) => void;
  onVerQuestionarioFinal: () => void;
  onSair: () => void;
}

export function Trilha({ estado, codigo, onAbrirLicao, onVerQuestionarioFinal, onSair }: Props) {
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [modoSelecionado, setModoSelecionado] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  const licaoMap = new Map(estado.licoes.map((l) => [l.numero, l]));
  const emAndamento = estado.licoes.find((l) => l.status === "EM_ANDAMENTO");
  const proxima = emAndamento ?? (estado.proximaLicao != null ? licaoMap.get(estado.proximaLicao) : undefined);
  const trilhaCompleta = estado.concluidas >= estado.total;
  const podeFinalizar = trilhaCompleta && !estado.questionarioFinalRespondido;
  const finalizado = estado.questionarioFinalRespondido || estado.participante.status === "FINALIZADO";

  async function iniciarLicao(numero: number, mode: string) {
    setIniciando(true);
    try {
      await chamarAPI("/api/licao/iniciar", { code: codigo, lessonNumber: numero, mode });
      setDialogoAberto(false);
      onAbrirLicao(numero, mode);
    } catch (e) {
      toast({ title: "Não foi possível abrir a lição", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIniciando(false);
    }
  }

  function abrirDialogoModo() {
    if (!proxima) return;
    setModoSelecionado(null);
    setDialogoAberto(true);
  }

  const porcentagem = Math.round((estado.concluidas / estado.total) * 100);

  return (
    <div className="min-h-screen bg-creme">
      {/* cabeçalho do participante */}
      <header className="bg-verde text-creme">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/marca/sabia-simbolo-negative.svg" alt="Sabiá" className="w-9 h-9" width={36} height={36} />
              <div>
                <div className="fonte-marca text-xl leading-tight">Olá, {estado.participante.primeiroNome}</div>
                <div className="text-xs text-creme/70 mt-0.5">
                  {estado.participante.idioma} · código <span className="font-mono">{codigo}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSair}
              className="border-creme/30 text-creme/80 hover:bg-creme/10 hover:text-creme"
            >
              Sair
            </Button>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-creme/80 mb-1.5">
              <span>Sua trilha</span>
              <span>{estado.concluidas}/{estado.total} lições · {porcentagem}%</span>
            </div>
            <Progress value={porcentagem} className="h-2 bg-verde-d/60 [&>div]:bg-amarelo" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
        {/* CTA principal */}
        {finalizado ? (
          <Card className="border-verde/30 bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <Bird className="w-8 h-8 text-verde shrink-0" aria-hidden />
              <div>
                <div className="fonte-marca text-lg font-semibold">Pesquisa concluída — muito obrigada!</div>
                <p className="text-sm text-tinta/75 mt-1">
                  Sua trilha e o questionário final foram registrados. Seu código <span className="font-mono">{codigo}</span> pode ser consultado caso precise.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : podeFinalizar ? (
          <Card className="border-amarelo/50 bg-areia/50">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <ClipboardList className="w-8 h-8 text-ruivo shrink-0" aria-hidden />
              <div className="flex-1">
                <div className="fonte-marca text-lg font-semibold">Último passo: questionário final</div>
                <p className="text-sm text-tinta/75 mt-1">
                  Trilha concluída! Falta só o questionário de percepção (~8–10 min) para encerrar sua participação.
                </p>
              </div>
              <Button onClick={onVerQuestionarioFinal} className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-6">
                Responder agora
              </Button>
            </CardContent>
          </Card>
        ) : proxima ? (
          <Card className="border-verde/30 bg-white">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] text-ruivo font-semibold">
                  {emAndamento ? "Lição em andamento" : "Próxima lição"}
                </div>
                <div className="fonte-marca text-2xl font-semibold mt-1">
                  Lição {proxima.numero} · {nivelDaLicao(proxima.numero)}
                </div>
                <p className="text-sm text-tinta/70 mt-1">
                  {emAndamento
                    ? "Você já começou esta lição — vamos continuar de onde parou."
                    : "Escolha o modo de estudo e converse com a professora-IA."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={abrirDialogoModo}
                className="bg-verde hover:bg-verde/90 text-creme rounded-full px-7 h-12"
              >
                {emAndamento ? "Continuar lição" : "Começar lição"}
                <Play className="w-4 h-4 ml-1" aria-hidden />
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* encontros */}
        <section className="mt-8" aria-labelledby="encontros">
          <h2 id="encontros" className="fonte-marca text-xl font-semibold">Seus 5 encontros</h2>
          <div className="mt-4 space-y-4">
            {ENCONTROS.map((e) => {
              const todas = e.licoes.every((n) => licaoMap.get(n)?.status === "CONCLUIDA");
              const desbloqueada = e.encontro === 1 || ENCONTROS.slice(0, e.encontro - 1).every((prev) =>
                prev.licoes.every((n) => licaoMap.get(n)?.status === "CONCLUIDA")
              );
              return (
                <Card key={e.encontro} className={desbloqueada ? "bg-white" : "bg-areia/40 opacity-80"}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {todas ? (
                          <Check className="w-5 h-5 text-verde" aria-label="Encontro concluído" />
                        ) : desbloqueada ? (
                          <Play className="w-4 h-4 text-ruivo" aria-hidden />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" aria-label="Encontro bloqueado" />
                        )}
                        <span className="font-semibold text-[15px]">Encontro {e.encontro}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{e.foco}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {e.licoes.map((n) => {
                        const l = licaoMap.get(n);
                        const concluida = l?.status === "CONCLUIDA";
                        const andamento = l?.status === "EM_ANDAMENTO";
                        return (
                          <div
                            key={n}
                            className={`rounded-xl border p-3.5 ${
                              concluida
                                ? "border-verde/40 bg-verde/5"
                                : andamento
                                  ? "border-ruivo/50 bg-ruivo/5"
                                  : "border-border bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Lição {n}
                              </span>
                              {concluida && <Check className="w-4 h-4 text-verde" aria-label="Concluída" />}
                              {andamento && <span className="text-[10px] font-bold text-ruivo uppercase">retomar</span>}
                            </div>
                            <div className="mt-1 text-sm font-medium">{nivelDaLicao(n)}</div>
                            {concluida && l && (
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-tinta/70">
                                <span>Nota <b>{l.score?.toFixed(1)}</b></span>
                                <span>{l.acertos} acerto(s)</span>
                                <span>{formatarTempo(l.tempoSec || 0)}</span>
                                {l.microRespondido && <span className="text-verde">✓ questionário</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* diálogo de seleção de modo */}
      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="fonte-marca">Escolha o modo de estudo</DialogTitle>
            <DialogDescription>
              Lição {proxima?.numero} · {proxima ? nivelDaLicao(proxima.numero) : ""} · {estado.participante.idioma}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2 mt-2">
            {MODOS.map((m) => {
              const Ic = ICONES_MODO[m.id];
              const ativo = modoSelecionado === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModoSelecionado(m.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    ativo ? "border-verde bg-areia/60" : "border-border bg-white hover:border-verde/50"
                  }`}
                  aria-pressed={ativo}
                >
                  <div className="flex items-center gap-2 font-semibold text-[15px]">
                    <Ic className="w-4 h-4 text-ruivo" aria-hidden />
                    {m.label}
                  </div>
                  <p className="mt-1 text-xs text-tinta/70 leading-relaxed">{m.descricao}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>Cancelar</Button>
            <Button
              disabled={!modoSelecionado || iniciando}
              onClick={() => proxima && iniciarLicao(proxima.numero, modoSelecionado!)}
              className="bg-verde hover:bg-verde/90 text-creme"
            >
              {iniciando ? "Preparando..." : "Iniciar lição"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
