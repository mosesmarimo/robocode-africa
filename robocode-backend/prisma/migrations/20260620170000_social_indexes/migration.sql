-- DropIndex
DROP INDEX "Post_targetType_targetId_createdAt_idx";

-- DropIndex
DROP INDEX "PostComment_postId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Post_targetType_targetId_archivedAt_status_createdAt_idx" ON "Post"("targetType", "targetId", "archivedAt", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PostComment_postId_archivedAt_status_createdAt_idx" ON "PostComment"("postId", "archivedAt", "status", "createdAt");

