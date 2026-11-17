"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { clearAuthCookies } from "@/lib/central/clear-auth-cookies";

export async function logoutAction() {
  const jar = await cookies();
  clearAuthCookies(jar);
  // Auth.js redirectTo inside a form server-action returns a non-action Response.
  await signOut({ redirect: false });
  redirect("/login");
}
