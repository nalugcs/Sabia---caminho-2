-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "selfLevel" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "tceAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSession" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER,
    "finalFeedback" TEXT,
    "provider" TEXT,

    CONSTRAINT "LessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "correcao" TEXT,
    "explicacao" TEXT,
    "exemplo" TEXT,
    "nota" DOUBLE PRECISION,
    "proximoExercicio" TEXT,
    "provider" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroQuestionnaire" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "ml1" INTEGER NOT NULL,
    "ml2" INTEGER NOT NULL,
    "ml3" INTEGER NOT NULL,
    "ml4" INTEGER NOT NULL,
    "tempoMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MicroQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalQuestionnaire" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "ut1" INTEGER NOT NULL,
    "ut2" INTEGER NOT NULL,
    "ut3" INTEGER NOT NULL,
    "ut4" INTEGER NOT NULL,
    "cf1" INTEGER NOT NULL,
    "cf2" INTEGER NOT NULL,
    "cf3" INTEGER NOT NULL,
    "cf4" INTEGER NOT NULL,
    "df1" INTEGER NOT NULL,
    "df3" INTEGER NOT NULL,
    "df2" INTEGER NOT NULL,
    "df4" INTEGER NOT NULL,
    "re1" INTEGER NOT NULL,
    "re2" INTEGER NOT NULL,
    "re3" INTEGER NOT NULL,
    "re4" INTEGER NOT NULL,
    "ct1" INTEGER NOT NULL,
    "ct2" INTEGER NOT NULL,
    "ct3" INTEGER NOT NULL,
    "ct4" INTEGER NOT NULL,
    "dg1" INTEGER NOT NULL,
    "dg2" INTEGER NOT NULL,
    "dg3" TEXT NOT NULL,
    "qa1" TEXT,
    "qa2" TEXT,
    "qa3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_code_key" ON "Participant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_language_number_key" ON "Lesson"("language", "number");

-- CreateIndex
CREATE UNIQUE INDEX "MicroQuestionnaire_sessionId_key" ON "MicroQuestionnaire"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalQuestionnaire_participantId_key" ON "FinalQuestionnaire"("participantId");

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroQuestionnaire" ADD CONSTRAINT "MicroQuestionnaire_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroQuestionnaire" ADD CONSTRAINT "MicroQuestionnaire_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalQuestionnaire" ADD CONSTRAINT "FinalQuestionnaire_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

