// Schemas de validação (Zod) das rotas de API — Fase A (docs/security/SECURITY.md § 2.4).
// Primeira barreira: forma e limites dos payloads. As regras de negócio
// (sequência da trilha, status de sessão, TCLE etc.) continuam nas rotas,
// que devolvem as mensagens específicas em português.

import { z } from "zod";
import { IDIOMAS, MODOS, TRILHA_LICOES } from "./pesquisa";

const codigoParticipante = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^SAB-[A-Z0-9]{1,12}$/, "Código de participante inválido.");

export const registroSchema = z.object({
  firstName: z.string().trim().min(1, "Informe nome e sobrenome.").max(60),
  lastName: z.string().trim().min(1, "Informe nome e sobrenome.").max(60),
  age: z.number().int().min(18, "A pesquisa é restrita a participantes maiores de 18 anos.").max(120),
  selfLevel: z.number().int().min(1, "Selecione seu nível (1 a 5).").max(5),
  language: z.enum(IDIOMAS, { message: "Selecione um dos três idiomas." }),
  tceAccepted: z.literal(true, { message: "É necessário aceitar o Termo de Consentimento (TCLE)." }),
});

export const recuperarSchema = z.object({
  code: codigoParticipante,
});

export const iniciarLicaoSchema = z.object({
  code: codigoParticipante,
  lessonNumber: z.number().int().min(1).max(TRILHA_LICOES),
  mode: z.string().refine((m) => MODOS.some((x) => x.id === m), "Modo inválido."),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1, "Sessão inválida.").max(64),
});

export const mensagemSchema = sessionIdSchema.extend({
  content: z.string().trim().min(1, "Escreva uma resposta (até 2000 caracteres).").max(2000),
});

export const microSchema = z.object({
  sessionId: z.string().min(1).max(64),
  ml1: z.number().int().min(1).max(5),
  ml2: z.number().int().min(1).max(5),
  ml3: z.number().int().min(1).max(5),
  ml4: z.number().int().min(1).max(5),
  tempoMin: z.number().int().min(0).max(600).nullish(),
});

const likert = z.number().int().min(1).max(5);
const item = (k: string) => `${k} (use 1 a 5)`;

export const questionarioFinalSchema = z
  .object({
    code: codigoParticipante,
    ut1: likert, ut2: likert, ut3: likert, ut4: likert,
    cf1: likert, cf2: likert, cf3: likert, cf4: likert,
    df1: likert, df2: likert, df3: likert, df4: likert,
    re1: likert, re2: likert, re3: likert, re4: likert,
    ct1: likert, ct2: likert, ct3: likert, ct4: likert,
    dg1: z.number().int().min(1).max(5),
    dg2: z.number().int().min(0).max(10),
    dg3: z.string().max(1000).default(""),
    qa1: z.string().trim().max(3000).optional(),
    qa2: z.string().trim().max(3000).optional(),
    qa3: z.string().trim().max(3000).optional(),
  })
  // mensagens específicas por item, como na validação manual anterior
  .superRefine((v, ctx) => {
    const likerts: [keyof typeof v, string][] = [
      ["ut1", item("ut1")], ["ut2", item("ut2")], ["ut3", item("ut3")], ["ut4", item("ut4")],
      ["cf1", item("cf1")], ["cf2", item("cf2")], ["cf3", item("cf3")], ["cf4", item("cf4")],
      ["df1", item("df1")], ["df2", item("df2")], ["df3", item("df3")], ["df4", item("df4")],
      ["re1", item("re1")], ["re2", item("re2")], ["re3", item("re3")], ["re4", item("re4")],
      ["ct1", item("ct1")], ["ct2", item("ct2")], ["ct3", item("ct3")], ["ct4", item("ct4")],
      ["dg1", "Satisfação geral inválida (1 a 5)."],
      ["dg2", "Recomendação inválida (0 a 10)."],
    ];
    for (const [k, msg] of likerts) {
      const n = v[k] as number;
      if (!Number.isInteger(n)) ctx.addIssue({ code: "custom", path: [String(k)], message: msg });
    }
  });

/** Converte a primeira falha do safeParse na mensagem de erro da rota. */
export function mensagemDeErro(resultado: { success: false; error: z.ZodError }): string {
  const primeira = resultado.error.issues[0];
  return primeira?.message || "Dados inválidos.";
}
