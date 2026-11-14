"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REMEMBER_COOKIE, signOut } from "@/auth";
import { CENTRAL_APP_COOKIE } from "@/lib/central/app-session";

export async function logoutAction() {
  const jar = await cookies();
  jar.set(REMEMBER_COOKIE, "", { path: "/", maxAge: 0 });
  jar.set(CENTRAL_APP_COOKIE, "", { path: "/", maxAge: 0 });
  // Auth.js redirectTo inside a form server-action returns a non-action Response
  // → "An unexpected response was received from the server." Clear session, then redirect.
  await signOut({ redirect: false });
  redirect("/login");
}
