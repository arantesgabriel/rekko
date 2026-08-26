import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
export const metadata = { title: "Redefinir senha" };
export default function ResetPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="reset" />
      </Suspense>
    </AuthLayout>
  );
}
