import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
            <span className="text-background font-bold text-sm">P</span>
          </div>
          <span className="text-foreground font-bold text-xl">pack music/</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link
            href="/about"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            About
          </Link>
          <Link
            href="/how-it-works"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            How It Works
          </Link>
          <Link
            href="/join"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            Join the Pack
          </Link>
          <Link
            href="/crew"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            Meet The Crew
          </Link>
          <Link
            href="/blog"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            Blog
          </Link>
          <Link
            href="/contact"
            className="text-foreground hover:text-accent transition-colors font-medium"
          >
            Contact
          </Link>
        </nav>

        {/* Auth & Actions */}
        <div className="flex items-center space-x-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="btn-pack-primary text-sm"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
} 