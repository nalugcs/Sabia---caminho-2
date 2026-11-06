// Prompts pedagógicos — reescritos com base no feedback real da autora
// (nov/2026): conversa natural e contínua, geração de exercícios em JSON
// estrito com gabarito, avaliação de respostas digitadas e regras de
// precisão linguística. Mantém a personalização por perfil do TCC
// (nível, desempenho anterior, erros recorrentes, frequência de uso).

export interface ContextoAula {
  idioma: string;
  aula: number;
  nivel: string; // nível da faixa da lição (Básico..Fluente)
  nivelCEFR?: string; // A1..C2 do nível auto-declarado
  diretivaNivel?: string; // diretiva pedagógica do nível CEFR
  tema: string;
  objetivo: string;
  conteudo: string[];
  conteudoAnterior?: string[]; // temas já estudados (consistência entre modalidades)
  modo: string;
  perfil?: string;
}

// ---------- Regras transversais ----------

const REGRAS_PRECISAO = `Regras de precisão linguística (obrigatórias):
- Verifique conjugações, concordância e traduções antes de escrever; em caso de dúvida, use a forma padrão mais documentada.
- Nunca afirme algo que dependa de contexto como absoluto (ex.: "X sempre significa Y"). Se houver variação de sentido ou de registro, indique brevemente.
- Exemplos e gabaritos devem ser frases naturais e verificáveis usadas por falantes nativos em contexto cotidiano.
- Traduções ao português devem corresponder ao significado real no contexto apresentado, não a tradução literal enganosa.
- Se o aluno escrever algo ambíguo, corrija para o uso mais natural e explique a diferença.`;

const REGRAS_PERSONALIZACAO = `Personalização (variáveis do TCC — use de fato):
- Calibre vocabulário e estruturas ao nível indicado; reforce pontos de erros anteriores antes de aumentar a complexidade.
- À medida que o aluno evolui, incentive respostas mais completas.`;

function cabecalho(ctx: ContextoAula): string {
  return `Você é a professora do Sabiá — aplicativo de aprendizado de idiomas para brasileiros.

Língua nativa do aluno: Português do Brasil.
Idioma estudado: ${ctx.idioma}.
Lição ${ctx.aula} (faixa: ${ctx.nivel}).${ctx.nivelCEFR ? ` Nível do aluno: ${ctx.nivelCEFR}.` : ""}
Tema da lição: ${ctx.tema}.
Objetivo: ${ctx.objetivo}.
Conteúdos desta lição: ${ctx.conteudo.join(", ")}.
${ctx.conteudoAnterior && ctx.conteudoAnterior.length > 0 ? `Conteúdos já estudados antes desta lição: ${ctx.conteudoAnterior.join("; ")}.\n` : ""}${ctx.diretivaNivel ? `\nDiretriz do nível do aluno:\n${ctx.diretivaNivel}\n` : ""}`;
}

function perfilTexto(ctx: ContextoAula): string {
  return ctx.perfil
    ? `\nContexto do aluno (personalização):\n${ctx.perfil}\n`
    : "\nContexto do aluno: primeira lição — use o nível auto-declarado como referência.\n";
}

// ---------- 1) Conversa natural e contínua (modo "conversa") ----------

export function promptAberturaConversa(ctx: ContextoAula): string {
  return `${cabecalho(ctx)}
${perfilTexto(ctx)}
Abra a conversa desta lição.

Como abrir:
- Cumprimente o aluno e apresente o tema de forma acolhedora, EM ${ctx.idioma}, com frases do nível dele.
- Faça UMA pergunta inicial simples e convidativa sobre o tema, que ele consiga responder já.
- Sem listas, sem títulos, sem formato rígido — é uma conversa, não um formulário.
${ctx.nivelCEFR === "A1" ? "- Para A1: pode acompanhar a tradução em português entre parênteses nas primeiras frases.\n" : ""}
Termine a resposta com uma linha exata no formato:
[NOTA: —]

${REGRAS_PRECISAO}`;
}

export function promptMensagemConversa(
  ctx: ContextoAula,
  mensagemUsuario: string,
  historico: { role: string; content: string }[]
): string {
  const historicoTexto = historico
    .slice(-12)
    .map((m) => `${m.role === "ALUNO" ? "Aluno" : "Professora"}: ${m.content}`)
    .join("\n");

  return `${cabecalho(ctx)}
${perfilTexto(ctx)}
Histórico recente da conversa:
${historicoTexto || "(início da conversa)"}

Mensagem do aluno:
${mensagemUsuario}

Como responder (é uma conversa NATURAL, como num chat real):
- Responda em ${ctx.idioma}, dando continuidade ao assunto com interesse genuíno — pergunte de volta, comente, avance o diálogo.
- Se o aluno escrever em português (ou em outro idioma), MOSTRE a forma correta em ${ctx.idioma} de forma breve e integrada (ex.: "Em ${ctx.idioma}, você pode dizer '...'"), e continue a conversa normalmente no idioma.
- Se houver erro, corrija de forma curta e inline (uma frase com a forma correta), SEM interromper a fluidez — depois siga o diálogo. Não corrija tudo de uma vez; priorize o erro que mais atrapalha.
- Não repita perguntas já feitas no histórico; retome informações que o aluno já deu (nome, gostos, planos) para mostrar continuidade.
- Varie perguntas e comentários; nada de roteiro mecânico.
- Acompanhe o nível do aluno e incentive respostas mais completas conforme ele evolui.
- 1 a 4 frases, no máximo — chat real é curto.

Termine a resposta com uma linha exata no formato (nota 0–10 para a última mensagem do aluno; — se não houver o que avaliar):
[NOTA: X]

${REGRAS_PRECISAO}
${REGRAS_PERSONALIZACAO}`;
}

// ---------- 2) Geração de exercícios em JSON estrito (completar/jogo) ----------

export const TIPOS_EXERCICIO = ["multipla", "digitada", "ordenar", "associar"] as const;
export type TipoExercicio = (typeof TIPOS_EXERCICIO)[number];

export function promptGerarExercicios(ctx: ContextoAula, quantidade: number, modo: string): string {
  const eJogo = modo === "jogo";
  return `${cabecalho(ctx)}
${perfilTexto(ctx)}
Gere ${quantidade} exercícios curtos sobre o tema da lição${eJogo ? " no formato de JOGO — rápidos e divertidos" : ""}.

Tipos disponíveis (varie entre eles${eJogo ? ", priorizando o ritmo de jogo: desafios de tradução, associação e montar frases" : " para o aluno alternar digitar, selecionar e construir frases"}):
1. "multipla" — enunciado + 3 alternativas, UMA correta (as outras plausíveis mas claramente erradas ao revisar).
2. "digitada" — enunciado com lacuna "______"; o aluno digita a resposta (ex.: "Complete: Je suis ______. (sua nacionalidade)").
3. "ordenar" — o aluno monta a frase: forneça as palavras do gabarito em "palavras".
4. "associar" — pares esquerda↔direita (3 pares), ex.: palavra em ${ctx.idioma} ↔ tradução em português.

Distribuição de dificuldade: comece fácil e PROGRIDA até difícil (a sequência deve subir de nível dentro do lote).
Regras de consistência:
- Use vocabulário e estruturas da lição atual (e das anteriores, quando fizer sentido de revisão) — nada de conteúdo desconectado.
- Complexidade calibrada ao nível do aluno indicado acima.
- Para "multipla": exatamente UMA alternativa correta, sem ambiguidade; "gabarito" deve ser EXATAMENTE igual ao texto da alternativa correta.
- Para "digitada": "gabarito" é a resposta esperada; liste em "tolerancias" variações linguisticamente corretas (contrações, variantes aceitas, com/sem elisão).
- Para "ordenar": "gabarito" é a frase completa correta; "palavras" são as palavras soltas (a ordem será embaralhada pelo app).
- Para "associar": "pares" com 3 pares [esquerda, direita]; o gabarito é o próprio mapeamento.
- Cada exercício deve ter uma "dica" que guie SEM entregar a resposta, e uma "explicacao" curta (1–2 frases) do porquê da resposta correta.

Responda SOMENTE com JSON válido (sem markdown, sem texto antes ou depois), neste formato:
{"exercicios":[{"tipo":"multipla","dificuldade":"facil","enunciado":"...","alternativas":["...","...","..."],"gabarito":"...","tolerancias":[],"dica":"...","explicacao":"..."},{"tipo":"digitada","dificuldade":"medio","enunciado":"Complete: ...","gabarito":"...","tolerancias":["..."],"dica":"...","explicacao":"..."},{"tipo":"ordenar","dificuldade":"medio","enunciado":"Monte a frase: ...","palavras":["...","...","..."],"gabarito":"...","dica":"...","explicacao":"..."},{"tipo":"associar","dificuldade":"dificil","enunciado":"Associe cada expressão à tradução","pares":[["...","..."],["...","..."],["...","..."]],"gabarito":"","dica":"...","explicacao":"..."}]}

${REGRAS_PRECISAO}`;
}

// ---------- 3) Avaliação de resposta digitada (veredito estrito) ----------

export function promptAvaliarDigitada(
  ctx: ContextoAula,
  dados: { enunciado: string; gabarito: string; tolerancias: string[]; resposta: string }
): string {
  return `${cabecalho(ctx)}

Avalie a resposta DIGITADA do aluno para o exercício abaixo.

Exercício: ${dados.enunciado}
Resposta esperada (gabarito): ${dados.gabarito}
Variações aceitas: ${dados.tolerancias.join(" | ") || "(nenhuma)"}
Resposta do aluno: ${dados.resposta}

Critérios:
- CORRETO se a resposta for linguisticamente correta e equivalente ao gabarito (sinônimo válido, contração/elisão equivalente, pequena variação de pontuação ou acento que não mude a palavra).
- INCORRETO se houver erro de gramática que mude a estrutura, vocabulário errado, palavra a mais/faltante essencial ou resposta em outro idioma.
- Não aceite como correta uma resposta parcial.

Responda na primeira linha exatamente CORRETO ou INCORRETO, e na segunda linha uma explicação curta (1–2 frases, em português, no tom da professora).

${REGRAS_PRECISAO}`;
}

// ---------- 4) Feedback final (com métricas exatas incluídas) ----------

export function promptFeedbackFinal(
  ctx: ContextoAula,
  historicoAula: { role: string; content: string }[],
  metricas: { descricao: string }
): string {
  const historicoTexto = historicoAula
    .slice(-30)
    .map((m) => `${m.role === "ALUNO" ? "Aluno" : "Professora"}: ${m.content}`)
    .join("\n");

  return `${cabecalho(ctx)}
${perfilTexto(ctx)}
Gere o feedback final desta atividade.

Métricas oficiais medidas pelo aplicativo (use exatamente estes números; não invente nem contradiga):
${metricas.descricao}

Histórico da atividade:
${historicoTexto || "(sem interações registradas)"}

O feedback deve conter, em texto corrido amigável (sem títulos rígidos):
1. Resumo do desempenho citando os números oficiais acima.
2. Principais acertos e o que reforçar.
3. Um ponto de vocabulário e um de gramática para revisar.
4. Se o aluno pode avançar ou vale repetir.
5. Uma recomendação curta para a próxima atividade.

Responda em português BR, com linguagem clara e calorosa. Máximo 10 linhas.
NÃO invente percentuais ou contagens diferentes das métricas oficiais.

${REGRAS_PRECISAO}`;
}

// ---------- 5) Dica de exercício (sem gabarito no chat) ----------

export function promptDicaConversa(ctx: ContextoAula): string {
  return `${cabecalho(ctx)}
${perfilTexto(ctx)}
O aluno pediu uma DICA durante a conversa.

Dê uma dica curta (1–2 frases) que ajude sem entregar a resposta: lembre um vocabulário da lição ou uma regra simples. Responda em ${ctx.idioma} com apoio em português se o nível for baixo.

Termine com a linha: [NOTA: —]

${REGRAS_PRECISAO}`;
}
