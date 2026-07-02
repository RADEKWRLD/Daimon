import { createTRPCRouter } from "../trpc";
import { profileRouter } from "./profile.router";
import { promptRouter } from "./prompt.router";
import { questionnaireRouter } from "./questionnaire.router";
import { sessionRouter } from "./session.router";

export const appRouter = createTRPCRouter({
  questionnaire: questionnaireRouter,
  profile: profileRouter,
  prompt: promptRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
