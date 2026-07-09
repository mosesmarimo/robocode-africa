import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import type { PollyClient } from "@aws-sdk/client-polly";
import { synthesizeSpeech, isValidVoiceId, DEFAULT_VOICE_ID } from "./polly";

export const POLLY_CLIENT = "POLLY_CLIENT";

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  constructor(@Inject(POLLY_CLIENT) private readonly polly: PollyClient) {}

  /** Synthesize speech (mp3). Long text is trimmed to Polly's 3000-char limit. */
  async synthesize(text?: string | null, voice?: string | null): Promise<Uint8Array> {
    const voiceId = voice || DEFAULT_VOICE_ID;
    if (!text || text.trim().length === 0) throw new BadRequestException('Missing "text" parameter');
    if (!isValidVoiceId(voiceId)) throw new BadRequestException(`Invalid voice: ${voiceId}`);
    const clipped = text.length > 3000 ? text.slice(0, 2990) + "…" : text;
    try {
      return await synthesizeSpeech(this.polly, clipped, voiceId);
    } catch (error) {
      this.logger.error("TTS error", error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException("Failed to synthesize speech");
    }
  }
}
