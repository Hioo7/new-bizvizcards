import AuthLayout from "@layouts/AuthLayout";
import { SignupForm } from "@features/auth";

export default function SignupPage() {
  return (
    <AuthLayout
      promoHeading={
        <>
          Professional Networking
          <br />
          Starts Here
        </>
      }
      promoSubtext="Create your account to securely manage your digital identity and business connections."
    >
      <SignupForm />
    </AuthLayout>
  );
}
