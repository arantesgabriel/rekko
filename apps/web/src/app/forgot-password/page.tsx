import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
export const metadata = { title: "Recuperar senha" };
export default function ForgotPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="forgot" />
      </Suspense>
    </AuthLayout>
  );
}
