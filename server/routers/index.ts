import { createTRPCRouter } from "../trpc";
import { personaRouter } from "./persona.router";
import { profileRouter } from "./profile.router";
import { questionnaireRouter } from "./questionnaire.router";
import { sessionRouter } from "./session.router";

export const appRouter = createTRPCRouter({
  questionnaire: questionnaireRouter,
  profile: profileRouter,
  persona: personaRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
