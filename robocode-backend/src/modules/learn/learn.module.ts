import { Module } from "@nestjs/common";
import { LearnController } from "./learn.controller";
import { LearnService } from "./learn.service";
import { TracksModule } from "../tracks/tracks.module";

@Module({
  imports: [TracksModule], // TracksService.onCourseCompleted — course-complete learning-track hook
  controllers: [LearnController],
  providers: [LearnService],
})
export class LearnModule {}
