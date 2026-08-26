import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
export const metadata = { title: "Confirmar email" };
export default function VerifyPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="verify" />
      </Suspense>
    </AuthLayout>
  );
}
