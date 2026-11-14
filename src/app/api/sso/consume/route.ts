import { NextResponse } from "next/server";
import { signIn } from "@/auth";

/** Redeem a one-time Centralisation SSO code into a normal P&L NextAuth session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=sso", request.url));
  }

  try {
    await signIn("credentials", {
      ssoCode: code,
      rememberMe: "1",
      redirectTo: "/",
    });
  } catch (err) {
    // Auth.js throws NEXT_REDIRECT on success — rethrow those.
    const digest = err && typeof err === "object" && "digest" in err ? String((err as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[sso/consume]", err);
    return NextResponse.redirect(new URL("/login?error=sso", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
