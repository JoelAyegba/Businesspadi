import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn fallbackRedirectUrl="/app/dashboard" signUpUrl="/sign-up" />;
}
