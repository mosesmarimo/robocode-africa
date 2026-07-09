import { Module } from "@nestjs/common";
import { TtsController } from "./tts.controller";
import { TtsService, POLLY_CLIENT } from "./tts.service";
import { getPollyClient } from "./polly";

@Module({
  controllers: [TtsController],
  providers: [TtsService, { provide: POLLY_CLIENT, useFactory: () => getPollyClient() }],
})
export class TtsModule {}
