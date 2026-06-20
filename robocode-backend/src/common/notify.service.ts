import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type NotifyInput = {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class NotifyService {
  private readonly logger = new Logger("Notify");

  constructor(private readonly prisma: PrismaService) {}

  async notify(input: NotifyInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "info",
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as object | undefined,
      },
    });
  }

  /** Local email stub — logs to the server console. Swap for SES/SendGrid in production. */
  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`email -> ${to} | ${subject} | ${body}`);
    return { ok: true };
  }
}
