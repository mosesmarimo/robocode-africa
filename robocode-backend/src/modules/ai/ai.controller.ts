import { Body, Controller, Post } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { validateInputSchema, type ValidateInput } from "./dto";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Validate a circuit with DeepSeek. Mirrors the old `validateProject` action. */
  @RequireActive()
  @Post("validate")
  validate(
    @CurrentUser() _user: AuthUser,
    @Body(new ZodPipe(validateInputSchema)) body: ValidateInput,
  ) {
    return this.ai.validateCircuit(body);
  }

  /** Generate a kid-friendly project description with DeepSeek. Mirrors `describeProject`. */
  @RequireActive()
  @Post("describe")
  describe(
    @CurrentUser() _user: AuthUser,
    @Body(new ZodPipe(validateInputSchema)) body: ValidateInput,
  ) {
    return this.ai.describeCircuit(body);
  }
}
