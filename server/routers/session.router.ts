import { z } from "zod";

import { sandboxRepository } from "@/services/storage/repositories";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(120).default("New session"),
      }),
    )
    .mutation(({ ctx, input }) =>
      sandboxRepository.createSession(ctx.user.id, input.title),
    ),
});
