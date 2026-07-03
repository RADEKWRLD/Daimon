import "server-only";

import { getCurrentUser } from "@/lib/auth";

import { appRouter } from "./routers";
import type { TRPCContext } from "./context";

/**
 * Server-side tRPC caller for use from Server Components and Server
 * Actions, which authenticate via next/headers cookies() rather than a raw
 * Request object. Reuses the same routers/services/validation as the HTTP
 * tRPC adapter instead of duplicating that logic behind a form action.
 */
export async function createServerCaller() {
  const user = await getCurrentUser();
  const ctx: TRPCContext = { user };

  return appRouter.createCaller(ctx);
}
