-- CreateEnum
CREATE TYPE "KanaScript" AS ENUM ('HIRAGANA', 'KATAKANA');

-- CreateEnum
CREATE TYPE "KanaKind" AS ENUM ('BASIC', 'DAKUTEN', 'HANDAKUTEN', 'SMALL', 'COMBINATION', 'EXTENDED');

-- CreateTable
CREATE TABLE "Kana" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "script" "KanaScript" NOT NULL,
    "kind" "KanaKind" NOT NULL,
    "romaji" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "strokes" TEXT[],

    CONSTRAINT "Kana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kana_character_key" ON "Kana"("character");

-- CreateIndex
CREATE UNIQUE INDEX "Kana_script_kind_row_column_key" ON "Kana"("script", "kind", "row", "column");
