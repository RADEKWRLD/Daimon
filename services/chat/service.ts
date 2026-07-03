import "server-only";

import {
  streamDeepSeekReply,
  type DeepSeekMessage,
} from "@/services/ai/deepseek";
import { shouldShortCircuitForSafety } from "@/services/safety/service";
import { sandboxRepository } from "@/services/storage/repositories";
import type { SafetyResult, UserId } from "@/types/domain";

import { buildChatContext } from "./context-builder";

export type ChatStreamResult = {
  deltas: AsyncGenerator<string>;
  safety: SafetyResult;
  promptVersionId: string | null;
};

export const chatService = {
  async streamChatTurn(
    viewerUserId: UserId,
    input: { sessionId: string; content: string },
  ): Promise<ChatStreamResult> {
    const safetyCheck = shouldShortCircuitForSafety(input.content);

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
        promptVersionId: null,
      };
    }

    const { activePrompt, recentMessages } = await buildChatContext(
      viewerUserId,
      input.sessionId,
    );

    await sandboxRepository.appendMessage(
      viewerUserId,
      input.sessionId,
      "user",
      input.content,
    );

    const modelMessages: DeepSeekMessage[] = [
      {
        role: "system",
        content: activePrompt.systemPrompt,
      },
      ...recentMessages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
      {
        role: "user",
        content: input.content,
      },
    ];

    const upstream = await streamDeepSeekReply(modelMessages);

    const persistAssistantReply = async (fullText: string) => {
      await sandboxRepository.appendMessage(
        viewerUserId,
        input.sessionId,
        "assistant",
        fullText,
      );
    };

    if (!upstream) {
      const fallback = buildLocalFallbackReply(activePrompt.name);
      await persistAssistantReply(fallback);

      return {
        deltas: singleChunk(fallback),
        safety: safetyCheck.result,
        promptVersionId: activePrompt.promptVersionId,
      };
    }

    return {
      deltas: persistOnComplete(upstream, persistAssistantReply),
      safety: safetyCheck.result,
      promptVersionId: activePrompt.promptVersionId,
    };
  },
};

async function* singleChunk(text: string) {
  yield text;
}

/** Forwards deltas as they arrive, then persists the assembled full text once the source completes. */
async function* persistOnComplete(
  source: AsyncGenerator<string>,
  onComplete: (fullText: string) => Promise<void>,
) {
  let fullText = "";

  for await (const delta of source) {
    fullText += delta;
    yield delta;
  }

  await onComplete(fullText);
}

function buildLocalFallbackReply(agentName: string) {
  return [
    `我是 ${agentName}。我已经读取了你的个人 agent prompt，但当前没有配置 DEEPSEEK_API_KEY，所以先返回本地占位回复。`,
    "你可以继续描述刚才那件事里最让你难受的一点，我会先帮你把情绪和具体压力源分开。",
  ].join("\n\n");
}
