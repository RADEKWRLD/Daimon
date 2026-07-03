"use client";

import { useState, useTransition } from "react";
import { Lock, Save, ShieldAlert, SlidersHorizontal, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import { deleteMyDataAction, updateSettingsAction } from "./actions";
import type { CommunicationPreferences } from "@/types/domain";

export function SettingsForm({
  preferences,
}: {
  preferences: CommunicationPreferences;
}) {
  const [nickname, setNickname] = useState(preferences.nickname ?? "");
  const [tone, setTone] = useState(preferences.tone);
  const [responseLength, setResponseLength] = useState(preferences.responseLength);
  const [askBeforeAdvice, setAskBeforeAdvice] = useState(preferences.askBeforeAdvice);
  const [storeSessionHistory, setStoreSessionHistory] = useState(
    preferences.storeSessionHistory,
  );
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("nickname", nickname);
    formData.set("tone", tone);
    formData.set("responseLength", responseLength);
    formData.set("askBeforeAdvice", String(askBeforeAdvice));
    formData.set("storeSessionHistory", String(storeSessionHistory));

    startSaving(async () => {
      await updateSettingsAction(formData);
      toast.success("设置已保存");
    });
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-muted-foreground">管理你的偏好，以及 Daimon 与你互动的方式。</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            个性化
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="nickname">昵称</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Daimon 应该怎么称呼你"
          />
          <p className="text-xs text-muted-foreground">这个名字会用于日常对话中。</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            互动风格
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Daimon 的语气</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as typeof tone)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">温和 · 默认</SelectItem>
                <SelectItem value="warm">温暖</SelectItem>
                <SelectItem value="direct">直接、行动导向</SelectItem>
                <SelectItem value="structured">条理清晰、深入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>回复长度</Label>
            <Select
              value={responseLength}
              onValueChange={(value) => setResponseLength(value as typeof responseLength)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">简短 · 直击重点</SelectItem>
                <SelectItem value="medium">适中 · 详细但易读</SelectItem>
                <SelectItem value="long">详细 · 深入展开</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">给建议前先询问我</p>
              <p className="text-xs text-muted-foreground">关闭后可在共情之后直接给出建议</p>
            </div>
            <Switch checked={askBeforeAdvice} onCheckedChange={setAskBeforeAdvice} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            隐私与数据
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">保存会话历史</p>
              <p className="text-xs text-muted-foreground">
                允许 Daimon 记住过去的对话，以提供更有上下文的回应。
              </p>
            </div>
            <Switch checked={storeSessionHistory} onCheckedChange={setStoreSessionHistory} />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <ShieldAlert className="size-4" />
              危险区域
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              永久删除你在本沙盒中的全部对话历史与个性化数据，此操作不可撤销。
            </p>
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="outline" pill className="border-destructive/40 text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-4" />
                    删除我的数据
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认删除全部数据？</DialogTitle>
                  <DialogDescription>
                    这会永久删除你的情绪画像、人格版本、会话与消息记录，且无法恢复。你的账号本身不会被删除。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="ghost">取消</Button>} />
                  <Button
                    variant="safety"
                    disabled={isDeleting}
                    onClick={() => startDeleting(() => deleteMyDataAction())}
                  >
                    {isDeleting ? "删除中…" : "确认永久删除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button pill disabled={isSaving} onClick={handleSave}>
          {isSaving ? "保存中…" : "保存更改"}
          <Save className="size-4" />
        </Button>
      </div>
    </div>
  );
}
