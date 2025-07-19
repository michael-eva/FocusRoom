'use client'

import Link from "next/link";
import { useUserRole } from "~/hooks/useUserRole";

export default function Home() {
  const role = useUserRole();
  console.log(role);
  return (
    <main className="flex min-h-screen flex-col items-center text-2xl justify-center bg-gradient-to-b from-white to-[#15162c] text-white">
      <p>You are here for a reason</p>
      <p>I&apos;m not sure what that reason is</p>
      <p>but if you were invited <Link href="/sign-in" className="text-orange-500 font-bold cursor-pointer">click here</Link></p>
    </main>
  );
}
