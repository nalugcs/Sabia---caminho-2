"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { chamarAPI, type EstadoSessao } from "./tipos";
import { IDIOMAS, NIVEIS_DECLARADOS } from "@/lib/pesquisa";
import { BotaoCopiar } from "./BotaoCopiar";
import { BookOpen, CalendarCheck, ShieldCheck, Sparkles, Feather } from "lucide-react";

interface Props {
  onRegistrado: (code: string) => void;
  onRecuperado: (estado: EstadoSessao) => void;
  onPesquisadora: () => void;
}

type Etapa = "hero" | "tcle" | "registro" | "codigo" | "recuperar";

export function Landing({ onRegistrado, onRecuperado, onPesquisadora }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("hero");

  // TCLE + registro
  const [tceOk, setTceOk] = useState(false);
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [idade, setIdade] = useState("");
  const [nivel, setNivel] = useState("");
  const [idioma, setIdioma] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [recuperando, setRecuperando] = useState(false);

  async function registrar() {
    setEnviando(true);
    try {
      const { code } = await chamarAPI<{ code: string }>("/api/registro", {
        firstName: primeiroNome,
        lastName: sobrenome,
        age: Number(idade),
        selfLevel: Number(nivel),
        language: idioma,
        tceAccepted: tceOk,
      });
      setCodigoGerado(code);
      setEtapa("codigo");
    } catch (e) {
      toast({ title: "Não foi possível registrar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  }

  async function recuperar() {
    setRecuperando(true);
    try {
      const estado = await chamarAPI<EstadoSessao>("/api/sessao/recuperar", {
        code: codigoDigitado,
      });
      onRecuperado(estado);
    } catch (e) {
      toast({ title: "Código não encontrado", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRecuperando(false);
    }
  }

  const formularioValido =
    primeiroNome.trim().length > 1 &&
    sobrenome.trim().length > 1 &&
    Number(idade) >= 18 &&
    Number(idade) <= 120 &&
    nivel !== "" &&
    idioma !== "";

  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO */}
      {etapa === "hero" && (
        <div className="bg-verde text-creme">
          <div className="mx-auto max-w-5xl px-6 pt-10 pb-14 sm:pt-16 sm:pb-20">
            <div className="flex items-center justify-center gap-3">
              <img src="/marca/sabia-simbolo-negative.svg" alt="Símbolo Sabiá" className="w-14 h-14" width={56} height={56} />
              <img src="/marca/sabia-wordmark-creme.svg" alt="Sabiá" className="h-12" width={180} height={48} />
            </div>
            <h1 className="fonte-marca text-center mt-10 text-4xl sm:text-5xl font-semibold leading-tight">
              Toda voz se aprende.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-creme/80 text-base sm:text-lg leading-relaxed">
              O Sabiá é um aplicativo de prática conversacional personalizada por machine
              learning. Você conversa por escrito com uma professora de IA que corrige,
              explica e adapta as lições ao seu perfil — em português, aprendendo inglês,
              espanhol ou francês.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icone: BookOpen, titulo: "Trilha de 10 lições", texto: "5 encontros de 2 lições, ~20–30 min cada, no seu ritmo." },
                { icone: Sparkles, titulo: "Professora-IA adaptativa", texto: "Correções gentis, notas de 0 a 10 e exercícios sob medida." },
                { icone: CalendarCheck, titulo: "Questionários rápidos", texto: "5 pergatinhas ao fim de cada lição e um questionário final." },
              ].map((c) => (
                <div key={c.titulo} className="rounded-xl border border-creme/15 bg-verde-d/40 p-4">
                  <c.icone className="w-5 h-5 text-amarelo" aria-hidden />
                  <div className="mt-2 fonte-marca text-lg">{c.titulo}</div>
                  <p className="mt-1 text-sm text-creme/70 leading-relaxed">{c.texto}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setEtapa("tcle")}
                className="bg-ruivo hover:bg-ruivo/90 text-creme rounded-full px-8 h-12 text-base"
              >
                Quero participar
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setEtapa("recuperar")}
                className="bg-transparent border-creme/30 text-creme hover:bg-creme/10 hover:text-creme rounded-full px-8 h-12 text-base"
              >
                Já tenho um código
              </Button>
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-creme/60">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
              Pesquisa aprovada com adulto (18+). Dados tratados conforme LGPD e identificados por código.
            </p>
          </div>
        </div>
      )}

      {/* CONTEÚDO / FLUXOS */}
      <main className="flex-1 bg-creme">
        <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
          {etapa === "hero" && (
            <section aria-labelledby="sobre">
              <h2 id="sobre" className="fonte-marca text-2xl sm:text-3xl font-semibold">
                Como funciona a pesquisa
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-tinta/85">
                <p>
                  Esta é uma pesquisa do <b>MBA em Data Science e Analytics (USP ESALQ)</b> sobre
                  personalização do aprendizado de línguas com machine learning. Ao participar,
                  você escolhe <b>um idioma</b> (inglês, espanhol ou francês) e percorre a trilha de
                  10 lições divididas em 5 encontros.
                </p>
                <p>
                  Em cada lição você conversa por escrito com a professora-IA, que corrige seus
                  erros com explicações simples, atribui notas de 0 a 10 e propõe exercícios
                  adequados ao seu nível. O aplicativo registra, de forma pseudonimizada, o seu
                  desempenho (notas, acertos, tempo e dicas) e a sua percepção ao longo da trilha.
                </p>
                <p>
                  A participação é <b>voluntária</b> e restrita a maiores de 18 anos. A análise usa
                  apenas o seu código de participante — nunca o seu nome. Você pode encerrar a
                  participação quando quiser.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-areia/70 border border-verde/15 p-5 text-sm leading-relaxed">
                <div className="flex items-center gap-2 font-semibold">
                  <Feather className="w-4 h-4 text-ruivo" aria-hidden />
                  Pesquisadora
                </div>
                <p className="mt-1.5 text-tinta/80">
                  Ana Luiza Gonçalves César · Orientador: Douglas Augusto de Paula ·
                  MBA USP/Esalq
                </p>
              </div>
            </section>
          )}

          {etapa === "tcle" && (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h2 className="fonte-marca text-2xl font-semibold">Termo de Consentimento</h2>
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-tinta/85">
                  <p>Ao participar desta pesquisa, você concorda que:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Sua participação é <b>voluntária</b> e você pode sair quando quiser, sem qualquer penalidade.</li>
                    <li>Os dados coletados (desempenho nas lições e respostas dos questionários) serão usados apenas para fins acadêmicos.</li>
                    <li>Você é identificado nas análises <b>apenas por código</b>; nome e sobrenome não aparecem em relatórios.</li>
                    <li>Seus dados são tratados conforme a <b>LGPD</b> (Lei 13.709/2018) e armazenados de forma segura.</li>
                    <li>O estudo é conduzido por Ana Luiza Gonçalves César, orientado por Douglas Augusto de Paula — MBA em Data Science e Analytics, USP ESALQ.</li>
                  </ul>
                </div>
                <label className="mt-6 flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={tceOk}
                    onCheckedChange={(v) => setTceOk(v === true)}
                    className="mt-0.5"
                    aria-label="Aceito o Termo de Consentimento"
                  />
                  <span className="text-[15px] leading-snug">
                    <b>Li e aceito</b> os termos acima e autorizo minha participação na pesquisa.
                  </span>
                </label>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={() => setEtapa("hero")}>Voltar</Button>
                  <Button
                    disabled={!tceOk}
                    onClick={() => setEtapa("registro")}
                    className="bg-verde hover:bg-verde/90 text-creme"
                  >
                    Continuar cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {etapa === "registro" && (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h2 className="fonte-marca text-2xl font-semibold">Cadastro do participante</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Campos mínimos para o estudo — nada além disso.
                </p>
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="nome">Nome</Label>
                      <Input id="nome" value={primeiroNome} onChange={(e) => setPrimeiroNome(e.target.value)} placeholder="Seu primeiro nome" autoComplete="given-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sobrenome">Sobrenome</Label>
                      <Input id="sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Seu sobrenome" autoComplete="family-name" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="idade">Idade</Label>
                      <Input id="idade" inputMode="numeric" value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 27" />
                      <p className="text-xs text-muted-foreground">Participação restrita a 18 anos ou mais.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nivel">Nível no idioma escolhido</Label>
                      <Select value={nivel} onValueChange={setNivel}>
                        <SelectTrigger id="nivel"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {NIVEIS_DECLARADOS.map((n) => (
                            <SelectItem key={n.valor} value={String(n.valor)}>{n.rotulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Qual idioma você quer praticar?</Label>
                    <RadioGroup value={idioma} onValueChange={setIdioma} className="grid gap-3 sm:grid-cols-3">
                      {IDIOMAS.map((i) => (
                        <label key={i} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-white px-4 py-3 has-[button[data-state=checked]]:border-verde has-[button[data-state=checked]]:bg-areia/50">
                          <RadioGroupItem value={i} />
                          <span className="text-[15px]">{i}</span>
                        </label>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      Um idioma só, do início ao fim — a trilha inteira será nesse idioma.
                    </p>
                  </div>
                </div>
                <div className="mt-7 flex gap-3">
                  <Button variant="outline" onClick={() => setEtapa("tcle")}>Voltar</Button>
                  <Button
                    disabled={!formularioValido || enviando}
                    onClick={registrar}
                    className="bg-ruivo hover:bg-ruivo/90 text-creme"
                  >
                    {enviando ? "Registrando..." : "Criar meu código"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {etapa === "codigo" && (
            <Card className="border-verde/30">
              <CardContent className="p-6 sm:p-8 text-center">
                <h2 className="fonte-marca text-2xl font-semibold">Bem-vinda(o) à pesquisa!</h2>
                <p className="mt-2 text-[15px] text-tinta/80">
                  Guarde seu <b>código de participante</b>. Ele recupera seu progresso em
                  qualquer dispositivo, pelo mesmo link.
                </p>
                <div className="mt-6 mx-auto w-fit rounded-2xl border-2 border-dashed border-ruivo/60 bg-areia/60 px-10 py-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Seu código</div>
                  <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wide mt-1 text-verde">{codigoGerado}</div>
                </div>
                <div className="mt-4 flex justify-center">
                  <BotaoCopiar
                    valor={codigoGerado}
                    texto={`Meu código no Sabiá: ${codigoGerado} — app de prática de idiomas da pesquisa (MBA USP/Esalq).`}
                    rotulo="Copiar código"
                  />
                </div>
                <Button
                  size="lg"
                  className="mt-8 bg-verde hover:bg-verde/90 text-creme rounded-full px-8 h-12"
                  onClick={() => onRegistrado(codigoGerado)}
                >
                  Começar a trilha
                  <span aria-hidden>→</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {etapa === "recuperar" && (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h2 className="fonte-marca text-2xl font-semibold">Recuperar progresso</h2>
                <p className="mt-2 text-[15px] text-tinta/80">
                  Digite o código que você recebeu ao se cadastrar (ex.: SAB-K7QP).
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Input
                    value={codigoDigitado}
                    onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase())}
                    placeholder="SAB-XXXX"
                    className="font-mono text-lg tracking-widest h-12"
                    aria-label="Código de participante"
                  />
                  <Button
                    disabled={codigoDigitado.trim().length < 4 || recuperando}
                    onClick={recuperar}
                    className="h-12 bg-verde hover:bg-verde/90 text-creme"
                  >
                    {recuperando ? "Buscando..." : "Entrar"}
                  </Button>
                </div>
                <Button variant="link" className="mt-4 px-0 text-ruivo" onClick={() => setEtapa("hero")}>
                  ← Voltar ao início
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="bg-verde-d text-creme/70">
        <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2">
            <img src="/marca/sabia-simbolo-negative.svg" alt="" className="w-5 h-5 opacity-70" width={20} height={20} aria-hidden />
            Sabiá · Toda voz se aprende.
          </span>
          <div className="flex items-center gap-4">
            <span>MBA em Data Science e Analytics · USP ESALQ · 2026</span>
            <button
              type="button"
              onClick={onPesquisadora}
              className="text-creme/50 hover:text-creme underline underline-offset-2 transition-colors"
            >
              Área da pesquisadora
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
