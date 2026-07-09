-- AlterTable: coding-language challenges (null/"arduino" → simulator-graded; a coding language → stdout-graded)
ALTER TABLE "Task" ADD COLUMN "language" TEXT;
