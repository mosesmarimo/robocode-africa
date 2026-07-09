import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { AppController } from "./app.controller";
// Domain modules (added incrementally):
import { AccountModule } from "./modules/account/account.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AiModule } from "./modules/ai/ai.module";
import { CompetitionsModule } from "./modules/competitions/competitions.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { LearnModule } from "./modules/learn/learn.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { PublishModule } from "./modules/publish/publish.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { RunModule } from "./modules/run/run.module";
import { SchoolModule } from "./modules/school/school.module";
import { SocialModule } from "./modules/social/social.module";
import { TeacherModule } from "./modules/teacher/teacher.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { TracksModule } from "./modules/tracks/tracks.module";
import { TtsModule } from "./modules/tts/tts.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limiting (per IP; nginx forwards the real IP via trust proxy).
    // Default 120 req/min; auth + AI routes set tighter per-route limits.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    AccountModule,
    AdminModule,
    AiModule,
    CompetitionsModule,
    LeaderboardModule,
    LearnModule,
    NotificationsModule,
    ProjectsModule,
    PublishModule,
    ReferralsModule,
    RunModule,
    SchoolModule,
    SocialModule,
    TeacherModule,
    TeamsModule,
    TracksModule,
    TtsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
