import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

function ssoFailRedirect() {
  return NextResponse.redirect(`${portalPublicUrl()}/login?error=sso`);
}

/** Redeem Installation-minted SSO code into a P&L NextAuth session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  if (!code) return ssoFailRedirect();

  try {
    await signIn("credentials", {
      ssoCode: code,
      rememberMe: "1",
      redirectTo: "/",
    });
  } catch (err) {
    const digest =
      err && typeof err === "object" && "digest" in err
        ? String((err as { digest?: string }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[sso/consume]", err);
    return ssoFailRedirect();
  }

  return NextResponse.redirect(new URL("/", request.url));
}
