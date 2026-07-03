"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Redo2, ShieldAlert, Undo2, Save, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveDraftAction } from "./actions";

export function PersonaEditor({
  agentPromptId,
  initialName,
  initialSystemPrompt,
}: {
  agentPromptId: string;
  initialName: string;
  initialSystemPrompt: string;
}) {
  const [name, setName] = useState(initialName);
  const [history, setHistory] = useState([initialSystemPrompt]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const systemPrompt = history[historyIndex];
  const isDirty = systemPrompt !== initialSystemPrompt || name !== initialName;
  const wordCount = useMemo(() => systemPrompt.trim().length, [systemPrompt]);

  function updatePrompt(value: string) {
    const nextHistory = [...history.slice(0, historyIndex + 1), value];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("agentPromptId", agentPromptId);
    formData.set("name", name);
    formData.set("systemPrompt", systemPrompt);

    startTransition(async () => {
      await saveDraftAction(formData);
      setSavedAt(new Date());
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">人格编辑器</h1>
          <p className="text-sm text-muted-foreground">塑造你的陪伴者的核心身份</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="persona-name">人格名称</Label>
        <Input
          id="persona-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">陪伴者边界</p>
          <p>
            Daimon 是一个支持性对话陪伴者，不是持证治疗师或医疗专业人员。以下的提示词内容必须遵守我们的安全准则。
          </p>
        </div>
      </div>

      <div className="glass-panel safety-gate flex flex-col rounded-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="text-sm font-semibold">核心提示词草稿</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              disabled={historyIndex === 0}
              onClick={() => setHistoryIndex((i) => Math.max(0, i - 1))}
              aria-label="撤销"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              disabled={historyIndex === history.length - 1}
              onClick={() => setHistoryIndex((i) => Math.min(history.length - 1, i + 1))}
              aria-label="重做"
            >
              <Redo2 className="size-4" />
            </Button>
          </div>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(event) => updatePrompt(event.target.value)}
          rows={14}
          className="w-full resize-none bg-transparent p-4 text-sm outline-none"
        />
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span>{wordCount} 字</span>
          {savedAt && !isDirty ? (
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="size-3.5" />
              已自动保存
            </span>
          ) : (
            <span>{isDirty ? "有未保存的更改" : ""}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          pill
          type="button"
          onClick={() => {
            setHistory([initialSystemPrompt]);
            setHistoryIndex(0);
            setName(initialName);
          }}
        >
          放弃更改
        </Button>
        <Button pill type="button" disabled={isPending || !isDirty} onClick={handleSave}>
          {isPending ? "保存中…" : "保存并更新版本"}
          <Save className="size-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
        <Sparkles className="mb-1 inline size-3.5 text-primary" /> 想要更彻底地重新生成人格？回到「情绪画像」页重新生成即可。
      </div>
    </div>
  );
}
