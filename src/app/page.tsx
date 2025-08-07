'use client'

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-[#15162c] text-white">
      <div className="text-center space-y-8">
        <div className="flex justify-center mb-6">
          <Image src="/pack-logo.svg" alt="Pack Music" width={150} height={150} />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold">
          Welcome to the Pack Focus Room
        </h1>
        
        <Link href="/sign-in">
          <Button variant="packPrimary" size="lg" className="text-lg px-8 py-3">
            Sign In
          </Button>
        </Link>
      </div>
    </main>
  );
}
