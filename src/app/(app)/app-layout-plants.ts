import type { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getPlantRmSummary,
  getPlantSegment,
  getPlantDisplayName,
  isLegacyMergedPlantCode,
} from "@/lib/plant-segments";
import { isMachineSupervisorOnly } from "@/lib/rbac";

export async function repairMachineSupervisorQuadPlants(
  userId: string,
  role: GlobalRole | null | undefined,
  canAccessStock: boolean,
  plantIds: string[],
): Promise<string[]> {
  if (
    !role ||
    !isMachineSupervisorOnly(role) ||
    !canAccessStock ||
    plantIds.length !== 0
  ) {
    return plantIds;
  }
  const quad = await prisma.plant.findFirst({
    where: {
      isActive: true,
      OR: [
        { code: { equals: "QUAD", mode: "insensitive" } },
        { code: { equals: "QUADSIGNAL", mode: "insensitive" } },
        { code: { equals: "SIGNALLING", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (!quad) return plantIds;
  await prisma.userPlantRole.upsert({
    where: {
      userId_plantId: { userId, plantId: quad.id },
    },
    create: {
      userId,
      plantId: quad.id,
      role: role as GlobalRole,
    },
    update: {},
  });
  return [quad.id];
}

export async function loadSwitchablePlants(
  plantIds: string[],
  globalPlantAccess: boolean,
) {
  const switchablePlantsRaw =
    plantIds.length >= 1 || globalPlantAccess
      ? await prisma.plant.findMany({
          where: {
            ...(globalPlantAccess
              ? { isActive: true }
              : { id: { in: plantIds }, isActive: true }),
          },
          select: { id: true, name: true, code: true },
        })
      : [];

  return switchablePlantsRaw
    .filter((p) => !isLegacyMergedPlantCode(p.code))
    .map((p) => ({
      ...p,
      name: getPlantDisplayName(p.code, p.name),
      rmSummary: getPlantRmSummary(p.code),
      sortOrder: getPlantSegment(p.code)?.sortOrder ?? 99,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}