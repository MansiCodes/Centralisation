import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { clearAuthCookies } from "@/lib/central/clear-auth-cookies";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

/** Clear P&L session and return to Installation portal login. */
export async function GET() {
  const jar = await cookies();
  clearAuthCookies(jar);
  await signOut({ redirect: false });
  return NextResponse.redirect(`${portalPublicUrl()}/login`);
}
