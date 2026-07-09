-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "aiConfig" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiConfig" JSONB;
