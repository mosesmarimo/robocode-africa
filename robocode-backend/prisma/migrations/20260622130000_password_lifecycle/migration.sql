-- AlterTable: credential lifecycle (JWT revocation + temp-password expiry)
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "tempPasswordExpiresAt" TIMESTAMP(3);
