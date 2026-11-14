import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  canManageUsers,
  canViewUsersDirectory,
  getPrimarySuperAdminEmail,
  isPrimarySuperAdmin,
} from "@/lib/rbac";
import { loadUsersActor, usersAccessOpts } from "./users-actor";

export async function GET() {
  try {
    const session = await auth();
    const loaded = await loadUsersActor(session);
    if ("error" in loaded) return loaded.error;
    const { actor } = loaded;
    if (!canViewUsersDirectory(actor.globalRole, usersAccessOpts(actor))) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        globalRole: true,
        creditScore: true,
        canViewPriceSheet: true,
        canMachineSupervise: true,
        canAdminMachineProduction: true,
        canAccessStock: true,
        canManageUsers: true,
        isActive: true,
        coinsBalance: true,
        createdAt: true,
        plantRoles: {
          select: {
            plantId: true,
            role: true,
            plant: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      users,
      canManage: canManageUsers(actor.globalRole, usersAccessOpts(actor)),
      allowSuperAdmin: actor.globalRole === GlobalRole.SUPER_ADMIN,
      canManageSuperAdmins: isPrimarySuperAdmin(actor.email),
      primarySuperAdminEmail: getPrimarySuperAdminEmail(),
    });
  } catch (err) {
    console.error("GET /api/admin/users failed", err);
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to load users",
      },
      { status: 500 },
    );
  }
}