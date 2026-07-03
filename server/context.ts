import "server-only";

import {
  getCurrentUserFromRequest,
  type AuthenticatedUser,
} from "@/lib/auth";

export type TRPCContext = {
  request?: Request;
  user: AuthenticatedUser | null;
};

export async function createTRPCContext(options: { req: Request }) {
  return {
    request: options.req,
    user: await getCurrentUserFromRequest(options.req),
  } satisfies TRPCContext;
}
