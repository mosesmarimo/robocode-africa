import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AiService } from "./ai.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import {
  validateInputSchema,
  type ValidateInput,
  vibeInputSchema,
  type VibeInput,
  aiConfigUpdateSchema,
  type AiConfigUpdate,
  runCodeSchema,
  type RunCodeInput,
  generateCodeSchema,
  type GenerateCodeInput,
  explainCodeSchema,
  type ExplainCodeInput,
  validateCodeSchema,
  type ValidateCodeInput,
} from "./dto";

// AI calls cost money — cap them per IP (on top of the global limit).
@Throttle({ default: { ttl: 60_000, limit: 20 } })
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Validate a circuit with the user's effective AI model. */
  @RequireActive()
  @Post("validate")
  validate(@CurrentUser() user: AuthUser, @Body(new ZodPipe(validateInputSchema)) body: ValidateInput) {
    return this.ai.validateCircuit(body, user);
  }

  /** Generate a kid-friendly project description. */
  @RequireActive()
  @Post("describe")
  describe(@CurrentUser() user: AuthUser, @Body(new ZodPipe(validateInputSchema)) body: ValidateInput) {
    return this.ai.describeCircuit(body, user);
  }

  /** RoboVibe — natural-language edit: AI rewrites the diagram, code and README. */
  @RequireActive()
  @Post("vibe")
  vibe(@CurrentUser() user: AuthUser, @Body(new ZodPipe(vibeInputSchema)) body: VibeInput) {
    return this.ai.vibeCircuit(body, user);
  }

  /** Coding Studio — AI "runs" the (multi-file) project and returns stdout or a syntax error. */
  @RequireActive()
  @Post("run-code")
  runCode(@CurrentUser() user: AuthUser, @Body(new ZodPipe(runCodeSchema)) body: RunCodeInput) {
    return this.ai.runCode(user, body.language, body.files, body.entry);
  }

  /** Coding Studio RoboVibe — generate a single file or small project from a description. */
  @RequireActive()
  @Post("generate-code")
  generateCode(@CurrentUser() user: AuthUser, @Body(new ZodPipe(generateCodeSchema)) body: GenerateCodeInput) {
    return this.ai.generateCode(user, body.language, body.instruction);
  }

  /** Coding Studio Code Explainer — line-by-line explanation. */
  @RequireActive()
  @Post("explain-code")
  explainCode(@CurrentUser() user: AuthUser, @Body(new ZodPipe(explainCodeSchema)) body: ExplainCodeInput) {
    return this.ai.explainCode(user, body.language, body.code, body.filename, body.projectId);
  }

  /** Coding Studio Validate with AI — review the code before running. */
  @RequireActive()
  @Post("validate-code")
  validateCode(@CurrentUser() user: AuthUser, @Body(new ZodPipe(validateCodeSchema)) body: ValidateCodeInput) {
    return this.ai.validateCode(user, body.language, body.code, body.filename);
  }

  /** The effective AI config + scope + whether the caller may edit it (key masked). */
  @RequireActive()
  @Get("config")
  getConfig(@CurrentUser() user: AuthUser) {
    return this.ai.getConfig(user);
  }

  /** Update the school's AI config (school admins) or the solo user's own. */
  @RequireActive()
  @Put("config")
  updateConfig(@CurrentUser() user: AuthUser, @Body(new ZodPipe(aiConfigUpdateSchema)) body: AiConfigUpdate) {
    return this.ai.updateConfig(user, body);
  }
}
