"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Landing } from "@/components/sabia/Landing";
import { Trilha } from "@/components/sabia/Trilha";
import { Licao } from "@/components/sabia/Licao";
import { Resumo } from "@/components/sabia/Resumo";
import { QuestionarioFinal } from "@/components/sabia/QuestionarioFinal";
import { Pesquisadora } from "@/components/sabia/Pesquisadora";
import { chamarAPI, type EstadoSessao, type ResultadoEncerrar } from "@/components/sabia/tipos";
import { Bird } from "lucide-react";

type Visao =
  | { tipo: "carregando" }
  | { tipo: "landing" }
  | { tipo: "trilha"; focoDialogo?: number }
  | { tipo: "licao"; numero: number; modo: string }
  | { tipo: "resumo"; sessionId: string; numero: number; modo: string; resultado: ResultadoEncerrar }
  | { tipo: "final" }
  | { tipo: "obrigado" }
  | { tipo: "pesquisadora" };

const CHAVE = "sabia_codigo";

export default function Page() {
  const [visao, setVisao] = useState<Visao>({ tipo: "carregando" });
  const [codigo, setCodigo] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoSessao | null>(null);
  const iniciado = useRef(false);

  // recuperação automática pelo mesmo link
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    (async () => {
      const salvo = localStorage.getItem(CHAVE);
      if (!salvo) {
        setVisao({ tipo: "landing" });
        return;
      }
      try {
        const e = await chamarAPI<EstadoSessao>("/api/sessao/recuperar", { code: salvo });
        setCodigo(salvo);
        setEstado(e);
        setVisao({ tipo: "trilha" });
      } catch {
        localStorage.removeItem(CHAVE);
        setVisao({ tipo: "landing" });
      }
    })();
  }, []);

  const carregarEstado = useCallback(async (code: string): Promise<EstadoSessao> => {
    const e = await chamarAPI<EstadoSessao>("/api/sessao/recuperar", { code });
    setEstado(e);
    return e;
  }, []);

  function onRegistrado(code: string) {
    localStorage.setItem(CHAVE, code);
    setCodigo(code);
    carregarEstado(code).then(() => setVisao({ tipo: "trilha", focoDialogo: 1 }));
  }

  function onRecuperado(e: EstadoSessao) {
    localStorage.setItem(CHAVE, e.participante.code);
    setCodigo(e.participante.code);
    setEstado(e);
    setVisao({ tipo: "trilha" });
  }

  function sair() {
    localStorage.removeItem(CHAVE);
    setCodigo(null);
    setEstado(null);
    setVisao({ tipo: "landing" });
  }

  function voltarTrilha(focoDialogo?: number) {
    if (codigo) {
      carregarEstado(codigo).then(() => setVisao({ tipo: "trilha", focoDialogo }));
    } else {
      setVisao({ tipo: "landing" });
    }
  }

  if (visao.tipo === "carregando") {
    return (
      <div className="min-h-screen bg-creme flex flex-col items-center justify-center gap-4">
        <img src="/marca/sabia-simbolo-color.svg" alt="Sabiá" className="w-16 h-16" width={64} height={64} />
        <div className="animate-pulse text-sm text-tinta/60">abrindo o Sabiá...</div>
      </div>
    );
  }

  if (visao.tipo === "landing") {
    return (
      <Landing
        onRegistrado={onRegistrado}
        onRecuperado={onRecuperado}
        onPesquisadora={() => setVisao({ tipo: "pesquisadora" })}
      />
    );
  }

  if (visao.tipo === "pesquisadora") {
    return <Pesquisadora />;
  }

  if (!codigo || !estado) {
    return (
      <div className="min-h-screen bg-creme flex items-center justify-center">
        <Button onClick={() => setVisao({ tipo: "landing" })}>Voltar ao início</Button>
      </div>
    );
  }

  if (visao.tipo === "trilha") {
    return (
      <Trilha
        estado={estado}
        codigo={codigo}
        focoDialogo={visao.focoDialogo}
        onAbrirLicao={(numero, modo) => setVisao({ tipo: "licao", numero, modo })}
        onVerQuestionarioFinal={() => setVisao({ tipo: "final" })}
        onSair={sair}
        onAvancou={() => voltarTrilha()}
      />
    );
  }

  if (visao.tipo === "licao") {
    return (
      <Licao
        key={`${visao.numero}-${visao.modo}-${Date.now()}`}
        codigo={codigo}
        lessonNumber={visao.numero}
        mode={visao.modo}
        onVoltar={() => voltarTrilha()}
        onEncerrada={(resultado, sessionId) =>
          setVisao({
            tipo: "resumo",
            sessionId,
            numero: visao.numero,
            modo: visao.modo,
            resultado,
          })
        }
      />
    );
  }

  if (visao.tipo === "resumo") {
    return (
      <Resumo
        codigo={codigo}
        sessionId={visao.sessionId}
        lessonNumber={visao.numero}
        mode={visao.modo}
        resultado={visao.resultado}
        onPraticarOutroModo={() => voltarTrilha(visao.numero)}
        onRepetirAtividade={() => setVisao({ tipo: "licao", numero: visao.numero, modo: visao.modo })}
        onAvancarLicao={() => voltarTrilha(visao.resultado.acoes.proximaLicao ?? undefined)}
        onVoltarTrilha={() => voltarTrilha()}
      />
    );
  }

  if (visao.tipo === "final") {
    return (
      <QuestionarioFinal
        codigo={codigo}
        onVoltar={() => voltarTrilha()}
        onConcluido={() => {
          carregarEstado(codigo).then(() => setVisao({ tipo: "obrigado" }));
        }}
      />
    );
  }

  // obrigado
  return (
    <div className="min-h-screen bg-verde text-creme flex flex-col items-center justify-center px-6 text-center">
      <img src="/marca/sabia-simbolo-negative.svg" alt="Sabiá" className="w-20 h-20 mb-6" width={80} height={80} />
      <Bird className="w-8 h-8 text-amarelo mb-3" aria-hidden />
      <h1 className="fonte-marca text-3xl sm:text-4xl font-semibold">Obrigada por cantar com a gente!</h1>
      <p className="mt-4 max-w-md text-creme/80 leading-relaxed">
        Sua trilha de 10 lições e o questionário final foram registrados. Com sua
        participação, a pesquisa sobre personalização do aprendizado de idiomas avança —
        toda voz se aprende.
      </p>
      <Button
        variant="outline"
        className="mt-8 border-creme/40 text-creme hover:bg-creme/10 hover:text-creme bg-transparent rounded-full px-6"
        onClick={() => voltarTrilha()}
      >
        Ver minha trilha
      </Button>
    </div>
  );
}
