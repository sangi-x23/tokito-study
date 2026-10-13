-- CreateTable
CREATE TABLE "Kanji" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "frequency" INTEGER,
    "meanings" TEXT[],
    "onyomi" TEXT[],
    "kunyomi" TEXT[],
    "strokes" TEXT[],

    CONSTRAINT "Kanji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kanji_character_key" ON "Kanji"("character");

-- CreateIndex
CREATE INDEX "Kanji_grade_idx" ON "Kanji"("grade");
