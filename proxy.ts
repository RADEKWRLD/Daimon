import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Optimistic auth gate for the app shell routes. This is a fast redirect
// check only — every Server Action/Component still re-verifies the session
// via lib/auth.ts, since Proxy is not a substitute for real authorization.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  if (!userId && process.env.NODE_ENV === "production") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/persona/:path*",
    "/sessions/:path*",
    "/settings/:path*",
    "/chat/:path*",
  ],
};
