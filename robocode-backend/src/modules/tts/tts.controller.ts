import { Body, Controller, Post, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { z } from "zod";
import { TtsService } from "./tts.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive } from "../../auth/decorators";

const ttsSchema = z.object({
  text: z.string().min(1).max(6000),
  voice: z.string().max(40).optional(),
});
type TtsInput = z.infer<typeof ttsSchema>;

// Text-to-speech costs money — cap per IP.
@Throttle({ default: { ttl: 60_000, limit: 30 } })
@Controller("tts")
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  /** Synthesize speech and return mp3 bytes (AWS Polly neural). */
  @RequireActive()
  @Post()
  async synthesize(@Body(new ZodPipe(ttsSchema)) body: TtsInput, @Res() res: Response): Promise<void> {
    const audio = await this.tts.synthesize(body.text, body.voice);
    const buf = Buffer.from(audio);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", buf.length);
    res.status(200).end(buf);
  }
}
