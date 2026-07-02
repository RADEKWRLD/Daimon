import "server-only";

import { NotFoundError } from "@/lib/errors";
import { sandboxRepository } from "@/services/storage/repositories";
import type { UserId } from "@/types/domain";

export async function buildChatContext(viewerUserId: UserId, sessionId: string) {
  const activePrompt = await sandboxRepository.getActivePrompt(viewerUserId);

  if (!activePrompt) {
    throw new NotFoundError("Generate and activate a personal agent prompt first.");
  }

  const recentMessages = await sandboxRepository.getRecentMessages(
    viewerUserId,
    sessionId,
    12,
  );

  return {
    activePrompt,
    recentMessages,
  };
}
