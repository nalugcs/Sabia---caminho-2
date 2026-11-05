// Semáforo de concorrência + retry com backoff exponencial.
// Aprendizado do orquestrador: limite de 2 chamadas simultâneas ao SDK,
// com timeout e backoff 1s → 4s.

export class Semaphoro {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits = 2) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    if (this.permits > 0) {
      this.permits--;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.permits--;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    this.permits++;
    const next = this.queue.shift();
    if (next) next();
  }
}

export function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const BACKOFFS = [1000, 4000];

export async function comRetry<T>(
  fn: () => Promise<T>,
  onTentativaFalha?: (erro: unknown, tentativa: number) => void
): Promise<T> {
  let ultimoErro: unknown;
  for (let tentativa = 0; tentativa <= BACKOFFS.length; tentativa++) {
    try {
      return await fn();
    } catch (e) {
      ultimoErro = e;
      onTentativaFalha?.(e, tentativa + 1);
      if (tentativa < BACKOFFS.length) await dormir(BACKOFFS[tentativa]);
    }
  }
  throw ultimoErro;
}

export function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de ${ms}ms`)), ms)
    ),
  ]);
}
