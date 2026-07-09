-- AlterTable
ALTER TABLE "CodeFile" ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "explanationHash" TEXT,
ADD COLUMN     "explanationAt" TIMESTAMP(3);
