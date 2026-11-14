import type { Dispatch, SetStateAction } from "react";
import { STOCK_CATEGORIES } from "@/lib/plant-catalogs";

export type {
  EntryKind,
  LineItem,
  PurchaseTypeValue,
  SaleTypeValue,
  ShiftKey,
  ShiftModulesMap,
  StockCallPutupItem,
  StockDispatchPendingItem,
  StockInsulationExtra,
  StockSaleItem,
  StockSingleQuadExtra,
  StockWipSalesLine,
  TodayHubProps,
  TodayModuleKey,
  TodayModuleStatus,
} from "./today-hub-types";

export {
  CONDUCTOR_SALE_TYPES,
  CUSTOMERS,
  ENTRY_KINDS,
  ENTRY_KIND_LABEL_KEY,
  KIND_TO_MODULE,
  MODULE_ICONS,
  MODULE_KIND,
  PRODUCT_NAMES,
  PRODUCTS,
  PURCHASE_TYPES,
  QUAD_SIGNAL_SALE_TYPES,
  SALE_TYPES,
} from "./today-hub-catalog";

import type { LineItem, TodayModuleStatus } from "./today-hub-types";

export const STOCK_CATEGORIES_OPTIONS = [...STOCK_CATEGORIES] as const;

export function newLine(unit = "Kg", itemDescription = ""): LineItem {
  return {
    id: crypto.randomUUID(),
    itemDescription,
    unit,
    quantity: "",
    rate: "",
    gstPercent: "18",
    inMeter: "",
    qtyMtr: "",
    meterUnit: "",
    openingReading: "",
    closingReading: "",
    debitQuantity: "",
  };
}

export async function fetchStockPurchaseRate(
  plantId: string,
  itemName: string,
  date: string,
): Promise<number | null> {
  const qs = new URLSearchParams({ itemName, date });
  const res = await fetch(`/api/plants/${plantId}/stock/average-rate?${qs}`);
  const json = (await res.json()) as { rate?: number | null };
  if (!res.ok) return null;
  return json.rate != null && Number.isFinite(json.rate) ? json.rate : null;
}

export function moduleScore(mod: TodayModuleStatus) {
  return `${mod.done ?? (mod.filled ? 1 : 0)}/${mod.total ?? 1}`;
}

export function rememberCustomOption(
  setter: Dispatch<SetStateAction<string[]>>,
  value: string | null | undefined,
) {
  const v = (value ?? "").trim();
  if (!v || /^(other|others)$/i.test(v)) return;
  setter((prev) => (prev.includes(v) ? prev : [...prev, v]));
}