import { Module } from "@nestjs/common";
import {
  BadgesController,
  ChallengesController,
  CompetitionsController,
  LeaderboardController,
} from "./competitions.controller";
import { CompetitionsService } from "./competitions.service";

@Module({
  controllers: [
    CompetitionsController,
    ChallengesController,
    BadgesController,
    LeaderboardController,
  ],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
