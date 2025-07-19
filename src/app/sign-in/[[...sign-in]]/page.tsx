import { SignIn } from "@clerk/nextjs";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center md:justify-start md:mt-24 h-screen">
      <SignIn
        forceRedirectUrl="/dashboard"
      />
    </div>
  )
}
