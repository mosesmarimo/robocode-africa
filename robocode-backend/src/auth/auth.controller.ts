import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthService, publicUser } from "./auth.service";
import { TenantService } from "../common/tenant.service";
import { ZodPipe } from "../common/zod.pipe";
import { loginSchema, studentSignupSchema, schoolSignupSchema, type LoginInput, type StudentSignupInput, type SchoolSignupInput } from "../domain/validation";
import { Public, CurrentUser } from "./decorators";
import type { AuthUser } from "./auth-user.type";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tenants: TenantService,
  ) {}

  @Public()
  @Post("login")
  async login(@Body(new ZodPipe(loginSchema)) body: LoginInput, @Req() req: Request) {
    const tenant = await this.tenants.fromRequest(req);
    return this.auth.login(body, tenant);
  }

  @Public()
  @Post("student-signup")
  async studentSignup(@Body(new ZodPipe(studentSignupSchema)) body: StudentSignupInput, @Req() req: Request) {
    const tenant = await this.tenants.fromRequest(req);
    return this.auth.studentSignup(body, tenant);
  }

  @Public()
  @Post("school-signup")
  async schoolSignup(@Body(new ZodPipe(schoolSignupSchema)) body: SchoolSignupInput) {
    return this.auth.schoolSignup(body);
  }

  @Public()
  @Post("logout")
  logout() {
    // Stateless JWT: the web/mobile client clears its stored token/cookie.
    return { ok: true };
  }

  @Public()
  @Get("me")
  me(@CurrentUser() user: AuthUser | undefined) {
    return { user: user ? publicUser(user) : null };
  }
}
