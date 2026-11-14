import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/rbac";
import { loadUsersActor, usersAccessOpts } from "./users-actor";
import { createUserSchema } from "./users-schema";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const loaded = await loadUsersActor(session);
    if ("error" in loaded) return loaded.error;
    const { actor } = loaded;
    if (!canManageUsers(actor.globalRole, usersAccessOpts(actor))) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createUserSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid payload", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const plantIds = [...new Set(parsed.data.plantIds)];
    const plantErr = await validatePlantIds(plantIds);
    if (plantErr) return plantErr;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Email already registered" },
        { status: 409 },
      );
    }

    const phone = parsed.data.phone;
    const phoneTaken = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });
    if (phoneTaken) {
      return NextResponse.json(
        { ok: false, message: "Mobile number already registered" },
        { status: 409 },
      );
    }

    const role = parsed.data.globalRole;
    const roleErr = validateCreateRole(actor, role, plantIds);
    if (roleErr) return roleErr;

    const flags = resolveCreateFlags(role, parsed.data);
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name?.trim() || null,
        phone,
        passwordHash,
        globalRole: role,
        creditScore: role === GlobalRole.SUPER_ADMIN ? 100 : null,
        ...flags,
        isActive: true,
        plantRoles: {
          create: plantIds.map((plantId) => ({ plantId, role })),
        },
      },
      select: userSelect,
    });

    await writeAuditLog({
      entityType: "User",
      entityId: user.id,
      field: "create",
      newValue: {
        email: user.email,
        phone: user.phone,
        globalRole: user.globalRole,
        plantIds,
        canViewPriceSheet: user.canViewPriceSheet,
        canMachineSupervise: user.canMachineSupervise,
        canAdminMachineProduction: user.canAdminMachineProduction,
        canAccessStock: user.canAccessStock,
        canManageUsers: user.canManageUsers,
      },
      actorId: actor.id,
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/users POST]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 500 },
    );
  }
}

const userSelect = {
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
} as const;

async function validatePlantIds(plantIds: string[]) {
  if (plantIds.length === 0) return null;
  const count = await prisma.plant.count({
    where: { id: { in: plantIds }, isActive: true },
  });
  if (count !== plantIds.length) {
    return NextResponse.json(
      { ok: false, message: "One or more plants are invalid" },
      { status: 400 },
    );
  }
  return null;
}

function validateCreateRole(
  actor: { globalRole: GlobalRole },
  role: GlobalRole,
  plantIds: string[],
) {
  if (role === GlobalRole.SUPER_ADMIN && actor.globalRole !== GlobalRole.SUPER_ADMIN) {
    return NextResponse.json(
      { ok: false, message: "Only Super Admin can create Super Admin users" },
      { status: 403 },
    );
  }
  const needsPlants =
    role !== GlobalRole.SUPER_ADMIN && role !== GlobalRole.MACHINE_SUPERVISOR;
  if (needsPlants && plantIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Assign at least one plant for this user" },
      { status: 400 },
    );
  }
  return null;
}

function resolveCreateFlags(
  role: GlobalRole,
  data: {
    canViewPriceSheet: boolean;
    canMachineSupervise: boolean;
    canAdminMachineProduction: boolean;
    canAccessStock: boolean;
    canManageUsers: boolean;
  },
) {
  return {
    canViewPriceSheet:
      role === GlobalRole.SUPER_ADMIN ? true : Boolean(data.canViewPriceSheet),
    canMachineSupervise:
      role === GlobalRole.PLANT_MANAGER || role === GlobalRole.ACCOUNTANT
        ? Boolean(data.canMachineSupervise)
        : false,
    canAdminMachineProduction:
      role === GlobalRole.SUPER_ADMIN ? true : Boolean(data.canAdminMachineProduction),
    canAccessStock: Boolean(data.canAccessStock),
    canManageUsers:
      role === GlobalRole.SUPER_ADMIN ? false : Boolean(data.canManageUsers),
  };
}