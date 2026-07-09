import { Global, Module } from "@nestjs/common";
import { NotifyService } from "./notify.service";
import { PointsService } from "./points.service";
import { TenantService } from "./tenant.service";
import { ContentSafetyService } from "./content-safety.service";
import { StreakService } from "./streak.service";
import { GamificationService } from "./gamification.service";

@Global()
@Module({
  providers: [NotifyService, PointsService, TenantService, ContentSafetyService, StreakService, GamificationService],
  exports: [NotifyService, PointsService, TenantService, ContentSafetyService, StreakService, GamificationService],
})
export class CommonModule {}
