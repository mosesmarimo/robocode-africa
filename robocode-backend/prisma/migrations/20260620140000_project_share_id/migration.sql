-- Public read-only share link slug for projects.
ALTER TABLE "Project" ADD COLUMN "shareId" TEXT;
CREATE UNIQUE INDEX "Project_shareId_key" ON "Project"("shareId");
