import { type NextRequest, NextResponse } from "next/server";
import { createCaller } from "~/server/api/root";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/calendar?google_auth_failed=true", req.url),
    );
  }

  try {
    const caller = createCaller({
      headers: req.headers,
    });
    
    const result = await caller.googleCalendar.oauthCallback({ code });

    // Create redirect URL with tokens
    const redirectUrl = new URL("/dashboard/calendar", req.url);
    redirectUrl.searchParams.set("google_auth_success", "true");
    
    // Pass tokens via URL parameters (they'll be immediately stored in localStorage and removed from URL)
    if (result.tokens.access_token) {
      redirectUrl.searchParams.set("access_token", result.tokens.access_token);
    }
    if (result.tokens.refresh_token) {
      redirectUrl.searchParams.set("refresh_token", result.tokens.refresh_token);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error during OAuth callback:", error);
    const redirectUrl = new URL("/dashboard/calendar?google_auth_failed=true", req.url);
    return NextResponse.redirect(redirectUrl);
  }
}
