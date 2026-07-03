import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "注册 · Daimon",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
