import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
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
import { LearnModule } from "./modules/learn/learn.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { SchoolModule } from "./modules/school/school.module";
import { TeacherModule } from "./modules/teacher/teacher.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    AccountModule,
    AdminModule,
    AiModule,
    CompetitionsModule,
    LearnModule,
    NotificationsModule,
    ProjectsModule,
    SchoolModule,
    TeacherModule,
    TeamsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
