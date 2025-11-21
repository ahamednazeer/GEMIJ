-- CreateEnum
CREATE TYPE "PublicationDestination" AS ENUM ('CURRENT_ISSUE', 'PAST_ISSUE', 'CONFERENCE', 'ONLINE_FIRST');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentMethod" TEXT DEFAULT 'STRIPE',
ADD COLUMN     "proofUrl" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "conferenceId" TEXT,
ADD COLUMN     "featuredArticle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onlineFirst" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicationDestination" "PublicationDestination",
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3),
ADD COLUMN     "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "conferences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "proceedingsNo" TEXT,
    "category" TEXT,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_settings" (
    "id" TEXT NOT NULL,
    "showTitle" BOOLEAN NOT NULL DEFAULT true,
    "showAuthors" BOOLEAN NOT NULL DEFAULT true,
    "showAbstract" BOOLEAN NOT NULL DEFAULT true,
    "showKeywords" BOOLEAN NOT NULL DEFAULT true,
    "showPublicationDate" BOOLEAN NOT NULL DEFAULT true,
    "showDOI" BOOLEAN NOT NULL DEFAULT true,
    "showConflicts" BOOLEAN NOT NULL DEFAULT false,
    "showFunding" BOOLEAN NOT NULL DEFAULT false,
    "showHistory" BOOLEAN NOT NULL DEFAULT false,
    "showReferences" BOOLEAN NOT NULL DEFAULT false,
    "showOrcid" BOOLEAN NOT NULL DEFAULT false,
    "enablePdfDownload" BOOLEAN NOT NULL DEFAULT true,
    "pdfWatermark" TEXT,
    "showInlinePdf" BOOLEAN NOT NULL DEFAULT false,
    "showInTOC" BOOLEAN NOT NULL DEFAULT true,
    "showSequenceNo" BOOLEAN NOT NULL DEFAULT true,
    "showPageNumbers" BOOLEAN NOT NULL DEFAULT true,
    "addToSearchIndex" BOOLEAN NOT NULL DEFAULT true,
    "includeInSitemap" BOOLEAN NOT NULL DEFAULT true,
    "includeInOAIPMH" BOOLEAN NOT NULL DEFAULT true,
    "includeInRSS" BOOLEAN NOT NULL DEFAULT true,
    "enableGoogleScholar" BOOLEAN NOT NULL DEFAULT true,
    "embargoUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "publication_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "publication_settings_submissionId_key" ON "publication_settings"("submissionId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "conferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_settings" ADD CONSTRAINT "publication_settings_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
