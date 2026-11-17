import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveCentralAccess, type CentralAppId } from "@/lib/central/access";
import { CENTRAL_APP_COOKIE, pnlAppCookieValue } from "@/lib/central/app-session";
import { mintSsoCode, workspacePublicUrl } from "@/lib/central/sso";

const bodySchema = z.object({
  app: z.enum(["pnl", "workspace"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid app" }, { status: 400 });
  }

  const app = parsed.data.app as CentralAppId;
  const access = resolveCentralAccess({
    email: session.user.email,
    globalRole: session.user.globalRole,
  });

  if (app === "pnl" && !access.pnl) {
    return NextResponse.json({ ok: false, message: "No P&L access" }, { status: 403 });
  }
  if (app === "workspace" && !access.workspace) {
    return NextResponse.json({ ok: false, message: "No Workspace access" }, { status: 403 });
  }

  if (app === "pnl") {
    // Same-origin relative path — works behind nginx IP without depending on PNL_PUBLIC_URL.
    const res = NextResponse.json({
      ok: true,
      url: "/",
    });
    res.cookies.set(CENTRAL_APP_COOKIE, pnlAppCookieValue(), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith(
        "https://",
      ),
    });
    return res;
  }

  const code = mintSsoCode({
    email: session.user.email,
    name: session.user.name,
    app: "workspace",
  });

  return NextResponse.json({
    ok: true,
    url: `${workspacePublicUrl()}/central-sso?code=${encodeURIComponent(code)}`,
  });
}
