import { Module } from "@nestjs/common";
import { SchoolController } from "./school.controller";
import { SchoolService } from "./school.service";
import { ReferralsModule } from "../referrals/referrals.module";

@Module({
  imports: [ReferralsModule],
  controllers: [SchoolController],
  providers: [SchoolService],
})
export class SchoolModule {}
