import { Module } from "@nestjs/common";
import { ProjectsController, PublicProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  controllers: [ProjectsController, PublicProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
