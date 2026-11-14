import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/rbac";
import { patchUserSchema } from "./users-schema";
import { patchGuards, validatePatchPlants } from "./user-patch-guards";
import { applyUserPatch, resolvePatchFlags } from "./user-patch-apply";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, globalRole: true, canManageUsers: true },
  });
  if (
    !actor ||
    !canManageUsers(actor.globalRole, { canManageUsers: actor.canManageUsers })
  ) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const { userId } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { plantRoles: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }

  const guard = await patchGuards(actor, existing, parsed.data, userId);
  if (guard) return guard;

  const nextRole = parsed.data.globalRole ?? existing.globalRole;
  const flags = resolvePatchFlags(parsed.data, existing, nextRole);
  const plantErr = await validatePatchPlants(parsed.data, nextRole, flags.nextCanAccessStock);
  if (plantErr) return plantErr;

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 12)
    : undefined;

  const updated = await applyUserPatch(userId, parsed.data, nextRole, flags, passwordHash);

  await writeAuditLog({
    entityType: "User",
    entityId: userId,
    field: "update",
    oldValue: {
      globalRole: existing.globalRole,
      canViewPriceSheet: existing.canViewPriceSheet,
      canAdminMachineProduction: existing.canAdminMachineProduction,
      canMachineSupervise: existing.canMachineSupervise,
      isActive: existing.isActive,
      plantIds: existing.plantRoles.map((p) => p.plantId),
    },
    newValue: {
      ...updated,
      plantIds: parsed.data.plantIds,
      passwordChanged: Boolean(parsed.data.password),
    },
    actorId: actor.id,
  });

  return NextResponse.json({ ok: true, user: updated });
}