"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/motion/reveal";

import { createSectionAction, deleteSectionAction, updateSectionAction } from "./actions";

type Section = {
  id: string;
  title: string;
  content: string;
  createdBy: "ai" | "user";
};

export function SectionsManager({
  personaId,
  sections,
}: {
  personaId: string;
  sections: Section[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createSectionAction(formData);
      setAddOpen(false);
    });
  }

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      await updateSectionAction(formData);
      setEditingId(null);
    });
  }

  function handleDelete(sectionId: string) {
    const formData = new FormData();
    formData.set("sectionId", sectionId);
    startTransition(() => deleteSectionAction(formData));
  }

  const editingSection = sections.find((s) => s.id === editingId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">章节内容</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <Button pill size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            新增章节
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增章节</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <input type="hidden" name="personaId" value={personaId} />
              <div className="space-y-1.5">
                <Label htmlFor="new-title">标题</Label>
                <Input id="new-title" name="title" required maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-content">内容</Label>
                <Textarea id="new-content" name="content" rows={6} required />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button">取消</Button>} />
                <Button type="submit" disabled={isPending}>
                  {isPending ? "创建中…" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sections.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            还没有章节，点击&quot;新增章节&quot;手动添加，或者在对话里让 Daimon 自己提议。
          </CardContent>
        </Card>
      ) : (
        <Reveal className="space-y-3">
          {sections.map((section) => (
            <Card key={section.id} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {section.title}
                  {section.createdBy === "ai" ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-primary">
                      Daimon 创建
                    </span>
                  ) : null}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingId(section.id)}
                    aria-label="编辑"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(section.id)}
                    aria-label="删除"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </Reveal>
      )}

      <Dialog open={editingId !== null} onOpenChange={(next) => !next && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑章节</DialogTitle>
          </DialogHeader>
          {editingSection ? (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="sectionId" value={editingSection.id} />
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">标题</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingSection.title}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-content">内容</Label>
                <Textarea
                  id="edit-content"
                  name="content"
                  defaultValue={editingSection.content}
                  rows={6}
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button">取消</Button>} />
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中…" : "保存"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
