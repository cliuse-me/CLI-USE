import { z } from "zod";

export const SpecSchema = z.object({
  overview: z.string(),
  userStories: z.array(z.string()),
  edgeCases: z.array(z.string()),
});

export const TddPlanSchema = z.object({
  testFilesToCreate: z.array(z.string()),
  testCases: z.array(
    z.object({
      name: z.string(),
      assertions: z.array(z.string()),
    }),
  ),
});
