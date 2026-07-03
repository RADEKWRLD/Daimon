"use server";

import { createServerCaller } from "@/server/caller";

export async function resolveProposalAction(
  proposalId: string,
  decision: "approved" | "rejected",
) {
  const caller = await createServerCaller();
  await caller.persona.resolveProposal({ proposalId, decision });
}
