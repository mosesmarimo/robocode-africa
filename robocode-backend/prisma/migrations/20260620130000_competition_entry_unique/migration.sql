-- Prevent duplicate competition entries (NULLs are distinct in Postgres).
CREATE UNIQUE INDEX "CompetitionEntry_competitionId_userId_key" ON "CompetitionEntry"("competitionId", "userId");
CREATE UNIQUE INDEX "CompetitionEntry_competitionId_teamId_key" ON "CompetitionEntry"("competitionId", "teamId");
