import { questionnaireService } from "@/services/questionnaire/service";
import { submitQuestionnaireInputSchema } from "@/services/questionnaire/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const questionnaireRouter = createTRPCRouter({
  submitResponses: protectedProcedure
    .input(submitQuestionnaireInputSchema)
    .mutation(({ ctx, input }) =>
      questionnaireService.submitResponses(ctx.user.id, input.responses),
    ),
});
