import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveCentralAccess } from "@/lib/central/access";
import type { CentralDirectoryUser } from "@/lib/central/directory-types";
import { prisma } from "@/lib/db";
import { workspaceApiUrl } from "@/lib/central/sso";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 });
  }

  const access = resolveCentralAccess({
    email: session.user.email,
    globalRole: session.user.globalRole,
  });

  if (!(access.pnl && access.workspace)) {
    return NextResponse.json({ ok: false, message: "Both-app access required" }, { status: 403 });
  }

  const pnlRows = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      globalRole: true,
      isActive: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  const users: CentralDirectoryUser[] = pnlRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.globalRole,
    active: u.isActive,
    app: "pnl" as const,
  }));

  const secret = process.env.SSO_SECRET || process.env.AUTH_SECRET;
  if (secret) {
    try {
      const res = await fetch(`${workspaceApiUrl()}/api/central/directory-users`, {
        headers: { "x-central-secret": secret },
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as {
          data?: { users?: Array<Omit<CentralDirectoryUser, "app">> };
        };
        for (const u of body.data?.users || []) {
          users.push({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            active: u.active,
            app: "workspace",
          });
        }
      }
    } catch {
      // shortcut: show P&L users if Workspace API is down; retry when WS is up
    }
  }

  users.sort((a, b) => {
    const an = (a.name || a.email).toLowerCase();
    const bn = (b.name || b.email).toLowerCase();
    if (an !== bn) return an.localeCompare(bn);
    return a.app.localeCompare(b.app);
  });

  return NextResponse.json({ ok: true, users });
}
