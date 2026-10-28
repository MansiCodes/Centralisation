/**
 * Helpers for tracking which days have had data entered (sales, purchases,
 * stock, etc.) — used to build the week completion bars on the dashboard.
 */
import { TODAY_MODULE_COUNT } from "@/lib/dashboard/metrics-types";
import { addFormSlotsFromGroupBy, shiftFilledForDate } from "@/lib/dashboard/metrics-assemble";
import type { AssembleGroupCount } from "@/lib/dashboard/metrics-assemble-types";

export type DaySets = {
  prodDays: Set<string>;
  stockDays: Set<string>;
  pettyDays: Set<string>;
  saleDays: Set<string>;
  purchaseDays: Set<string>;
};

export function buildDaySets(): DaySets {
  return {
    prodDays: new Set(),
    stockDays: new Set(),
    pettyDays: new Set(),
    saleDays: new Set(),
    purchaseDays: new Set(),
  };
}

export function populateDaySets(
  sets: DaySets,
  multiPlant: boolean,
  weekProd: AssembleGroupCount[],
  weekStock: AssembleGroupCount[],
  weekPetty: AssembleGroupCount[],
  weekSaleRows: AssembleGroupCount[],
  weekPurchaseRows: AssembleGroupCount[],
) {
  addFormSlotsFromGroupBy(multiPlant, sets.prodDays, weekProd);
  addFormSlotsFromGroupBy(multiPlant, sets.stockDays, weekStock);
  addFormSlotsFromGroupBy(multiPlant, sets.pettyDays, weekPetty);
  addFormSlotsFromGroupBy(multiPlant, sets.saleDays, weekSaleRows);
  addFormSlotsFromGroupBy(multiPlant, sets.purchaseDays, weekPurchaseRows);
}

export function buildWeekCompletion(
  bucketKeys: string[],
  bucketGranularity: string,
  plants: { id: string; name: string; code: string }[],
  multiPlant: boolean,
  sets: DaySets,
): number[] {
  const perShiftFormTotal = multiPlant ? plants.length * TODAY_MODULE_COUNT : TODAY_MODULE_COUNT;
  return bucketKeys.map((date) => {
    if (bucketGranularity !== "day") return 0;
    const slots = perShiftFormTotal * 2;
    if (slots === 0) return 0;
    const filled =
      shiftFilledForDate(date, "DAY", plants, multiPlant, sets.purchaseDays, sets.saleDays, sets.stockDays, sets.pettyDays) +
      shiftFilledForDate(date, "NIGHT", plants, multiPlant, sets.purchaseDays, sets.saleDays, sets.stockDays, sets.pettyDays);
    return Math.round((filled / slots) * 100);
  });
}
