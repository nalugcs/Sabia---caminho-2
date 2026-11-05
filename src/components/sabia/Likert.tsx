"use client";

import { cn } from "@/lib/utils";

interface PropsLikert {
  codigo: string;
  afirmacao: string;
  valor: number | null;
  onChange: (v: number) => void;
  escala?: [number, number];
  rotulos?: { min: string; max: string };
}

// Linha de resposta Likert — botões numerados (versão digital do instrumento).
export function Likert({
  codigo,
  afirmacao,
  valor,
  onChange,
  escala = [1, 5],
  rotulos = { min: "1 — Discordo totalmente", max: "5 — Concordo totalmente" },
}: PropsLikert) {
  const [min, max] = escala;
  const passos = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="py-3">
      <div className="flex gap-3 text-[15px] leading-snug">
        <span className="font-mono text-xs font-semibold text-ruivo pt-0.5 shrink-0">{codigo}</span>
        <span className="flex-1">{afirmacao}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {passos.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${afirmacao} — ${n}`}
            className={cn(
              "h-11 w-11 min-w-11 rounded-full border text-sm font-semibold transition-all touch-manipulation",
              valor === n
                ? "bg-verde text-creme border-verde shadow-sm scale-105"
                : "bg-white text-tinta/70 border-border hover:border-verde/60 hover:bg-areia/60"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-muted-foreground">
        <span>{rotulos.min}</span>
        <span>{rotulos.max}</span>
      </div>
    </div>
  );
}
