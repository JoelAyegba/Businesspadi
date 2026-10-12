import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp fallbackRedirectUrl="/app/dashboard" signInUrl="/sign-in" />;
}
