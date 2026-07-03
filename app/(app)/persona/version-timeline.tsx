import { cn } from "@/lib/utils";

import { activateVersionAction } from "./actions";

type VersionRow = {
  id: string;
  version: number;
  createdBy: "ai" | "user";
  createdAt: Date;
};

export function VersionTimeline({
  versions,
  activeVersionId,
}: {
  versions: VersionRow[];
  activeVersionId: string;
}) {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-border p-6 lg:block">
      <h2 className="text-lg font-medium">版本时间线</h2>
      <p className="mb-6 text-xs text-muted-foreground">人格演变记录</p>

      <ol className="relative space-y-6 border-l-2 border-border pl-4">
        {versions.map((version) => {
          const isActive = version.id === activeVersionId;

          return (
            <li key={version.id} className="relative">
              <span
                className={cn(
                  "absolute top-1 -left-[21px] size-3 rounded-full",
                  isActive ? "bg-primary ring-4 ring-secondary" : "bg-muted-foreground/40",
                )}
              />
              {isActive ? (
                <div>
                  <p className="text-sm font-bold text-primary">第 {version.version} 版（当前）</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(version.createdAt)} · {version.createdBy === "ai" ? "AI 生成" : "手动编辑"}
                  </p>
                </div>
              ) : (
                <form action={activateVersionAction}>
                  <input type="hidden" name="promptVersionId" value={version.id} />
                  <button
                    type="submit"
                    className="text-left opacity-60 transition-opacity hover:opacity-100"
                  >
                    <p className="text-sm font-medium">第 {version.version} 版</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(version.createdAt)} · {version.createdBy === "ai" ? "AI 生成" : "手动编辑"}
                    </p>
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
