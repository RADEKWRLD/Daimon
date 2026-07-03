import { profileService } from "@/services/profile/service";
import { upsertProfileInputSchema } from "@/services/profile/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  getCurrentProfile: protectedProcedure.query(({ ctx }) =>
    profileService.getCurrentProfile(ctx.user.id),
  ),

  upsertCurrentProfile: protectedProcedure
    .input(upsertProfileInputSchema)
    .mutation(({ ctx, input }) =>
      profileService.upsertCurrentProfile(ctx.user.id, input),
    ),

  deleteAllData: protectedProcedure.mutation(({ ctx }) =>
    profileService.deleteAllData(ctx.user.id),
  ),
});
