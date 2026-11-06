// Segurança da aplicação de pesquisa — Fase A (docs/security/SECURITY.md § 2).
// PIN timing-safe + rate limiting em memória (suficiente para 1 instância).

import { createHash, timingSafeEqual } from "crypto";

// ---------- PIN timing-safe ----------

/**
 * Compara o PIN informado com o esperado em tempo constante (sha256 + timingSafeEqual).
 * Hash intermediário garante buffers do mesmo tamanho (32 bytes) em qualquer entrada.
 */
export function pinCorreto(informado: string, esperado: string): boolean {
  if (!esperado || !informado) return false;
  if (informado.length > 128 || esperado.length > 128) return false;
  const a = createHash("sha256").update(informado, "utf8").digest();
  const b = createHash("sha256").update(esperado, "utf8").digest();
  return timingSafeEqual(a, b);
}

// ---------- Rate limiting (janela fixa por IP) ----------

type Janela = { contagem: number; resetEm: number };
const tentativas = new Map<string, Janela>();
const LIMITE_MAPA = 10_000; // proteção contra crescimento sem limite

/** IP do cliente (proxy do host repassa em x-forwarded-for; dev local vira "local"). */
export function ipDe(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

/**
 * Retorna true se o pedido é permitido; conta tentativas por IP numa janela fixa.
 * Uso: painel/exportação (10/min), registro (20/min), recuperar sessão (10/min).
 */
export function permitir(ip: string, max: number, janelaMs = 60_000): boolean {
  const agora = Date.now();
  if (tentativas.size > LIMITE_MAPA) {
    for (const [chave, j] of tentativas) {
      if (j.resetEm < agora) tentativas.delete(chave);
    }
  }
  const j = tentativas.get(ip);
  if (!j || j.resetEm <= agora) {
    tentativas.set(ip, { contagem: 1, resetEm: agora + janelaMs });
    return true;
  }
  j.contagem += 1;
  return j.contagem <= max;
}
