"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, formatarTempo, type Mensagem, type DadosLicao, type ResultadoEncerrar } from "./tipos";
import { BookOpen, Check, CircleHelp, Clock, Loader2, Send, StopCircle } from "lucide-react";

interface Props {
  codigo: string;
  lessonNumber: number;
  mode: string;
  onEncerrada: (r: ResultadoEncerrar, sessionId: string) => void;
  onVoltar: () => void;
}

interface AberturaResposta {
  sessionId: string;
  licao: DadosLicao;
  mensagens: Mensagem[];
  retomada: boolean;
}

const ROTULO_MODO: Record<string, string> = {
  conversa: "Conversa",
  escrita: "Escrita",
  completar: "Completar frase",
  jogo: "Jogo",
};

export function Licao({ codigo, lessonNumber, mode, onEncerrada, onVoltar }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [licao, setLicao] = useState<DadosLicao | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [resposta, setResposta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [segundos, setSegundos] = useState(0);
  const fimRef = useRef<HTMLDivElement>(null);
  const carregado = useRef(false);

  // carrega/retoma a lição
  useEffect(() => {
    if (carregado.current) return;
    carregado.current = true;
    (async () => {
      try {
        const r = await chamarAPI<AberturaResposta>("/api/licao/iniciar", {
          code: codigo,
          lessonNumber,
          mode,
        });
        setSessionId(r.sessionId);
        setLicao(r.licao);
        setMensagens(r.mensagens);
      } catch (e) {
        toast({ title: "Erro ao abrir a lição", description: (e as Error).message, variant: "destructive" });
        onVoltar();
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  // cronômetro de tempo em tela
  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // rola para a última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, pensando]);

  async function enviar() {
    const texto = resposta.trim();
    if (!texto || !sessionId || pensando) return;
    setResposta("");
    const otimista: Mensagem = {
      id: `local-${Date.now()}`,
      role: "ALUNO",
      content: texto,
      criadoEm: new Date().toISOString(),
    };
    setMensagens((m) => [...m, otimista]);
    setPensando(true);
    try {
      const r = await chamarAPI<{ mensagem: Mensagem }>("/api/licao/mensagem", {
        sessionId,
        content: texto,
      });
      setMensagens((m) => [...m, r.mensagem]);
    } catch (e) {
      toast({ title: "A professora não conseguiu responder", description: (e as Error).message + " — tente reenviar.", variant: "destructive" });
      setResposta(texto);
    } finally {
      setPensando(false);
    }
  }

  async function pedirDica() {
    if (!sessionId || pensando) return;
    setPensando(true);
    try {
      const r = await chamarAPI<{ mensagem: Mensagem }>("/api/licao/dica", { sessionId });
      setMensagens((m) => [...m, { ...r.mensagem, correcao: undefined }]);
    } catch (e) {
      toast({ title: "Erro ao pedir dica", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPensando(false);
    }
  }

  async function encerrar() {
    if (!sessionId || encerrando) return;
    setEncerrando(true);
    try {
      const r = await chamarAPI<ResultadoEncerrar>("/api/licao/encerrar", { sessionId });
      onEncerrada(r, sessionId);
    } catch (e) {
      toast({ title: "Erro ao encerrar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEncerrando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-creme flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-verde mx-auto" aria-hidden />
          <p className="mt-3 text-sm text-tinta/70">A professora está preparando a lição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col">
      {/* cabeçalho da lição */}
      <header className="bg-verde text-creme sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amarelo text-verde-d hover:bg-amarelo font-semibold">
                  Lição {lessonNumber}
                </Badge>
                <Badge variant="outline" className="border-creme/40 text-creme/90">
                  {licao?.nivel}
                </Badge>
                <Badge variant="outline" className="border-creme/40 text-creme/90">
                  {ROTULO_MODO[mode]}
                </Badge>
              </div>
              <h1 className="fonte-marca text-lg sm:text-xl font-semibold mt-1.5 truncate">
                {licao?.tema}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="flex items-center gap-1.5 text-xs text-creme/80 font-mono" aria-live="off">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                {formatarTempo(segundos)}
              </span>
              <Button
                size="sm"
                onClick={encerrar}
                disabled={encerrando || mensagens.length === 0}
                className="bg-ruivo hover:bg-ruivo/90 text-creme h-8"
              >
                {encerrando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <StopCircle className="w-4 h-4" aria-hidden />}
                Encerrar
              </Button>
            </div>
          </div>
          {licao && (
            <div className="mt-2 flex items-start gap-2 text-xs text-creme/75 leading-relaxed">
              <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
              <span>
                {licao.objetivo}
                {licao.conteudo.length > 0 && (
                  <span className="text-creme/60"> · {licao.conteudo.slice(0, 5).join(" · ")}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* área de conversa */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-5">
        <ScrollArea className="h-full">
          <div className="space-y-4 pb-4">
            {mensagens.map((m) =>
              m.role === "ALUNO" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-verde text-creme px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <CartaProfessora key={m.id} mensagem={m} />
              )
            )}
            {pensando && (
              <div className="flex items-center gap-2 text-sm text-tinta/60 pl-1">
                <Loader2 className="w-4 h-4 animate-spin text-ruivo" aria-hidden />
                a professora está escrevendo...
              </div>
            )}
            <div ref={fimRef} />
          </div>
        </ScrollArea>
      </main>

      {/* entrada */}
      <div className="sticky bottom-0 bg-creme/95 backdrop-blur border-t border-verde/15">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 items-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={pedirDica}
              disabled={pensando || encerrando}
              className="shrink-0 border-verde/40 text-verde hover:bg-areia"
              aria-label="Pedir dica"
              title="Pedir dica"
            >
              <CircleHelp className="w-5 h-5" aria-hidden />
            </Button>
            <Textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Escreva sua resposta no idioma (ou em português, no começo)..."
              className="min-h-[52px] max-h-40 bg-white resize-none text-[15px]"
              rows={2}
              aria-label="Sua resposta"
              disabled={pensando || encerrando}
            />
            <Button
              type="button"
              onClick={enviar}
              disabled={!resposta.trim() || pensando || encerrando}
              className="shrink-0 bg-ruivo hover:bg-ruivo/90 text-creme h-[52px] px-4"
              aria-label="Enviar resposta"
            >
              <Send className="w-5 h-5" aria-hidden />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Enter envia · Shift+Enter quebra linha · dica conta como “dicas usadas” nas métricas
          </p>
        </div>
      </div>
    </div>
  );
}

function CartaProfessora({ mensagem }: { mensagem: Mensagem }) {
  const temEstrutura =
    mensagem.correcao || mensagem.explicacao || mensagem.exemplo || mensagem.proximoExercicio;
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-fit rounded-2xl rounded-bl-md bg-white border border-verde/20 px-4 py-3.5 shadow-sm">
        {!temEstrutura ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{mensagem.content}</p>
        ) : (
          <div className="space-y-3">
            {mensagem.correcao && (
              <Bloco titulo="Correção" tom="ruivo">
                {mensagem.correcao}
              </Bloco>
            )}
            {mensagem.explicacao && (
              <Bloco titulo="Explicação" tom="verde">
                {mensagem.explicacao}
              </Bloco>
            )}
            {mensagem.exemplo && (
              <Bloco titulo="Exemplo" tom="tinta">
                {mensagem.exemplo}
              </Bloco>
            )}
            {mensagem.nota != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota</span>
                <Badge
                  className={
                    mensagem.nota >= 8
                      ? "bg-verde text-creme hover:bg-verde"
                      : mensagem.nota >= 6
                        ? "bg-amarelo text-verde-d hover:bg-amarelo"
                        : "bg-ruivo text-creme hover:bg-ruivo"
                  }
                >
                  <Check className="w-3 h-3 mr-1" aria-hidden />
                  {mensagem.nota.toFixed(0)}/10
                </Badge>
              </div>
            )}
            {mensagem.proximoExercicio && (
              <div className="rounded-xl bg-areia/70 border border-verde/20 px-3.5 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ruivo">
                  Próximo exercício
                </div>
                <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {mensagem.proximoExercicio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bloco({ titulo, tom, children }: { titulo: string; tom: "ruivo" | "verde" | "tinta"; children: string }) {
  const cor = tom === "ruivo" ? "text-ruivo" : tom === "verde" ? "text-verde" : "text-tinta/60";
  return (
    <div>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${cor}`}>{titulo}</div>
      <p className="mt-0.5 text-[15px] leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  );
}
