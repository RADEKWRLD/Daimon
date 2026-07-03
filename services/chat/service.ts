import "server-only";

import type {
  DeepSeekMessage,
  DeepSeekToolCall,
} from "@/services/ai/deepseek";
import { streamDeepSeekTurn } from "@/services/ai/deepseek";
import { dispatchPersonaTool, PERSONA_TOOL_DEFINITIONS } from "@/services/persona/tools";
import { shouldShortCircuitForSafety } from "@/services/safety/service";
import { sandboxRepository } from "@/services/storage/repositories";
import type { PersonaChangeProposal, SafetyResult, UserId } from "@/types/domain";

import { buildChatContext } from "./context-builder";

const MAX_TOOL_ROUNDS = 4;

export type ChatStreamResult = {
  deltas: AsyncGenerator<string>;
  safety: SafetyResult;
  personaId: string | null;
  /** Populated as `deltas` is drained; read only after the generator completes. */
  proposals: PersonaChangeProposal[];
};

export const chatService = {
  async streamChatTurn(
    viewerUserId: UserId,
    input: { sessionId: string; content: string },
  ): Promise<ChatStreamResult> {
    const safetyCheck = shouldShortCircuitForSafety(input.content);
    const proposals: PersonaChangeProposal[] = [];

    if (safetyCheck.response) {
      await sandboxRepository.appendMessage(
        viewerUserId,
        input.sessionId,
        "user",
        input.content,
      );
      await sandboxRepository.appendMessage(
        viewerUserId,
        input.sessionId,
        "assistant",
        safetyCheck.response,
      );

      return {
        deltas: singleChunk(safetyCheck.response),
        safety: safetyCheck.result,
        personaId: null,
        proposals,
      };
    }

    const { persona, systemPrompt, recentMessages } = await buildChatContext(
      viewerUserId,
      input.sessionId,
    );

    await sandboxRepository.appendMessage(
      viewerUserId,
      input.sessionId,
      "user",
      input.content,
    );

    const conversation: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
      { role: "user", content: input.content },
    ];

    return {
      deltas: runAgentLoop(
        viewerUserId,
        persona.id,
        input.sessionId,
        conversation,
        proposals,
      ),
      safety: safetyCheck.result,
      personaId: persona.id,
      proposals,
    };
  },
};

async function* singleChunk(text: string) {
  yield text;
}

async function* runAgentLoop(
  viewerUserId: UserId,
  personaId: string,
  sessionId: string,
  conversation: DeepSeekMessage[],
  proposals: PersonaChangeProposal[],
): AsyncGenerator<string> {
  let fullText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await streamDeepSeekTurn(conversation, PERSONA_TOOL_DEFINITIONS);

    if (!stream) {
      fullText = buildLocalFallbackReply();
      yield fullText;
      break;
    }

    let roundText = "";
    let finishReason = "stop";
    let toolCalls: DeepSeekToolCall[] = [];

    for await (const event of stream) {
      if (event.type === "content") {
        roundText += event.delta;
        yield event.delta;
      } else {
        finishReason = event.finishReason;
        toolCalls = event.toolCalls;
      }
    }

    fullText += roundText;

    if (finishReason !== "tool_calls" || toolCalls.length === 0) {
      break;
    }

    conversation.push({
      role: "assistant",
      content: roundText || null,
      tool_calls: toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments },
      })),
    });

    for (const call of toolCalls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.arguments || "{}");
      } catch {
        // Malformed tool arguments - dispatchPersonaTool will reject via zod.
      }

      const { toolResultText, proposal } = await dispatchPersonaTool(
        viewerUserId,
        personaId,
        sessionId,
        call.name,
        args,
      );

      if (proposal) {
        proposals.push({
          id: proposal.id,
          personaId: proposal.personaId,
          sessionId: proposal.sessionId,
          operation: proposal.operation,
          targetType: proposal.targetType,
          targetId: proposal.targetId,
          proposedTitle: proposal.proposedTitle,
          proposedContent: proposal.proposedContent,
          reason: proposal.reason,
          status: proposal.status,
          createdAt: proposal.createdAt.toISOString(),
          resolvedAt: proposal.resolvedAt?.toISOString() ?? null,
        });
      }

      conversation.push({
        role: "tool",
        content: toolResultText,
        tool_call_id: call.id,
      });
    }
  }

  if (!fullText.trim()) {
    fullText = "抱歉，我这次没能生成回复，可以再说一次吗？";
    yield fullText;
  }

  await sandboxRepository.appendMessage(viewerUserId, sessionId, "assistant", fullText);
}

function buildLocalFallbackReply() {
  return [
    "我已经读取了你的个人人格设定，但当前没有配置 DEEPSEEK_API_KEY，所以先返回本地占位回复。",
    "你可以继续描述刚才那件事里最让你难受的一点，我会先帮你把情绪和具体压力源分开。",
  ].join("\n\n");
}
