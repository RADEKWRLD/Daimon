"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  signSessionToken,
} from "@/lib/session";
import { sandboxRepository } from "@/services/storage/repositories";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export type AuthActionState = { error: string } | undefined;

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "请检查输入内容" };
  }

  const user = await sandboxRepository.findUserByEmail(parsed.data.email);

  if (!user || !user.passwordHash) {
    return { error: "邮箱或密码错误" };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValid) {
    return { error: "邮箱或密码错误" };
  }

  const token = await signSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/");
}
