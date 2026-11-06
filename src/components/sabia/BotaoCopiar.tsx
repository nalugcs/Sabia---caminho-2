"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2 } from "lucide-react";

interface Props {
  /** Texto a copiar (ex.: código do participante) */
  valor: string;
  /** Texto completo do compartilhamento */
  texto?: string;
  rotulo?: string;
  variant?: "solido" | "suave";
  className?: string;
}

/**
 * Copiar + compartilhar (feedback item 8): área de transferência com feedback
 * visual ("Copiado!") e menu nativo de compartilhamento (navigator.share),
 * com fallback para WhatsApp quando o dispositivo não tem share nativo.
 */
export function BotaoCopiar({
  valor,
  texto,
  rotulo = "Copiar",
  variant = "suave",
  className = "",
}: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // fallback para navegadores sem Clipboard API (http antigo)
      const ta = document.createElement("textarea");
      ta.value = valor;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignora */
      }
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function compartilhar() {
    const conteudo = texto || valor;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sabiá", text: conteudo });
        return;
      } catch {
        // usuário cancelou ou navegador falhou — cai para o WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(conteudo)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <span className={`inline-flex gap-2 ${className}`}>
      <Button
        type="button"
        variant={variant === "solido" ? "default" : "outline"}
        size="sm"
        onClick={copiar}
        className={
          variant === "solido"
            ? "bg-verde hover:bg-verde/90 text-creme"
            : "border-verde/40 text-verde hover:bg-areia"
        }
        aria-live="polite"
      >
        {copiado ? (
          <>
            <Check className="w-4 h-4" aria-hidden />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" aria-hidden />
            {rotulo}
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={compartilhar}
        className="border-verde/40 text-verde hover:bg-areia"
        aria-label="Compartilhar"
        title="Compartilhar (WhatsApp ou apps do dispositivo)"
      >
        <Share2 className="w-4 h-4" aria-hidden />
      </Button>
    </span>
  );
}
