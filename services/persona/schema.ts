import { z } from "zod";

export const createSectionInputSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(4000),
});

export const updateSectionInputSchema = z.object({
  sectionId: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(4000).optional(),
});

export const deleteSectionInputSchema = z.object({
  sectionId: z.string().uuid(),
});

export const createResourceInputSchema = z.object({
  sectionId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(4000),
});

export const updateResourceInputSchema = z.object({
  resourceId: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(4000).optional(),
});

export const deleteResourceInputSchema = z.object({
  resourceId: z.string().uuid(),
});

export const resolveProposalInputSchema = z.object({
  proposalId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

// Argument schemas for the tools exposed to the LLM (services/persona/tools.ts).
// Parsed from the model's function-call arguments JSON before dispatch.
export const toolArgsSchemas = {
  list_persona_sections: z.object({}),
  read_persona_section: z.object({ sectionId: z.string().uuid() }),
  list_persona_resources: z.object({ sectionId: z.string().uuid().optional() }),
  read_persona_resource: z.object({ resourceId: z.string().uuid() }),
  propose_create_section: z.object({
    title: z.string().min(1).max(120),
    content: z.string().min(1).max(4000),
    reason: z.string().min(1).max(500),
  }),
  propose_update_section: z.object({
    sectionId: z.string().uuid(),
    content: z.string().min(1).max(4000),
    reason: z.string().min(1).max(500),
  }),
  propose_delete_section: z.object({
    sectionId: z.string().uuid(),
    reason: z.string().min(1).max(500),
  }),
  propose_create_resource: z.object({
    title: z.string().min(1).max(120),
    content: z.string().min(1).max(4000),
    reason: z.string().min(1).max(500),
  }),
} as const;

export type ToolName = keyof typeof toolArgsSchemas;
