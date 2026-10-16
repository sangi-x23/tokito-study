-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "jmdictSeq" INTEGER NOT NULL,
    "partsOfSpeech" TEXT[],
    "usuallyKana" BOOLEAN NOT NULL,
    "equivalents" TEXT[],
    "meaning" TEXT NOT NULL,
    "examples" JSONB NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vocabulary_level_idx" ON "Vocabulary"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Vocabulary_japanese_reading_key" ON "Vocabulary"("japanese", "reading");
