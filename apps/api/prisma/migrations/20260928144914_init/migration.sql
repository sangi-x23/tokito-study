-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('GRAMMAR', 'VOCABULARY', 'KANJI', 'EXPRESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WORD', 'KANJI', 'GRAMMAR_POINT', 'PHRASE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "googleDocId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lastRevision" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classDate" TIMESTAMP(3),
    "position" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TopicCategory" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyItem" (
    "id" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "japanese" TEXT NOT NULL,
    "reading" TEXT,
    "meaning" TEXT NOT NULL,
    "example" TEXT,

    CONSTRAINT "StudyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTopic" (
    "itemId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemTopic_pkey" PRIMARY KEY ("itemId","topicId")
);

-- CreateTable
CREATE TABLE "KanjiDetail" (
    "itemId" TEXT NOT NULL,
    "onyomi" TEXT[],
    "kunyomi" TEXT[],
    "strokeCount" INTEGER,
    "jlptLevel" INTEGER,

    CONSTRAINT "KanjiDetail_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "ItemOccurrence" (
    "itemId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "ItemOccurrence_pkey" PRIMARY KEY ("itemId","sectionId")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "hash" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "sectionsProcessed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_googleDocId_key" ON "SourceDocument"("googleDocId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_documentId_tabId_key" ON "Section"("documentId", "tabId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_parentId_idx" ON "Topic"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyItem_type_japanese_key" ON "StudyItem"("type", "japanese");

-- CreateIndex
CREATE INDEX "ItemTopic_topicId_idx" ON "ItemTopic"("topicId");

-- CreateIndex
CREATE INDEX "ItemOccurrence_sectionId_idx" ON "ItemOccurrence"("sectionId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTopic" ADD CONSTRAINT "ItemTopic_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StudyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTopic" ADD CONSTRAINT "ItemTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiDetail" ADD CONSTRAINT "KanjiDetail_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StudyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOccurrence" ADD CONSTRAINT "ItemOccurrence_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StudyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOccurrence" ADD CONSTRAINT "ItemOccurrence_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
-- Candado de ingesta: como máximo una corrida en RUNNING a la vez.
-- Índice único parcial escrito a mano; Prisma no sabe expresarlos en el schema.
-- Todas las filas que cumplen el predicado comparten el mismo valor indexado,
-- así que Postgres solo admite una.
CREATE UNIQUE INDEX "IngestionRun_one_running" ON "IngestionRun" ("status") WHERE "status" = 'RUNNING';
