"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Download, Lock, BarChart3, Users, LineChart as LineChartIcon, ShieldCheck } from "lucide-react";

interface DadosPesquisa {
  resumo: {
    totalParticipantes: number;
    finalizados: number;
    totalLicoes: number;
    idiomas: Record<string, number>;
  };
  participantes: {
    codigo: string;
    idioma: string;
    idade: number;
    nivelDeclarado: number;
    status: string;
    concluidas: number;
    mediaNotas: number | null;
    evolucao: { licao: number; nota: number | null }[];
    questionarioFinal: boolean;
  }[];
  metricasPorLicao: { licao: number; n: number; mediaNota: number; mediaAcertos: number; mediaTempoMin: number }[];
  microResumo: { licao: number; n: number; ml1: number; ml2: number; ml3: number; ml4: number }[];
  questionarioResumo: { subescala: string; media: number }[];
  dg: { satisfacao: number; recomendacao: number } | null;
  incidentes: { provider: string; type: string; _count: { _all: number } }[];
  trilha: number;
}

export function Pesquisadora() {
  const [pin, setPin] = useState("");
  const [dados, setDados] = useState<DadosPesquisa | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async (p: string) => {
    setCarregando(true);
    try {
      const resposta = await fetch("/api/pesquisa/dados", { headers: { "x-researcher-pin": p }, cache: "no-store" });
      if (!resposta.ok) throw new Error("PIN inválido ou acesso indisponível.");
      const d = (await resposta.json()) as DadosPesquisa;
      setDados(d);
    } catch (e) {
      toast({ title: "Acesso negado", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCarregando(false);
    }
  }, []);

  function baixar(tipo: string) {
    fetch(`/api/pesquisa/export?tipo=${encodeURIComponent(tipo)}`, { headers: { "x-researcher-pin": pin }, cache: "no-store" })
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error("Não foi possível exportar os dados.");
        const url = URL.createObjectURL(await resposta.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = `sabia_${tipo}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((e) => toast({ title: "Erro na exportação", description: (e as Error).message, variant: "destructive" }));
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-creme flex items-center justify-center px-6">
        <Card className="w-full max-w-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 fonte-marca text-xl font-semibold">
              <Lock className="w-5 h-5 text-ruivo" aria-hidden />
              Área da pesquisadora
            </div>
            <p className="mt-2 text-sm text-tinta/70">
              Dados pseudonimizados da coleta — acesso por PIN.
            </p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                carregar(pin);
              }}
            >
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="font-mono tracking-widest h-11"
                aria-label="PIN da pesquisadora"
              />
              <Button type="submit" disabled={!pin || carregando} className="w-full bg-verde hover:bg-verde/90 text-creme h-11">
                {carregando ? "Verificando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme">
      <header className="bg-verde-d text-creme">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-amarelo font-semibold">
              Sabiá · Painel de coleta
            </div>
            <h1 className="fonte-marca text-2xl font-semibold mt-1">Área da pesquisadora</h1>
          </div>
          <Button variant="outline" className="border-creme/30 text-creme/80 hover:bg-creme/10 hover:text-creme" onClick={() => setDados(null)}>
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* cartões de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { rotulo: "Participantes", valor: dados.resumo.totalParticipantes },
            { rotulo: "Finalizados", valor: dados.resumo.finalizados },
            { rotulo: "Lições concluídas", valor: dados.resumo.totalLicoes },
            { rotulo: "Trilha por participante", valor: dados.trilha },
          ].map((c) => (
            <Card key={c.rotulo} className="bg-white border-verde/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold fonte-marca">{c.valor}</div>
                <div className="text-xs text-muted-foreground">{c.rotulo}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-tinta/70">
          {Object.entries(dados.resumo.idiomas).map(([idioma, n]) => (
            <Badge key={idioma} variant="outline" className="border-verde/40">
              {idioma}: {n}
            </Badge>
          ))}
        </div>

        <Tabs defaultValue="participantes" className="mt-6">
          <TabsList className="bg-areia/70">
            <TabsTrigger value="participantes"><Users className="w-4 h-4 mr-1.5" aria-hidden />Participantes</TabsTrigger>
            <TabsTrigger value="licoes"><BarChart3 className="w-4 h-4 mr-1.5" aria-hidden />Por lição</TabsTrigger>
            <TabsTrigger value="percepcao"><LineChartIcon className="w-4 h-4 mr-1.5" aria-hidden />Percepção</TabsTrigger>
            <TabsTrigger value="confiabilidade"><ShieldCheck className="w-4 h-4 mr-1.5" aria-hidden />Confiabilidade</TabsTrigger>
          </TabsList>

          {/* participantes */}
          <TabsContent value="participantes" className="mt-4">
            <Card className="bg-white border-verde/20">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-areia/50">
                      <TableHead>Código</TableHead>
                      <TableHead>Idioma</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Nível decl.</TableHead>
                      <TableHead>Lições</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Evolução das notas (L1→L10)</TableHead>
                      <TableHead>Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.participantes.map((p) => (
                      <TableRow key={p.codigo}>
                        <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                        <TableCell>{p.idioma}</TableCell>
                        <TableCell>{p.idade}</TableCell>
                        <TableCell>{p.nivelDeclarado}</TableCell>
                        <TableCell>{p.concluidas}/{dados.trilha}</TableCell>
                        <TableCell>{p.mediaNotas != null ? p.mediaNotas.toFixed(1) : "—"}</TableCell>
                        <TableCell>
                          <span className="flex items-end gap-[2px] h-8" aria-hidden>
                            {p.evolucao.map((e) => {
                              const altura = Math.max(3, Math.round(((e.nota || 0) / 10) * 28));
                              return (
                                <span
                                  key={e.licao}
                                  title={`L${e.licao}: ${(e.nota || 0).toFixed(1)}`}
                                  className="w-2 rounded-sm bg-verde-folha"
                                  style={{ height: altura }}
                                />
                              );
                            })}
                            {p.evolucao.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          {p.questionarioFinal ? (
                            <Badge className="bg-verde text-creme hover:bg-verde">sim</Badge>
                          ) : (
                            <Badge variant="outline">{p.status === "FINALIZADO" ? "—" : "pendente"}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {dados.participantes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum participante registrado ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* métricas por lição */}
          <TabsContent value="licoes" className="mt-4 space-y-4">
            <Card className="bg-white border-verde/20">
              <CardContent className="p-0">
                <div className="px-5 pt-4 font-semibold text-[15px]">Desempenho por lição (médias)</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-areia/50">
                      <TableHead>Lição</TableHead>
                      <TableHead>n</TableHead>
                      <TableHead>Nota média</TableHead>
                      <TableHead>Acertos</TableHead>
                      <TableHead>Tempo (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.metricasPorLicao.map((m) => (
                      <TableRow key={m.licao}>
                        <TableCell>L{m.licao}</TableCell>
                        <TableCell>{m.n}</TableCell>
                        <TableCell>{m.mediaNota.toFixed(1)}</TableCell>
                        <TableCell>{m.mediaAcertos.toFixed(1)}</TableCell>
                        <TableCell>{m.mediaTempoMin.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                    {dados.metricasPorLicao.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Sem lições encerradas ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="bg-white border-verde/20">
              <CardContent className="p-0">
                <div className="px-5 pt-4 font-semibold text-[15px]">Micro-questionário por lição (médias ML1–ML4)</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-areia/50">
                      <TableHead>Lição</TableHead>
                      <TableHead>n</TableHead>
                      <TableHead>ML1 utilidade</TableHead>
                      <TableHead>ML2 clareza</TableHead>
                      <TableHead>ML3 dificuldade</TableHead>
                      <TableHead>ML4 realismo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.microResumo.map((m) => (
                      <TableRow key={m.licao}>
                        <TableCell>L{m.licao}</TableCell>
                        <TableCell>{m.n}</TableCell>
                        <TableCell>{m.ml1.toFixed(1)}</TableCell>
                        <TableCell>{m.ml2.toFixed(1)}</TableCell>
                        <TableCell>{m.ml3.toFixed(1)}</TableCell>
                        <TableCell>{m.ml4.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                    {dados.microResumo.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Sem micro-questionários ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* percepção */}
          <TabsContent value="percepcao" className="mt-4">
            <Card className="bg-white border-verde/20">
              <CardContent className="p-5">
                <div className="font-semibold text-[15px]">Questionário final — médias por subescala (1–5)</div>
                {dados.questionarioResumo.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {dados.questionarioResumo.map((s) => (
                      <div key={s.subescala}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{s.subescala}</span>
                          <span className="font-mono">{s.media.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 h-3 rounded-full bg-areia overflow-hidden">
                          <div
                            className="h-full rounded-full bg-verde"
                            style={{ width: `${(s.media / 5) * 100}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    ))}
                    {dados.dg && (
                      <div className="mt-4 rounded-xl bg-areia/50 border border-verde/20 p-4 text-sm flex gap-6">
                        <span>Satisfação geral: <b>{dados.dg.satisfacao.toFixed(1)}</b>/5</span>
                        <span>Recomendação: <b>{dados.dg.recomendacao.toFixed(1)}</b>/10</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nenhum questionário final respondido ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* confiabilidade */}
          <TabsContent value="confiabilidade" className="mt-4">
            <Card className="bg-white border-verde/20">
              <CardContent className="p-5">
                <div className="font-semibold text-[15px]">Log de incidentes (fallbacks de provedor)</div>
                {dados.incidentes.length > 0 ? (
                  <div className="mt-3 space-y-2 text-sm">
                    {dados.incidentes.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                        <span className="font-mono text-xs">{i.type} · {i.provider}</span>
                        <Badge variant="outline" className="border-ruivo/40 text-ruivo">{i._count._all}×</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nenhum incidente registrado — as chamadas de IA fluíram pelo provedor primário.
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  Cada fallback (Gemini → Groq → regra local) é registrado para a seção de
                  confiabilidade do TCC: a lição nunca para por indisponibilidade de API.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* exportações */}
        <section className="mt-8" aria-labelledby="export">
          <h2 id="export" className="fonte-marca text-lg font-semibold">Exportar dados para análise</h2>
          <p className="mt-1 text-sm text-tinta/70">
            CSVs pseudonimizados (código, nunca nome) — prontos para o pandas.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => baixar("metricas")} className="bg-verde hover:bg-verde/90 text-creme">
              <Download className="w-4 h-4 mr-1.5" aria-hidden />
              metricas.csv (uma linha por lição)
            </Button>
            <Button onClick={() => baixar("micro")} className="bg-verde hover:bg-verde/90 text-creme">
              <Download className="w-4 h-4 mr-1.5" aria-hidden />
              micro.csv (micro-questionários)
            </Button>
            <Button onClick={() => baixar("final")} className="bg-verde hover:bg-verde/90 text-creme">
              <Download className="w-4 h-4 mr-1.5" aria-hidden />
              final.csv (questionário completo)
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
