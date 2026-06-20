import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators";
import { APP_NAME } from "./domain/constants";

@Controller()
export class AppController {
  @Public()
  @Get()
  root() {
    return { name: `${APP_NAME} API`, status: "ok" };
  }

  @Public()
  @Get("health")
  health() {
    return { status: "ok", uptime: process.uptime() };
  }
}
