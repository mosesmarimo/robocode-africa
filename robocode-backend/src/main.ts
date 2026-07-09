import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false, bodyParser: false });

  // Behind nginx in production; trust the proxy so x-forwarded-host is honoured.
  app.set("trust proxy", true);
  app.use(cookieParser());
  // Circuit screenshots travel as PNG data URLs inside JSON (validate/describe/
  // vibe), so the 100kb body-parser default is far too small. nginx caps
  // requests at 12m — keep Express in step with it.
  app.useBodyParser("json", { limit: "12mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "12mb" });

  const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Never combine origin:true (reflect any Origin) with credentials:true — that
  // would allow credentialed cross-origin requests from any site. In production
  // an empty allow-list is a misconfiguration we fail fast on.
  if (origins.length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FRONTEND_ORIGIN must be set in production (refusing to reflect any Origin with credentials).");
    }
    new Logger("Bootstrap").warn("FRONTEND_ORIGIN is empty; defaulting CORS to http://localhost:3000 (dev only).");
    origins.push("http://localhost:3000");
  }
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Bind to loopback by default: nginx proxies to 127.0.0.1, and keeping the
  // port off the public interface prevents direct hits that could spoof
  // X-Forwarded-For past the rate limiter. Override with BIND_HOST=0.0.0.0.
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.BIND_HOST ?? "127.0.0.1";
  await app.listen(port, host);
  new Logger("Bootstrap").log(`RoboCode API listening on http://${host}:${port}`);
}

void bootstrap();
