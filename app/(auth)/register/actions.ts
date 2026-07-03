"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  signSessionToken,
} from "@/lib/session";
import { sandboxRepository } from "@/services/storage/repositories";

import type { AuthActionState } from "../login/actions";

const registerSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(8, "密码至少需要 8 位"),
    confirmPassword: z.string(),
    nickname: z.string().max(40).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    nickname: formData.get("nickname") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "请检查输入内容" };
  }

  const existing = await sandboxRepository.findUserByEmail(parsed.data.email);

  if (existing) {
    return { error: "该邮箱已被注册" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await sandboxRepository.createUserWithPassword({
    id: crypto.randomUUID(),
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.nickname ?? null,
  });

  const token = await signSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  redirect("/questionnaire");
}
