import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { sandboxRepository } from "@/services/storage/repositories";

import { logoutAction } from "./logout-action";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userRow = await sandboxRepository.getUserById(user.id);
  const userLabel = userRow?.email ?? userRow?.name ?? "演示账号";

  return (
    <AppShell userLabel={userLabel} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
