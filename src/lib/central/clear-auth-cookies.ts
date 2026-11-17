import type { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/auth.config";
import { CENTRAL_APP_COOKIE } from "@/lib/central/app-session";

/** Keep in sync with REMEMBER_COOKIE in src/auth.ts (avoid importing auth here). */
const REMEMBER_COOKIE = "cj.remember-me";

type CookieJar = Awaited<ReturnType<typeof cookies>>;

export function authCookieSecure(): boolean {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith(
    "https://",
  );
}

/** Expire Auth.js + portal cookies (including chunked session tokens). */
export function clearAuthCookies(jar: CookieJar, secure = authCookieSecure()) {
  const opts = {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
  };
  for (const name of [SESSION_COOKIE, REMEMBER_COOKIE, CENTRAL_APP_COOKIE]) {
    jar.set(name, "", opts);
  }
  for (let i = 0; i < 6; i += 1) {
    jar.set(`${SESSION_COOKIE}.${i}`, "", opts);
  }
}
