import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export type AuthenticatedUser = {
  id: string;
};

/**
 * Only used by the raw /api/chat route, which receives a plain Request
 * instead of running inside Next's async cookies()/headers() context.
 */
export async function getCurrentUserFromRequest(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const cookieToken = getCookieValue(
    request.headers.get("cookie"),
    SESSION_COOKIE,
  );

  if (cookieToken) {
    const userId = await verifySessionToken(cookieToken);
    if (userId) {
      return { id: userId };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return { id: "demo-user" };
  }

  return null;
}

/**
 * Used by Server Components and Server Actions, which can read cookies via
 * next/headers instead of a raw Request object.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const userId = await verifySessionToken(token);
    if (userId) {
      return { id: userId };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return { id: "demo-user" };
  }

  return null;
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
