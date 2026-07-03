import { z } from "zod";

import {
  createResourceInputSchema,
  createSectionInputSchema,
  deleteResourceInputSchema,
  deleteSectionInputSchema,
  resolveProposalInputSchema,
  updateResourceInputSchema,
  updateSectionInputSchema,
} from "@/services/persona/schema";
import { personaService } from "@/services/persona/service";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const personaRouter = createTRPCRouter({
  createInitialPersona: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(80).default("Daimon") }))
    .mutation(({ ctx, input }) =>
      personaService.createInitialPersona(ctx.user.id, input.name),
    ),

  getOverview: protectedProcedure.query(({ ctx }) =>
    personaService.getOverview(ctx.user.id),
  ),

  updateOverview: protectedProcedure
    .input(
      z.object({
        personaId: z.string().uuid(),
        description: z.string().min(1).max(2000).optional(),
        roleBoundary: z.string().min(1).max(1000).optional(),
        crisisBoundary: z.string().min(1).max(1000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      personaService.updateOverview(ctx.user.id, input.personaId, input),
    ),

  listSections: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      personaService.listSections(ctx.user.id, input.personaId),
    ),

  createSection: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }).merge(createSectionInputSchema))
    .mutation(({ ctx, input }) =>
      personaService.createSection(ctx.user.id, input.personaId, input),
    ),

  updateSection: protectedProcedure
    .input(updateSectionInputSchema)
    .mutation(({ ctx, input }) =>
      personaService.updateSection(ctx.user.id, input.sectionId, input),
    ),

  deleteSection: protectedProcedure
    .input(deleteSectionInputSchema)
    .mutation(({ ctx, input }) =>
      personaService.deleteSection(ctx.user.id, input.sectionId),
    ),

  listResources: protectedProcedure
    .input(
      z.object({ personaId: z.string().uuid(), sectionId: z.string().uuid().optional() }),
    )
    .query(({ ctx, input }) =>
      personaService.listResources(ctx.user.id, input.personaId, input.sectionId),
    ),

  createResource: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }).merge(createResourceInputSchema))
    .mutation(({ ctx, input }) =>
      personaService.createResource(ctx.user.id, input.personaId, input),
    ),

  updateResource: protectedProcedure
    .input(updateResourceInputSchema)
    .mutation(({ ctx, input }) =>
      personaService.updateResource(ctx.user.id, input.resourceId, input),
    ),

  deleteResource: protectedProcedure
    .input(deleteResourceInputSchema)
    .mutation(({ ctx, input }) =>
      personaService.deleteResource(ctx.user.id, input.resourceId),
    ),

  resolveProposal: protectedProcedure
    .input(resolveProposalInputSchema)
    .mutation(({ ctx, input }) =>
      personaService.resolveProposal(ctx.user.id, input.proposalId, input.decision),
    ),

  listRecentProposals: protectedProcedure
    .input(z.object({ personaId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      personaService.listRecentProposals(ctx.user.id, input.personaId),
    ),

  listPendingProposals: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      personaService.listPendingProposals(ctx.user.id, input.sessionId),
    ),
});
