import { Module } from "@nestjs/common";
import {
  BadgesController,
  ChallengesController,
  CompetitionsController,
  LeaderboardController,
} from "./competitions.controller";
import { CompetitionsService } from "./competitions.service";
import { AiModule } from "../ai/ai.module";
import { RunModule } from "../run/run.module";
import { TracksModule } from "../tracks/tracks.module";

@Module({
  imports: [
    AiModule, // AiService — AI-runtime fallback when the sandbox runner is unavailable / for unsupported languages
    RunModule, // RunService — primary grading execution for coding-language challenges (jailed docker sandbox)
    TracksModule, // TracksService.onChallengePassed — post-pass learning-track completion hook
  ],
  controllers: [
    CompetitionsController,
    ChallengesController,
    BadgesController,
    LeaderboardController,
  ],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
