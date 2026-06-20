import { Global, Module } from "@nestjs/common";
import { NotifyService } from "./notify.service";
import { PointsService } from "./points.service";
import { TenantService } from "./tenant.service";

@Global()
@Module({
  providers: [NotifyService, PointsService, TenantService],
  exports: [NotifyService, PointsService, TenantService],
})
export class CommonModule {}
