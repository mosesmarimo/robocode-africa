import "server-only";
import { prisma } from "@/lib/prisma";

type NotifyInput = {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

export async function notify(input: NotifyInput) {
  return prisma.notification.create({
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
export async function sendEmail(to: string, subject: string, body: string) {
  // eslint-disable-next-line no-console
  console.log(`\n[email] -> ${to}\n  subject: ${subject}\n  ${body}\n`);
  return { ok: true };
}
