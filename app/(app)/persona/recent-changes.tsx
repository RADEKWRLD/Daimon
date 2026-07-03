import { CheckCircle2, XCircle } from "lucide-react";

type Proposal = {
  id: string;
  operation: "create" | "update" | "delete";
  targetType: "section" | "resource";
  proposedTitle: string | null;
  reason: string;
  status: "approved" | "rejected" | "pending";
  resolvedAt: string | null;
};

const OPERATION_LABEL: Record<Proposal["operation"], string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

export function RecentChanges({ proposals }: { proposals: Proposal[] }) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">最近变更</h2>
      <div className="space-y-2">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
          >
            {proposal.status === "approved" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p>
                Daimon {OPERATION_LABEL[proposal.operation]}了章节「{proposal.proposedTitle ?? "未命名"}」
                <span className="text-muted-foreground">
                  {proposal.status === "approved" ? "（已同意）" : "（已拒绝）"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{proposal.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
