-- AlterTable
ALTER TABLE "LessonSession" ADD COLUMN     "exercisesCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "exercisesTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "dificuldade" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativas" TEXT,
    "pares" TEXT,
    "gabarito" TEXT NOT NULL,
    "tolerancias" TEXT,
    "dica" TEXT,
    "respostaAluno" TEXT,
    "correta" BOOLEAN,
    "nota" DOUBLE PRECISION,
    "explicacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEm" TIMESTAMP(3),

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_sessionId_ordem_idx" ON "Exercise"("sessionId", "ordem");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
