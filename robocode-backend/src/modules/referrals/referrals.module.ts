import { Module } from "@nestjs/common";
import { ReferralsController } from "./referrals.controller";
import { ReferralsService } from "./referrals.service";

@Module({
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService], // consumed by AuthService (recordSignup/settleIfActive) and admin/school approval flows
})
export class ReferralsModule {}
