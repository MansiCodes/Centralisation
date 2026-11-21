import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

const CALLBACK_COOKIE_NAMES = [
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function ssoFailRedirect() {
  return NextResponse.redirect(`${portalPublicUrl()}/login?error=sso`);
}

function clearCallbackCookies(res: NextResponse) {
  // Stale Auth.js callback-url (e.g. /apps) sends SSO back to the Workspace chooser.
  for (const name of CALLBACK_COOKIE_NAMES) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

function resolveRedirectUrl(request: Request, path: string): URL {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) {
    return new URL(path, `${proto}://${host}`);
  }
  return new URL(path, request.url);
}

/** Redeem Installation-minted SSO code into a P&L NextAuth session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  if (!code) return ssoFailRedirect();

  try {
    const jar = await cookies();
    for (const name of CALLBACK_COOKIE_NAMES) {
      jar.delete(name);
    }

    const result = await signIn("credentials", {
      ssoCode: code,
      rememberMe: "1",
      redirect: false,
    });
    if (result?.error) {
      console.error("[sso/consume]", result.error);
      return ssoFailRedirect();
    }
  } catch (err) {
    console.error("[sso/consume]", err);
    return ssoFailRedirect();
  }

  const res = NextResponse.redirect(resolveRedirectUrl(request, "/"));
  clearCallbackCookies(res);
  return res;
}
