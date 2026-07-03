import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

import { OverviewCard } from "./overview-card";
import { RecentChanges } from "./recent-changes";
import { SectionsManager } from "./sections-manager";

export default async function PersonaPage() {
  const caller = await createServerCaller();
  const overview = await caller.persona.getOverview();

  if (!overview) {
    redirect("/profile");
  }

  const [sections, recentProposals] = await Promise.all([
    caller.persona.listSections({ personaId: overview.personaId }),
    caller.persona.listRecentProposals({ personaId: overview.personaId }),
  ]);

  return (
    <div className="mx-auto max-w-[720px] space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">人格管理</h1>
        <p className="text-muted-foreground">
          查看和编辑 Daimon 的人格。Daimon 也可以在对话里自己提议修改，但都需要你确认后才生效。
        </p>
      </div>

      <OverviewCard
        personaId={overview.personaId}
        name={overview.name}
        description={overview.description}
        roleBoundary={overview.roleBoundary}
        crisisBoundary={overview.crisisBoundary}
      />

      <SectionsManager
        personaId={overview.personaId}
        sections={sections.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          createdBy: s.createdBy,
        }))}
      />

      <RecentChanges
        proposals={recentProposals.map((p) => ({
          id: p.id,
          operation: p.operation,
          targetType: p.targetType,
          proposedTitle: p.proposedTitle,
          reason: p.reason,
          status: p.status as "approved" | "rejected",
          resolvedAt: p.resolvedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
