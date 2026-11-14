import { revalidateTag, unstable_cache } from "next/cache";
import { calculatePlantPnlStatement } from "@/lib/pnl/calculate";
import type { PlantPnlStatement } from "@/lib/pnl/types";

export function pnlCacheTag(plantId: string) {
  return `pnl:${plantId}`;
}

export function invalidatePlantPnlCache(plantId: string) {
  revalidateTag(pnlCacheTag(plantId));
}

type PnlOpts = {
  enteredById?: string;
  approvedOnly?: boolean;
};

export function getCachedPlantPnlStatement(
  plantId: string,
  from: Date,
  to: Date,
  opts: PnlOpts = {},
): Promise<PlantPnlStatement> {
  const fromKey = from.toISOString().slice(0, 10);
  const toKey = to.toISOString().slice(0, 10);
  const enteredById = opts.enteredById ?? "";
  const approvedOnly = Boolean(opts.approvedOnly);

  return unstable_cache(
    async () =>
      calculatePlantPnlStatement(plantId, from, to, {
        ...(enteredById ? { enteredById } : {}),
        approvedOnly,
      }),
    ["plant-pnl", plantId, fromKey, toKey, enteredById, String(approvedOnly)],
    { revalidate: 45, tags: [pnlCacheTag(plantId)] },
  )();
}
