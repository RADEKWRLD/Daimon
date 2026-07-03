import "server-only";

import { sandboxRepository } from "@/services/storage/repositories";
import type { UserId } from "@/types/domain";

import { toolArgsSchemas, type ToolName } from "./schema";

/**
 * Tool definitions exposed to the LLM during a chat turn (see
 * services/chat/service.ts). Read tools execute immediately; propose_*
 * tools only ever create a pending row in persona_change_proposals - they
 * never mutate persona_sections/persona_resources directly. There is
 * intentionally no tool that can touch roleBoundary/crisisBoundary/
 * prohibitedMoves; those can only be edited by the user directly.
 */
export const PERSONA_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "list_persona_sections",
      description:
        "列出你当前人格里所有章节的标题（不含正文）。用来了解自己已经有哪些内容，决定是否需要用 read_persona_section 读取详情，或者新建/修改章节。",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_persona_section",
      description: "读取某个人格章节的完整正文内容。",
      parameters: {
        type: "object",
        properties: { sectionId: { type: "string", description: "章节 ID" } },
        required: ["sectionId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_persona_resources",
      description: "列出人格相关的补充资源标题，可选按章节过滤。",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string", description: "可选，按章节过滤" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_persona_resource",
      description: "读取某条补充资源的完整内容。",
      parameters: {
        type: "object",
        properties: { resourceId: { type: "string", description: "资源 ID" } },
        required: ["resourceId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_create_section",
      description:
        "提议新增一个人格章节。这不会立即生效——会向用户展示一张确认卡片，用户同意后才真正创建。",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "章节标题" },
          content: { type: "string", description: "章节正文内容" },
          reason: { type: "string", description: "为什么要新增这个章节，会展示给用户看" },
        },
        required: ["title", "content", "reason"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_update_section",
      description:
        "提议修改某个已有人格章节的正文。这不会立即生效——会向用户展示一张确认卡片，用户同意后才真正更新。",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string", description: "要修改的章节 ID" },
          content: { type: "string", description: "新的正文内容" },
          reason: { type: "string", description: "为什么要这样修改，会展示给用户看" },
        },
        required: ["sectionId", "content", "reason"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_delete_section",
      description:
        "提议删除某个人格章节。这不会立即生效——会向用户展示一张确认卡片，用户同意后才真正删除。",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string", description: "要删除的章节 ID" },
          reason: { type: "string", description: "为什么要删除，会展示给用户看" },
        },
        required: ["sectionId", "reason"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_create_resource",
      description:
        "提议新增一条补充资源（比如某个具体技巧的说明）。这不会立即生效——会向用户展示一张确认卡片，用户同意后才真正创建。",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "资源标题" },
          content: { type: "string", description: "资源内容" },
          reason: { type: "string", description: "为什么需要这条资源，会展示给用户看" },
        },
        required: ["title", "content", "reason"],
      },
    },
  },
];

export type PersonaToolResult = {
  toolResultText: string;
  proposal?: Awaited<ReturnType<typeof sandboxRepository.createProposal>>;
};

export async function dispatchPersonaTool(
  viewerUserId: UserId,
  personaId: string,
  sessionId: string,
  toolName: string,
  rawArgs: unknown,
): Promise<PersonaToolResult> {
  if (!(toolName in toolArgsSchemas)) {
    return { toolResultText: `未知工具：${toolName}` };
  }

  const schema = toolArgsSchemas[toolName as ToolName];
  const parsed = schema.safeParse(rawArgs);

  if (!parsed.success) {
    return { toolResultText: `参数不合法：${parsed.error.message}` };
  }

  switch (toolName as ToolName) {
    case "list_persona_sections": {
      const sections = await sandboxRepository.listPersonaSections(
        viewerUserId,
        personaId,
      );
      return {
        toolResultText: JSON.stringify(
          sections.map((s) => ({ id: s.id, title: s.title })),
        ),
      };
    }

    case "read_persona_section": {
      const { sectionId } = parsed.data as { sectionId: string };
      const section = await sandboxRepository.getOwnedSection(
        viewerUserId,
        sectionId,
      );
      return {
        toolResultText: JSON.stringify({
          title: section.title,
          content: section.content,
        }),
      };
    }

    case "list_persona_resources": {
      const { sectionId } = parsed.data as { sectionId?: string };
      const resources = await sandboxRepository.listPersonaResources(
        viewerUserId,
        personaId,
        sectionId,
      );
      return {
        toolResultText: JSON.stringify(
          resources.map((r) => ({ id: r.id, title: r.title })),
        ),
      };
    }

    case "read_persona_resource": {
      const { resourceId } = parsed.data as { resourceId: string };
      const resource = await sandboxRepository.getOwnedResource(
        viewerUserId,
        resourceId,
      );
      return {
        toolResultText: JSON.stringify({
          title: resource.title,
          content: resource.content,
        }),
      };
    }

    case "propose_create_section": {
      const { title, content, reason } = parsed.data as {
        title: string;
        content: string;
        reason: string;
      };
      const proposal = await sandboxRepository.createProposal({
        personaId,
        sessionId,
        operation: "create",
        targetType: "section",
        targetId: null,
        proposedTitle: title,
        proposedContent: content,
        reason,
      });
      return {
        toolResultText: `已创建待确认提案 ${proposal.id}，等待用户在对话里同意。`,
        proposal,
      };
    }

    case "propose_update_section": {
      const { sectionId, content, reason } = parsed.data as {
        sectionId: string;
        content: string;
        reason: string;
      };
      const section = await sandboxRepository.getOwnedSection(
        viewerUserId,
        sectionId,
      );
      const proposal = await sandboxRepository.createProposal({
        personaId,
        sessionId,
        operation: "update",
        targetType: "section",
        targetId: sectionId,
        proposedTitle: section.title,
        proposedContent: content,
        reason,
      });
      return {
        toolResultText: `已创建待确认提案 ${proposal.id}，等待用户在对话里同意。`,
        proposal,
      };
    }

    case "propose_delete_section": {
      const { sectionId, reason } = parsed.data as {
        sectionId: string;
        reason: string;
      };
      const section = await sandboxRepository.getOwnedSection(
        viewerUserId,
        sectionId,
      );
      const proposal = await sandboxRepository.createProposal({
        personaId,
        sessionId,
        operation: "delete",
        targetType: "section",
        targetId: sectionId,
        proposedTitle: section.title,
        proposedContent: null,
        reason,
      });
      return {
        toolResultText: `已创建待确认提案 ${proposal.id}，等待用户在对话里同意。`,
        proposal,
      };
    }

    case "propose_create_resource": {
      const { title, content, reason } = parsed.data as {
        title: string;
        content: string;
        reason: string;
      };
      const proposal = await sandboxRepository.createProposal({
        personaId,
        sessionId,
        operation: "create",
        targetType: "resource",
        targetId: null,
        proposedTitle: title,
        proposedContent: content,
        reason,
      });
      return {
        toolResultText: `已创建待确认提案 ${proposal.id}，等待用户在对话里同意。`,
        proposal,
      };
    }
  }
}
