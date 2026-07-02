import { z } from "zod";

export const chatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});
