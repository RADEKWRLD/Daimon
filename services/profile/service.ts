import "server-only";

import { sandboxRepository } from "@/services/storage/repositories";
import type { UserId } from "@/types/domain";

import type { upsertProfileInputSchema } from "./schema";
import type { z } from "zod";

export const profileService = {
  async getCurrentProfile(viewerUserId: UserId) {
    return sandboxRepository.getProfileSnapshot(viewerUserId);
  },

  async upsertCurrentProfile(
    viewerUserId: UserId,
    input: z.infer<typeof upsertProfileInputSchema>,
  ) {
    return sandboxRepository.upsertProfile(viewerUserId, input);
  },
};
