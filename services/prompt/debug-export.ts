import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { SandboxViolationError } from "@/lib/errors";
import { sandboxRepository } from "@/services/storage/repositories";
import type { UserId } from "@/types/domain";

export async function exportActivePromptDebugSnapshot(viewerUserId: UserId) {
  if (process.env.NODE_ENV === "production") {
    throw new SandboxViolationError(
      "Debug prompt exports are disabled in production.",
    );
  }

  const activePrompt = await sandboxRepository.getActivePrompt(viewerUserId);
  if (!activePrompt) {
    return null;
  }

  const dir = path.join(
    process.cwd(),
    ".data",
    "sandboxes",
    viewerUserId,
    "prompt-versions",
  );
  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${activePrompt.promptVersionId}.json`);
  await writeFile(
    filePath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        note: "Development-only debug export. Production source of truth is Neon Postgres.",
        activePrompt,
      },
      null,
      2,
    ),
    "utf8",
  );

  return filePath;
}
