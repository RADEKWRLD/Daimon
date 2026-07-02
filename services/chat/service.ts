import "server-only";

import {
  generateDeepSeekReply,
  type DeepSeekMessage,
} from "@/services/ai/deepseek";
import { shouldShortCircuitForSafety } from "@/services/safety/service";
import { sandboxRepository } from "@/services/storage/repositories";
import type { SafetyResult, UserId } from "@/types/domain";

import { buildChatContext } from "./context-builder";

export type ChatTurnResult = {
  reply: string;
  safety: SafetyResult;
  promptVersionId: string | null;
};

export const chatService = {
  async handleChatTurn(
    viewerUserId: UserId,
    input: { sessionId: string; content: string },
  ): Promise<ChatTurnResult> {
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
        reply: safetyCheck.response,
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

    const generatedReply =
      (await generateDeepSeekReply(modelMessages)) ??
      buildLocalFallbackReply(activePrompt.name);

    await sandboxRepository.appendMessage(
      viewerUserId,
      input.sessionId,
      "assistant",
      generatedReply,
    );

    return {
      reply: generatedReply,
      safety: safetyCheck.result,
      promptVersionId: activePrompt.promptVersionId,
    };
  },
};

function buildLocalFallbackReply(agentName: string) {
  return [
    `我是 ${agentName}。我已经读取了你的个人 agent prompt，但当前没有配置 DEEPSEEK_API_KEY，所以先返回本地占位回复。`,
    "你可以继续描述刚才那件事里最让你难受的一点，我会先帮你把情绪和具体压力源分开。",
  ].join("\n\n");
}
