-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "aiScore" INTEGER,
ADD COLUMN     "aiScoreData" JSONB,
ADD COLUMN     "scoredAt" TIMESTAMP(3);

