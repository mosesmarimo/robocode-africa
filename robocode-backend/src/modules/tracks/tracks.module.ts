import { Module } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { CertificatesController } from "./certificates.controller";
import { TracksService } from "./tracks.service";

@Module({
  controllers: [TracksController, CertificatesController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
