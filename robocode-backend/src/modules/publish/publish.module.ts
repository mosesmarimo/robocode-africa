import { Module } from "@nestjs/common";
import { GoDaddyService } from "./godaddy.service";
import { PublishService } from "./publish.service";
import { PublishController } from "./publish.controller";

@Module({
  controllers: [PublishController],
  providers: [GoDaddyService, PublishService],
  exports: [GoDaddyService, PublishService],
})
export class PublishModule {}
