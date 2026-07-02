import "server-only";

export type AuthenticatedUser = {
  id: string;
};

export async function getCurrentUserFromRequest(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const headerUserId = request.headers.get("x-daimon-user-id");
  const cookieUserId = getCookieValue(
    request.headers.get("cookie"),
    "daimon_user_id",
  );
  const userId =
    headerUserId ??
    cookieUserId ??
    (process.env.NODE_ENV !== "production" ? "demo-user" : null);

  if (!userId) {
    return null;
  }

  return {
    id: userId,
  };
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
