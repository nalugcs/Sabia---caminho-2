"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, type EstadoSessao, type InfoLicao } from "./tipos";
import { BotaoCopiar } from "./BotaoCopiar";
import { MODOS, ENCONTROS, nivelDaLicao, rotuloModo } from "@/lib/pesquisa";
import {
  Check,
  Lock,
  Play,
  MessageCircle,
  ListChecks,
  Gamepad2,
  ClipboardList,
  Bird,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

const ICONES_MODO: Record<string, typeof MessageCircle> = {
  conversa: MessageCircle,
  completar: ListChecks,
  jogo: Gamepad2,
  escrita: ListChecks, // legado
};

interface Props {
  estado: EstadoSessao;
  codigo: string;
  focoDialogo?: number; // abre o diálogo de modos desta lição (ex.: voltar do resumo)
  onAbrirLicao: (lessonNumber: number, mode: string) => void;
  onVerQuestionarioFinal: () => void;
  onSair: () => void;
  onAvancou: () => void; // recarrega estado após avanço
}

export function Trilha({ estado, codigo, focoDialogo, onAbrirLicao, onVerQuestionarioFinal, onSair, onAvancou }: Props) {
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [licaoSelecionada, setLicaoSelecionada] = useState<InfoLicao | null>(null);
  const [modoSelecionado, setModoSelecionado] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);

  // abre o diálogo da lição indicada (ex.: "praticar outra modalidade" pós-atividade)
  useEffect(() => {
    if (focoDialogo == null) return;
    const alvo = estado.licoes.find((l) => l.numero === focoDialogo && l.status !== "BLOQUEADA");
    if (alvo) {
      setLicaoSelecionada(alvo);
      setModoSelecionado(null);
      setDialogoAberto(true);
    }
  }, [focoDialogo]);

  const licaoMap = new Map(estado.licoes.map((l) => [l.numero, l]));
  const proxima =
    estado.licoes.find((l) => l.status === "EM_ANDAMENTO") ??
    (estado.proximaLicao != null ? licaoMap.get(estado.proximaLicao) : undefined);
  const trilhaCompleta = estado.concluidas >= estado.total;
  const podeFinalizar = trilhaCompleta && !estado.questionarioFinalRespondido;
  const finalizado = estado.questionarioFinalRespondido || estado.participante.status === "FINALIZADO";

  function abrirDialogoModo(l: InfoLicao) {
    setLicaoSelecionada(l);
    setModoSelecionado(null);
    setDialogoAberto(true);
  }

  function abrirLicao(numero: number, mode: string) {
    setDialogoAberto(false);
    onAbrirLicao(numero, mode);
  }

  async function concluirLicao(l: InfoLicao) {
    setAvancando(true);
    try {
      await chamarAPI("/api/trilha/avancar", { code: codigo, lessonNumber: l.numero });
      toast({ title: `Lição ${l.numero} concluída!`, description: "A próxima lição está liberada." });
      onAvancou();
    } catch (e) {
      toast({ title: "Não foi possível concluir", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAvancando(false);
    }
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
                  {estado.participante.idioma} · {estado.participante.nivelCEFR || `nível ${estado.participante.nivelDeclarado}`} ·{" "}
                  <span className="font-mono">{codigo}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSair}
                className="border-creme/30 text-creme/80 hover:bg-creme/10 hover:text-creme bg-transparent"
              >
                Sair
              </Button>
              <BotaoCopiar
                valor={codigo}
                texto={`Meu código no Sabiá: ${codigo} — assim retomo minha trilha de idiomas.`}
                rotulo="Copiar código"
                className="[&_button]:border-creme/30 [&_button]:text-creme/80 [&_button:hover]:bg-creme/10"
              />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-creme/80 mb-1.5">
              <span>Sua trilha</span>
              <span>
                {estado.concluidas}/{estado.total} lições concluídas · {porcentagem}%
              </span>
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
                  {proxima.status === "EM_ANDAMENTO" ? "Atividade em andamento" : "Próxima lição"}
                </div>
                <div className="fonte-marca text-2xl font-semibold mt-1">
                  Lição {proxima.numero} · {nivelDaLicao(proxima.numero)}
                </div>
                <p className="text-sm text-tinta/70 mt-1">
                  {proxima.status === "EM_ANDAMENTO"
                    ? "Você tem uma atividade aberta — vamos continuar de onde parou."
                    : "Escolha um modo de estudo. Pratique quantas atividades quiser antes de avançar."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => abrirDialogoModo(proxima)}
                className="bg-verde hover:bg-verde/90 text-creme rounded-full px-7 h-12"
              >
                {proxima.status === "EM_ANDAMENTO" ? "Continuar atividade" : "Praticar lição"}
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
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {e.licoes.map((n) => {
                        const l = licaoMap.get(n);
                        if (!l) return null;
                        return <CartaoLicao key={n} licao={l} onPraticar={abrirDialogoModo} onConcluir={concluirLicao} avancando={avancando} />;
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
            <DialogTitle className="fonte-marca">Escolha como praticar</DialogTitle>
            <DialogDescription>
              Lição {licaoSelecionada?.numero} · {licaoSelecionada ? nivelDaLicao(licaoSelecionada.numero) : ""} ·{" "}
              {estado.participante.idioma}
              {licaoSelecionada?.revisao ? " · revisão" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-1 mt-2">
            {MODOS.map((m) => {
              const Ic = ICONES_MODO[m.id];
              const ativo = modoSelecionado === m.id;
              const praticado = licaoSelecionada?.praticado.find((p) => p.mode === m.id);
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
                  <div className="flex items-center justify-between gap-2 font-semibold text-[15px]">
                    <span className="flex items-center gap-2">
                      <Ic className="w-4 h-4 text-ruivo" aria-hidden />
                      {m.label}
                    </span>
                    {praticado && (
                      <span className="text-xs font-semibold text-verde">
                        ✓ praticado {praticado.vezes > 1 ? `${praticado.vezes}×` : ""}
                        {praticado.percentual != null ? ` · ${praticado.percentual}%` : praticado.nota != null ? ` · nota ${praticado.nota.toFixed(1)}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-tinta/70 leading-relaxed">{m.descricao}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>Cancelar</Button>
            <Button
              disabled={!modoSelecionado}
              onClick={() => licaoSelecionada && abrirLicao(licaoSelecionada.numero, modoSelecionado!)}
              className="bg-verde hover:bg-verde/90 text-creme"
            >
              Iniciar atividade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Cartão de lição com modos praticados ----------

function CartaoLicao({
  licao,
  onPraticar,
  onConcluir,
  avancando,
}: {
  licao: InfoLicao;
  onPraticar: (l: InfoLicao) => void;
  onConcluir: (l: InfoLicao) => void;
  avancando: boolean;
}) {
  const concluida = licao.status === "CONCLUIDA";
  const andamento = licao.status === "EM_ANDAMENTO";
  const bloqueada = licao.status === "BLOQUEADA";
  const praticadoAlgum = licao.praticado.length > 0;

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        concluida
          ? "border-verde/40 bg-verde/5"
          : andamento
            ? "border-ruivo/50 bg-ruivo/5"
            : bloqueada
              ? "border-border bg-white/60 opacity-70"
              : "border-ruivo/40 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lição {licao.numero}
        </span>
        <span className="flex items-center gap-1.5">
          {concluida && <Check className="w-4 h-4 text-verde" aria-label="Concluída" />}
          {andamento && <span className="text-[10px] font-bold text-ruivo uppercase">em andamento</span>}
          {concluida && licao.revisao && (
            <button
              type="button"
              onClick={() => onPraticar(licao)}
              className="text-[10px] font-bold text-verde uppercase hover:underline"
            >
              revisar
            </button>
          )}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium">{nivelDaLicao(licao.numero)}</div>

      {/* modos praticados — o que já foi feito fica visível */}
      {praticadoAlgum ? (
        <ul className="mt-2 space-y-1">
          {licao.praticado.map((p) => (
            <li key={p.mode} className="text-xs text-tinta/70 flex items-center gap-1.5">
              <Check className="w-3 h-3 text-verde shrink-0" aria-hidden />
              <span className="font-medium">{p.rotulo || rotuloModo(p.mode)}</span>
              {p.percentual != null ? (
                <span>· {p.percentual}%</span>
              ) : p.nota != null ? (
                <span>· nota {p.nota.toFixed(1)}</span>
              ) : null}
              {p.vezes > 1 && <span className="text-tinta/50">({p.vezes}×)</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-xs text-tinta/50">nenhuma atividade ainda</div>
      )}

      {/* ações por lição */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {!bloqueada && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPraticar(licao)}
            className="h-7 text-xs border-verde/40 text-verde hover:bg-areia/60"
          >
            <RotateCcw className="w-3 h-3 mr-1" aria-hidden />
            {concluida ? "Revisar" : "Praticar"}
          </Button>
        )}
        {licao.podeAvancar && (
          <Button
            size="sm"
            onClick={() => onConcluir(licao)}
            disabled={avancando}
            className="h-7 text-xs bg-ruivo hover:bg-ruivo/90 text-creme"
          >
            <ArrowRight className="w-3 h-3 mr-1" aria-hidden />
            Concluir lição
          </Button>
        )}
      </div>
    </div>
  );
}
