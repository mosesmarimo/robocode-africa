import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

/**
 * Validate a request body/param against a Zod schema.
 * Usage: @Body(new ZodPipe(loginSchema)) body: LoginInput
 * On failure returns 400 with { message, fieldErrors }.
 */
export class ZodPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): ZodInfer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      throw new BadRequestException({ message: "Validation failed", fieldErrors });
    }
    return result.data;
  }
}
