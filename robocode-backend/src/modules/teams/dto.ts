import { z } from "zod";

/**
 * Body for creating a team. Mirrors the old `createTeam(name, description)`
 * server action arguments. Length validation matching the original is enforced
 * in the service (so we can return the same error string), so the schema only
 * coerces shapes here.
 */
export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters.").max(60),
  description: z.string().max(500).optional().default(""),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * Body for posting a team chat message. Mirrors the old `postMessage(teamId, body)`
 * action — `teamId` comes from the route param, so only the body is here.
 */
export const postMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty.").max(500, "Message too long (max 500 characters)."),
});
export type PostMessageInput = z.infer<typeof postMessageSchema>;
