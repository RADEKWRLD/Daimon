"use client";

import { useState, useTransition } from "react";
import { Pencil, ShieldAlert, ShieldCheck } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateOverviewAction } from "./actions";

export function OverviewCard({
  personaId,
  name,
  description,
  roleBoundary,
  crisisBoundary,
}: {
  personaId: string;
  name: string;
  description: string;
  roleBoundary: string;
  crisisBoundary: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateOverviewAction(formData);
      setOpen(false);
    });
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">{name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
            <Pencil className="size-4" />
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑人格概述</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="personaId" value={personaId} />
              <div className="space-y-1.5">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={description}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roleBoundary">角色边界</Label>
                <Textarea
                  id="roleBoundary"
                  name="roleBoundary"
                  defaultValue={roleBoundary}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crisisBoundary">危机边界</Label>
                <Textarea
                  id="crisisBoundary"
                  name="crisisBoundary"
                  defaultValue={crisisBoundary}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button">取消</Button>} />
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中…" : "保存"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">{roleBoundary}</p>
        </div>
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="text-muted-foreground">{crisisBoundary}</p>
        </div>
        <p className="text-xs text-muted-foreground/70">
          角色边界与危机边界只能由你手动编辑，Daimon 自己没有修改这两项的权限。
        </p>
      </CardContent>
    </Card>
  );
}
