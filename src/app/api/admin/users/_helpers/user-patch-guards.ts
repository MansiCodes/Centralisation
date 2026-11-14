import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isPrimarySuperAdmin, isSuperAdmin } from "@/lib/rbac";
import { patchUserSchema } from "./users-schema";

export type PatchData = z.infer<typeof patchUserSchema>;

export async function patchGuards(
  actor: { id: string; email: string | null; globalRole: GlobalRole },
  existing: { id: string; email: string | null; globalRole: GlobalRole },
  data: PatchData,
  userId: string,
) {
  if (existing.globalRole === GlobalRole.SUPER_ADMIN && data.isActive !== undefined) {
    if (!isPrimarySuperAdmin(actor.email)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Only the primary Super Admin can activate or deactivate Super Admins",
        },
        { status: 403 },
      );
    }
    if (isPrimarySuperAdmin(existing.email) && data.isActive === false) {
      return NextResponse.json(
        {
          ok: false,
          message: "The primary Super Admin account cannot be deactivated",
        },
        { status: 400 },
      );
    }
  }
  if (
    existing.id === actor.id &&
    data.globalRole &&
    data.globalRole !== GlobalRole.SUPER_ADMIN
  ) {
    return NextResponse.json(
      { ok: false, message: "You cannot remove your own Super Admin role" },
      { status: 400 },
    );
  }
  if (data.email) {
    const trimmedEmail = data.email.toLowerCase().trim();
    const emailTaken = await prisma.user.findFirst({
      where: { email: trimmedEmail, NOT: { id: userId } },
      select: { id: true },
    });
    if (emailTaken) {
      return NextResponse.json(
        { ok: false, message: "Email address already registered" },
        { status: 409 },
      );
    }
  }
  if (data.phone) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id: userId } },
      select: { id: true },
    });
    if (phoneTaken) {
      return NextResponse.json(
        { ok: false, message: "Mobile number already registered" },
        { status: 409 },
      );
    }
  }
  const nextRole = data.globalRole ?? existing.globalRole;
  if (
    !isSuperAdmin(actor.globalRole) &&
    (existing.globalRole === GlobalRole.SUPER_ADMIN || nextRole === GlobalRole.SUPER_ADMIN)
  ) {
    return NextResponse.json(
      { ok: false, message: "Only Super Admin can edit Super Admin users" },
      { status: 403 },
    );
  }
  return null;
}

export async function validatePatchPlants(
  data: PatchData,
  nextRole: GlobalRole,
  nextCanAccessStock: boolean,
) {
  if (!data.plantIds) return null;
  const plantIds = [...new Set(data.plantIds)];
  if (plantIds.length > 0) {
    const count = await prisma.plant.count({
      where: { id: { in: plantIds }, isActive: true },
    });
    if (count !== plantIds.length) {
      return NextResponse.json(
        { ok: false, message: "One or more plants are invalid" },
        { status: 400 },
      );
    }
  }
  const needsPlant =
    nextRole !== GlobalRole.SUPER_ADMIN &&
    (nextRole !== GlobalRole.MACHINE_SUPERVISOR || nextCanAccessStock);
  if (needsPlant && plantIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Assign at least one plant for this user" },
      { status: 400 },
    );
  }
  return null;
}