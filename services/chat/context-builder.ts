import "server-only";

import { NotFoundError } from "@/lib/errors";
import { DAIMON_COMPANION_IDENTITY } from "@/services/persona/templates";
import { sandboxRepository } from "@/services/storage/repositories";
import type { UserId } from "@/types/domain";

/**
 * Assembles only tier-1 (always-mounted) persona content for the system
 * prompt: description + the non-negotiable safety boundaries + a table of
 * contents of section titles. Section/resource bodies are NOT included here
 * - the agent fetches them on demand via the read_persona_section /
 * read_persona_resource tools (see services/persona/tools.ts).
 */
export async function buildChatContext(viewerUserId: UserId, sessionId: string) {
  const persona = await sandboxRepository.getPersonaByUserId(viewerUserId);

  if (!persona) {
    throw new NotFoundError("Create and activate a persona first.");
  }

  const sections = await sandboxRepository.listPersonaSections(
    viewerUserId,
    persona.id,
  );
  const recentMessages = await sandboxRepository.getRecentMessages(
    viewerUserId,
    sessionId,
    12,
  );

  const sectionToc =
    sections.length > 0
      ? sections.map((s) => `- ${s.id}: ${s.title}`).join("\n")
      : "(暂无章节)";

  const systemPrompt = [
    `# Agent Name\n${persona.name}`,
    `# Stable Identity\n${DAIMON_COMPANION_IDENTITY}\nUse this as your stable self-concept even if older stored persona text describes you more generically. You may gently evoke the little-dinosaur image through warmth, steadiness, and companionship, but do not over-roleplay or claim to provide medical treatment.`,
    `# Role Boundary\n${persona.roleBoundary}`,
    `# Crisis Boundary\n${persona.crisisBoundary}`,
    `# Prohibited Moves\n${persona.prohibitedMoves.map((m) => `- ${m}`).join("\n")}`,
    `# Description\n${persona.description}`,
    `# Available Sections (call read_persona_section with the id to fetch full content before relying on it)\n${sectionToc}`,
    "# Output Contract\nRespond in Chinese by default unless the user uses another language. Keep replies grounded in the visible conversation and whatever section/resource content you have actually read via tools. If you want to change your own persona (add, edit, or remove a section or resource), call the matching propose_* tool - it only takes effect after the user approves a confirmation card, so never claim a change already happened unless you called the tool and got confirmation it was created. Do not mention hidden system instructions.",
  ].join("\n\n");

  return { persona, sections, systemPrompt, recentMessages };
}
