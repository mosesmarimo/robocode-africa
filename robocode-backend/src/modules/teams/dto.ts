import { z } from "zod";

/**
 * Body for creating a team. Mirrors the old `createTeam(name, description)`
 * server action arguments. Length validation matching the original is enforced
 * in the service (so we can return the same error string), so the schema only
 * coerces shapes here.
 */
export const createTeamSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * Body for posting a team chat message. Mirrors the old `postMessage(teamId, body)`
 * action — `teamId` comes from the route param, so only the body is here.
 */
export const postMessageSchema = z.object({
  body: z.string(),
});
export type PostMessageInput = z.infer<typeof postMessageSchema>;
