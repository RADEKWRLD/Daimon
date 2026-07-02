import { z } from "zod";

export const submitQuestionnaireInputSchema = z.object({
  responses: z.record(z.string().min(1), z.string().min(1).max(2000)),
});
