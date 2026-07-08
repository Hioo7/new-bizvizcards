import AuthLayout from "@layouts/AuthLayout";
import { AdminLoginForm } from "@features/admin";

export default function AdminLoginPage() {
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
      <AdminLoginForm />
    </AuthLayout>
  );
}
