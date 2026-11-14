import { cache } from "react";
import { auth } from "@/auth";
import { getAccessiblePlantIds } from "@/lib/rbac";
import {
  loadSwitchablePlants,
  repairMachineSupervisorQuadPlants,
} from "./app-layout-plants";
import type { GlobalRole } from "@prisma/client";

/** Request-scoped: layout + page share one session lookup. */
export const getLayoutSession = cache(async () => auth());

export const getLayoutPlantIds = cache(async (userId: string) =>
  getAccessiblePlantIds(userId),
);

export const getLayoutRepairedPlantIds = cache(
  async (
    userId: string,
    role: GlobalRole | null | undefined,
    canAccessStock: boolean,
  ) => {
    const plantIds = await getLayoutPlantIds(userId);
    return repairMachineSupervisorQuadPlants(
      userId,
      role,
      canAccessStock,
      plantIds,
    );
  },
);

export const getLayoutSwitchablePlants = cache(
  async (plantIds: string[], globalPlantAccess: boolean) =>
    loadSwitchablePlants(plantIds, globalPlantAccess),
);
