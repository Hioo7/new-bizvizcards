import AuthLayout from "@layouts/AuthLayout";
import { LoginForm } from "@features/auth";

export default function LoginPage() {
  return (
    <AuthLayout
      promoHeading={
        <>
          Smart Digital
          <br />
          Business Cards
        </>
      }
      promoSubtext="A modern platform for managing professional profiles, contact sharing, and business networking."
    >
      <LoginForm />
    </AuthLayout>
  );
}
