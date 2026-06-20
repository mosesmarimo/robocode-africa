import { z } from "zod";

/**
 * Body for entering a competition. Mirrors the old `enterCompetition` server
 * action arguments: `(competitionId: string, teamId?: string)`. The
 * competitionId comes from the route param, so only the optional teamId is in
 * the body.
 */
export const enterCompetitionSchema = z.object({
  // Optional team entry; when omitted the entry is created for the solo user.
  teamId: z.string().optional(),
});

export type EnterCompetitionInput = z.infer<typeof enterCompetitionSchema>;

/** Body for submitting a challenge solution. The taskId comes from the route param. */
export const submitSolutionSchema = z.object({
  code: z.string(),
});

export type SubmitSolutionInput = z.infer<typeof submitSolutionSchema>;
