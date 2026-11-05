import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type LessonSeed = {
  nivel: string;
  tema: string;
  objetivo: string;
  conteudo: string[];
};

// Plano de aulas — Inglês (fiel ao PLANO_AULAS do notebook do TCC)
const INGLES: LessonSeed[] = [
  { nivel: "Básico", tema: "Apresentação pessoal", objetivo: "Aprender a se apresentar usando frases simples.", conteudo: ["Cumprimentos", "Nome", "Idade", "Nacionalidade", "Frases com I am"] },
  { nivel: "Básico", tema: "Família e pessoas", objetivo: "Aprender vocabulário básico sobre família e pessoas.", conteudo: ["Mother", "Father", "Sister", "Brother", "Friend"] },
  { nivel: "Básico", tema: "Rotina diária", objetivo: "Falar sobre ações simples do dia a dia.", conteudo: ["Wake up", "Work", "Study", "Eat", "Sleep"] },
  { nivel: "Básico", tema: "Gostos e preferências", objetivo: "Dizer o que gosta e o que não gosta.", conteudo: ["I like", "I don't like", "Food", "Music", "Movies"] },
  { nivel: "Básico", tema: "Revisão do básico", objetivo: "Revisar apresentações, rotina e preferências.", conteudo: ["Revisão de frases básicas", "Correção de erros comuns", "Mini conversa"] },
  { nivel: "Intermediário", tema: "Passado simples", objetivo: "Aprender a falar sobre eventos passados.", conteudo: ["Simple Past", "Yesterday", "Last week", "Regular verbs", "Irregular verbs"] },
  { nivel: "Intermediário", tema: "Planos futuros", objetivo: "Falar sobre planos e intenções.", conteudo: ["Going to", "Will", "Tomorrow", "Next week"] },
  { nivel: "Intermediário", tema: "Compras e restaurante", objetivo: "Usar o idioma em situações práticas.", conteudo: ["Ordering food", "Prices", "Questions", "Polite requests"] },
  { nivel: "Intermediário", tema: "Viagens", objetivo: "Conversar em aeroporto, hotel e transporte.", conteudo: ["Airport", "Hotel", "Directions", "Transportation"] },
  { nivel: "Intermediário", tema: "Revisão intermediária", objetivo: "Revisar passado, futuro e situações reais.", conteudo: ["Mini diálogo", "Correção de escrita", "Vocabulário prático"] },
  { nivel: "Avançado", tema: "Opiniões e argumentos", objetivo: "Expressar opinião com clareza.", conteudo: ["I believe", "In my opinion", "Because", "However"] },
  { nivel: "Avançado", tema: "Texto e interpretação", objetivo: "Ler e responder perguntas sobre textos.", conteudo: ["Reading comprehension", "Main idea", "Details", "Vocabulary in context"] },
  { nivel: "Avançado", tema: "Correção gramatical", objetivo: "Melhorar precisão gramatical.", conteudo: ["Verb tense", "Prepositions", "Word order", "Natural phrases"] },
  { nivel: "Avançado", tema: "Ambiente profissional", objetivo: "Usar o idioma em contexto de trabalho.", conteudo: ["Meetings", "Emails", "Presentations", "Professional vocabulary"] },
  { nivel: "Avançado", tema: "Revisão avançada", objetivo: "Consolidar escrita, leitura e conversa.", conteudo: ["Debate", "Long answers", "Error correction"] },
  { nivel: "Fluente", tema: "Conversa natural", objetivo: "Conversar com naturalidade.", conteudo: ["Idioms", "Natural expressions", "Follow-up questions"] },
  { nivel: "Fluente", tema: "Simulação real", objetivo: "Resolver situações reais no idioma.", conteudo: ["Problem solving", "Real-life scenarios", "Spontaneous answers"] },
  { nivel: "Fluente", tema: "Fluência e naturalidade", objetivo: "Melhorar ritmo, clareza e naturalidade.", conteudo: ["Natural speech", "Short answers", "Connected ideas"] },
  { nivel: "Fluente", tema: "Discussões complexas", objetivo: "Discutir temas abstratos.", conteudo: ["Culture", "Technology", "Work", "Society"] },
  { nivel: "Fluente", tema: "Avaliação final", objetivo: "Avaliar domínio geral do idioma.", conteudo: ["Conversation", "Writing", "Grammar", "Vocabulary", "Final feedback"] },
];

// Plano equivalente — Espanhol
const ESPANHOL: LessonSeed[] = [
  { nivel: "Básico", tema: "Presentación personal", objetivo: "Aprender a se apresentar usando frases simples.", conteudo: ["Saludos", "Nombre", "Edad", "Nacionalidad", "Frases com Soy"] },
  { nivel: "Básico", tema: "Familia y personas", objetivo: "Aprender vocabulário básico sobre família e pessoas.", conteudo: ["Madre", "Padre", "Hermana", "Hermano", "Amigo"] },
  { nivel: "Básico", tema: "Rutina diaria", objetivo: "Falar sobre ações simples do dia a dia.", conteudo: ["Despertarse", "Trabajar", "Estudiar", "Comer", "Dormir"] },
  { nivel: "Básico", tema: "Gustos y preferencias", objetivo: "Dizer o que gosta e o que não gosta.", conteudo: ["Me gusta", "No me gusta", "Comida", "Música", "Películas"] },
  { nivel: "Básico", tema: "Repaso básico", objetivo: "Revisar apresentações, rotina e preferências.", conteudo: ["Repaso de frases básicas", "Corrección de errores comunes", "Mini conversación"] },
  { nivel: "Intermediário", tema: "Pasado simple", objetivo: "Aprender a falar sobre eventos passados.", conteudo: ["Pretérito perfecto", "Ayer", "La semana pasada", "Verbos regulares", "Verbos irregulares"] },
  { nivel: "Intermediário", tema: "Planes futuros", objetivo: "Falar sobre planos e intenções.", conteudo: ["Ir a + infinitivo", "Futuro", "Mañana", "La próxima semana"] },
  { nivel: "Intermediário", tema: "Compras y restaurante", objetivo: "Usar o idioma em situações práticas.", conteudo: ["Pedir comida", "Precios", "Preguntas", "Peticiones corteses"] },
  { nivel: "Intermediário", tema: "Viajes", objetivo: "Conversar em aeroporto, hotel e transporte.", conteudo: ["Aeropuerto", "Hotel", "Direcciones", "Transporte"] },
  { nivel: "Intermediário", tema: "Repaso intermedio", objetivo: "Revisar passado, futuro e situações reais.", conteudo: ["Mini diálogo", "Corrección escrita", "Vocabulario práctico"] },
  { nivel: "Avançado", tema: "Opiniones y argumentos", objetivo: "Expressar opinião com clareza.", conteudo: ["Creo que", "En mi opinión", "Porque", "Sin embargo"] },
  { nivel: "Avançado", tema: "Texto e interpretación", objetivo: "Ler e responder perguntas sobre textos.", conteudo: ["Comprensión lectora", "Idea principal", "Detalles", "Vocabulario en contexto"] },
  { nivel: "Avançado", tema: "Corrección gramatical", objetivo: "Melhorar precisão gramatical.", conteudo: ["Tiempos verbales", "Preposiciones", "Orden de palabras", "Frases naturales"] },
  { nivel: "Avançado", tema: "Ambiente profissional", objetivo: "Usar o idioma em contexto de trabalho.", conteudo: ["Reuniones", "Correos", "Presentaciones", "Vocabulario profesional"] },
  { nivel: "Avançado", tema: "Repaso avanzado", objetivo: "Consolidar escrita, leitura e conversa.", conteudo: ["Debate", "Respuestas largas", "Corrección de errores"] },
  { nivel: "Fluente", tema: "Conversación natural", objetivo: "Conversar com naturalidade.", conteudo: ["Modismos", "Expresiones naturales", "Preguntas de seguimiento"] },
  { nivel: "Fluente", tema: "Simulación real", objetivo: "Resolver situações reais no idioma.", conteudo: ["Resolución de problemas", "Escenarios reales", "Respuestas espontáneas"] },
  { nivel: "Fluente", tema: "Fluidez y naturalidad", objetivo: "Melhorar ritmo, clareza e naturalidade.", conteudo: ["Habla natural", "Respuestas cortas", "Ideas conectadas"] },
  { nivel: "Fluente", tema: "Discusiones complejas", objetivo: "Discutir temas abstratos.", conteudo: ["Cultura", "Tecnología", "Trabajo", "Sociedad"] },
  { nivel: "Fluente", tema: "Evaluación final", objetivo: "Avaliar domínio geral do idioma.", conteudo: ["Conversación", "Escritura", "Gramática", "Vocabulario", "Retroalimentación final"] },
];

// Plano equivalente — Francês
const FRANCES: LessonSeed[] = [
  { nivel: "Básico", tema: "Présentation personnelle", objetivo: "Aprender a se apresentar usando frases simples.", conteudo: ["Salutations", "Nom", "Âge", "Nationalité", "Phrases com Je suis"] },
  { nivel: "Básico", tema: "Famille et personnes", objetivo: "Aprender vocabulário básico sobre família e pessoas.", conteudo: ["Mère", "Père", "Sœur", "Frère", "Ami"] },
  { nivel: "Básico", tema: "Routine quotidienne", objetivo: "Falar sobre ações simples do dia a dia.", conteudo: ["Se réveiller", "Travailler", "Étudier", "Manger", "Dormir"] },
  { nivel: "Básico", tema: "Goûts et préférences", objetivo: "Dizer o que gosta e o que não gosta.", conteudo: ["J'aime", "Je n'aime pas", "Nourriture", "Musique", "Films"] },
  { nivel: "Básico", tema: "Révision de base", objetivo: "Revisar apresentações, rotina e preferências.", conteudo: ["Révision des phrases de base", "Correction des erreurs courantes", "Mini conversation"] },
  { nivel: "Intermediário", tema: "Passé composé", objetivo: "Aprender a falar sobre eventos passados.", conteudo: ["Passé composé", "Hier", "La semaine dernière", "Verbes réguliers", "Verbes irréguliers"] },
  { nivel: "Intermediário", tema: "Projets futurs", objetivo: "Falar sobre planos e intenções.", conteudo: ["Aller + infinitif", "Futur simple", "Demain", "La semaine prochaine"] },
  { nivel: "Intermediário", tema: "Achats et restaurant", objetivo: "Usar o idioma em situações práticas.", conteudo: ["Commander", "Prix", "Questions", "Demandes polies"] },
  { nivel: "Intermediário", tema: "Voyages", objetivo: "Conversar em aeroporto, hotel e transporte.", conteudo: ["Aéroport", "Hôtel", "Directions", "Transports"] },
  { nivel: "Intermediário", tema: "Révision intermédiaire", objetivo: "Revisar passado, futuro e situações reais.", conteudo: ["Mini dialogue", "Correction écrite", "Vocabulaire pratique"] },
  { nivel: "Avançado", tema: "Opinions et arguments", objetivo: "Expressar opinião com clareza.", conteudo: ["Je pense que", "À mon avis", "Parce que", "Cependant"] },
  { nivel: "Avançado", tema: "Texte et interprétation", objetivo: "Ler e responder perguntas sobre textos.", conteudo: ["Compréhension écrite", "Idée principale", "Détails", "Vocabulaire en contexte"] },
  { nivel: "Avançado", tema: "Correction grammaticale", objetivo: "Melhorar precisão gramatical.", conteudo: ["Temps verbaux", "Prépositions", "Ordre des mots", "Phrases naturelles"] },
  { nivel: "Avançado", tema: "Milieu professionnel", objetivo: "Usar o idioma em contexto de trabalho.", conteudo: ["Réunions", "E-mails", "Présentations", "Vocabulaire professionnel"] },
  { nivel: "Avançado", tema: "Révision avancée", objetivo: "Consolidar escrita, leitura e conversa.", conteudo: ["Débat", "Réponses longues", "Correction des erreurs"] },
  { nivel: "Fluente", tema: "Conversation naturelle", objetivo: "Conversar com naturalidade.", conteudo: ["Expressions idiomatiques", "Expressions naturelles", "Questions de relance"] },
  { nivel: "Fluente", tema: "Simulation réelle", objetivo: "Resolver situações reais no idioma.", conteudo: ["Résolution de problèmes", "Scénarios réels", "Réponses spontanées"] },
  { nivel: "Fluente", tema: "Fluidité et naturalité", objetivo: "Melhorar ritmo, clareza e naturalidade.", conteudo: ["Parole naturelle", "Réponses courtes", "Idées liées"] },
  { nivel: "Fluente", tema: "Discussions complexes", objetivo: "Discutir temas abstratos.", conteudo: ["Culture", "Technologie", "Travail", "Société"] },
  { nivel: "Fluente", tema: "Évaluation finale", objetivo: "Avaliar domínio geral do idioma.", conteudo: ["Conversation", "Écriture", "Grammaire", "Vocabulaire", "Bilan final"] },
];

async function main() {
  const planos: Record<string, LessonSeed[]> = {
    Inglês: INGLES,
    Espanhol: ESPANHOL,
    Francês: FRANCES,
  };

  let total = 0;
  for (const [language, lessons] of Object.entries(planos)) {
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      await db.lesson.upsert({
        where: { language_number: { language, number: i + 1 } },
        update: {
          level: l.nivel,
          theme: l.tema,
          objective: l.objetivo,
          content: JSON.stringify(l.conteudo),
        },
        create: {
          language,
          number: i + 1,
          level: l.nivel,
          theme: l.tema,
          objective: l.objetivo,
          content: JSON.stringify(l.conteudo),
        },
      });
      total++;
    }
  }
  console.log(`Seed concluído: ${total} lições (3 idiomas × 20).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
