import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Pack Music - Focus Room",
  description: "A cooperative music platform owned by musicians, business partners, and listeners—united by a shared dream to reclaim value for creators.",
  keywords: ["music", "cooperative", "independent artists", "streaming", "community"],
  authors: [{ name: "Pack Music Cooperative" }],
  icons: [{ rel: "icon", url: "/pack-logo.svg", type: "image/svg+xml" }],
  openGraph: {
    title: "Pack Music - Focus Room",
    description: "A cooperative music platform owned by musicians, business partners, and listeners.",
    type: "website",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <ClerkProvider>
            {children}
            <Toaster />
          </ClerkProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
