import type { Prisma } from "@prisma/client";

/** The authenticated user shape attached to requests (includes tenant). */
export type AuthUser = Prisma.UserGetPayload<{ include: { tenant: true } }>;
