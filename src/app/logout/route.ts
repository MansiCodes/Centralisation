import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { clearAuthCookies } from "@/lib/central/clear-auth-cookies";

/** Full Centralisation sign-out — used by /apps menu and Workspace logout redirect. */
export async function GET(request: Request) {
  const jar = await cookies();
  clearAuthCookies(jar);
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login", request.url));
}
