import type { PlantPnlStatement } from "@/lib/pnl/types";
import { assemblePvcStatement } from "./pvc-statement";
import { computePvcTotals } from "./pvc-compute";
import { fetchPvcInputs } from "./pvc-query";

export async function buildPvcDynamic(
  plantIds: string[],
  from: Date,
  to: Date,
  scoped: boolean,
  enteredById?: string,
  approvedOnly?: boolean,
): Promise<PlantPnlStatement> {
  const data = await fetchPvcInputs(
    plantIds,
    from,
    to,
    scoped,
    enteredById,
    approvedOnly,
  );
  const totals = computePvcTotals(data);
  return assemblePvcStatement(totals);
}