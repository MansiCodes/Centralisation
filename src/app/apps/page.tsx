import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accessCount, resolveCentralAccess } from "@/lib/central/access";
import { mintSsoCode, workspacePublicUrl } from "@/lib/central/sso";
import { AppsLauncher } from "./AppsLauncher";

export default async function AppsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const access = resolveCentralAccess({
    email: session.user.email,
    globalRole: session.user.globalRole,
  });
  const n = accessCount(access);

  if (n === 0) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>No application access</h1>
        <p>Your account is signed in but has no app assigned. Contact an administrator.</p>
      </main>
    );
  }

  if (n === 1) {
    // Already signed into P&L (Centralisation login = P&L session) — do not re-SSO.
    if (access.pnl) redirect("/");
    const code = mintSsoCode({
      email: session.user.email,
      name: session.user.name,
      app: "workspace",
    });
    redirect(
      `${workspacePublicUrl()}/central-sso?code=${encodeURIComponent(code)}`,
    );
  }

  return (
    <AppsLauncher
      email={session.user.email}
      name={session.user.name ?? null}
      access={access}
    />
  );
}
