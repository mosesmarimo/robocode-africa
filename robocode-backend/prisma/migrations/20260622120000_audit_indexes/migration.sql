-- Performance audit: indexes on hot filter/sort columns.

-- CreateIndex
CREATE INDEX "User_role_status_roboPoints_idx" ON "User"("role", "status", "roboPoints");

-- CreateIndex
CREATE INDEX "User_tenantId_role_status_roboPoints_idx" ON "User"("tenantId", "role", "status", "roboPoints");

-- CreateIndex
CREATE INDEX "Team_tenantId_roboPoints_idx" ON "Team"("tenantId", "roboPoints");

-- CreateIndex
CREATE INDEX "Submission_userId_createdAt_idx" ON "Submission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Class_tenantId_teacherId_idx" ON "Class"("tenantId", "teacherId");

-- CreateIndex
CREATE INDEX "ClassMember_userId_idx" ON "ClassMember"("userId");

-- CreateIndex
CREATE INDEX "ModerationCase_status_createdAt_idx" ON "ModerationCase"("status", "createdAt");
