-- CreateTable
CREATE TABLE "LearningTrack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "track" TEXT NOT NULL DEFAULT 'coding',
    "language" TEXT,
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningTrackItem" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "courseId" TEXT,
    "taskId" TEXT,

    CONSTRAINT "LearningTrackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'track',
    "trackId" TEXT,
    "title" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrack_slug_key" ON "LearningTrack"("slug");

-- CreateIndex
CREATE INDEX "LearningTrackItem_courseId_idx" ON "LearningTrackItem"("courseId");

-- CreateIndex
CREATE INDEX "LearningTrackItem_taskId_idx" ON "LearningTrackItem"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrackItem_trackId_order_key" ON "LearningTrackItem"("trackId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrackItem_trackId_courseId_key" ON "LearningTrackItem"("trackId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTrackItem_trackId_taskId_key" ON "LearningTrackItem"("trackId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_code_key" ON "Certificate"("code");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_kind_trackId_key" ON "Certificate"("userId", "kind", "trackId");

-- AddForeignKey
ALTER TABLE "LearningTrackItem" ADD CONSTRAINT "LearningTrackItem_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTrackItem" ADD CONSTRAINT "LearningTrackItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTrackItem" ADD CONSTRAINT "LearningTrackItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

