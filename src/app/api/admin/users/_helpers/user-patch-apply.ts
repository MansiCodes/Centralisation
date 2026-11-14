import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PatchData } from "./user-patch-guards";

export function resolvePatchFlags(
  data: PatchData,
  existing: {
    canMachineSupervise: boolean;
    canAdminMachineProduction: boolean;
    canAccessStock: boolean;
    canManageUsers: boolean;
  },
  nextRole: GlobalRole,
) {
  const nextCanMachineSupervise =
    data.canMachineSupervise !== undefined
      ? nextRole === GlobalRole.PLANT_MANAGER || nextRole === GlobalRole.ACCOUNTANT
        ? data.canMachineSupervise
        : false
      : nextRole === GlobalRole.PLANT_MANAGER || nextRole === GlobalRole.ACCOUNTANT
        ? existing.canMachineSupervise
        : false;

  const nextCanAdminMachineProduction =
    nextRole === GlobalRole.SUPER_ADMIN
      ? true
      : data.canAdminMachineProduction !== undefined
        ? data.canAdminMachineProduction
        : existing.canAdminMachineProduction;

  const nextCanAccessStock =
    data.canAccessStock !== undefined ? data.canAccessStock : existing.canAccessStock;

  const nextCanManageUsers =
    nextRole === GlobalRole.SUPER_ADMIN
      ? false
      : data.canManageUsers !== undefined
        ? data.canManageUsers
        : existing.canManageUsers;

  return {
    nextCanMachineSupervise,
    nextCanAdminMachineProduction,
    nextCanAccessStock,
    nextCanManageUsers,
  };
}

export async function applyUserPatch(
  userId: string,
  data: PatchData,
  nextRole: GlobalRole,
  flags: ReturnType<typeof resolvePatchFlags>,
  passwordHash: string | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
        ...(data.name !== undefined ? { name: data.name?.trim() || null } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.globalRole ? { globalRole: data.globalRole } : {}),
        ...(data.canViewPriceSheet !== undefined
          ? {
              canViewPriceSheet:
                nextRole === GlobalRole.SUPER_ADMIN ? true : data.canViewPriceSheet,
            }
          : nextRole === GlobalRole.SUPER_ADMIN
            ? { canViewPriceSheet: true }
            : {}),
        canMachineSupervise: flags.nextCanMachineSupervise,
        canAdminMachineProduction: flags.nextCanAdminMachineProduction,
        canAccessStock: flags.nextCanAccessStock,
        canManageUsers: flags.nextCanManageUsers,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        creditScore: nextRole === GlobalRole.SUPER_ADMIN ? 100 : null,
        ...(passwordHash ? { passwordHash } : {}),
      },
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
      },
    });

    if (data.plantIds) {
      const plantIds = [...new Set(data.plantIds)];
      await tx.userPlantRole.deleteMany({ where: { userId } });
      if (plantIds.length > 0) {
        await tx.userPlantRole.createMany({
          data: plantIds.map((plantId) => ({
            userId,
            plantId,
            role: nextRole,
          })),
        });
      }
    }

    return user;
  });
}