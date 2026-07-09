import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ReferralsModule } from "../referrals/referrals.module";
import { PublishModule } from "../publish/publish.module";

@Module({
  imports: [ReferralsModule, PublishModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
