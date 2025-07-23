import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                <span className="text-background font-bold text-xs">P</span>
              </div>
              <span className="text-foreground font-bold">pack music/</span>
            </div>
            <p className="text-pack-body text-sm">
              A cooperative music platform owned by musicians, business partners, and listeners.
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-pack-subheading mb-4">Follow Us</h4>
            <div className="flex flex-wrap gap-4">
              <Link href="#" className="text-accent hover:underline text-sm">Mastodon</Link>
              <Link href="#" className="text-accent hover:underline text-sm">Bluesky</Link>
              <Link href="#" className="text-accent hover:underline text-sm">Facebook</Link>
              <Link href="#" className="text-accent hover:underline text-sm">Instagram</Link>
              <Link href="#" className="text-accent hover:underline text-sm">LinkedIn</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-pack-subheading mb-4">Contact</h4>
            <p className="text-pack-body text-sm mb-2">Angove Street, North Perth</p>
            <Link
              href="mailto:hello@thepackmusiccooperative.com.au"
              className="text-accent hover:underline text-sm"
            >
              hello@thepackmusiccooperative.com.au
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-pack-body text-sm text-muted-foreground">
            © 2024 Pack Music Cooperative. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 