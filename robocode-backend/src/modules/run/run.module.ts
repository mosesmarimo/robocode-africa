import { Module } from "@nestjs/common";
import { RunController } from "./run.controller";
import { RunService } from "./run.service";
import { SandboxService } from "./sandbox.service";

@Module({
  controllers: [RunController],
  providers: [RunService, SandboxService],
  // Exported so ProjectsService / a future grading module (Task 7) can call
  // RunService.execute() directly without going through HTTP.
  exports: [RunService],
})
export class RunModule {}
