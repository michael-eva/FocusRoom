import { SignUp } from "@clerk/nextjs";

export default function page() {
  return (
    <div>
      <h1>Complete Your Registration</h1>
      <SignUp forceRedirectUrl={"/dashboard"} />
    </div>
  );
}
