import {
  parseQuadSignalStockNotes,
  quadSignalClosingFromMeta,
  type QuadSignalStockMeta,
} from "@/lib/plant-catalogs";
import { isPowerCableName } from "@/lib/power-cable";
import { nextDayFormOpeningFromMeta } from "@/lib/quad-signal-form-stock";
import { INSULATION_KEY, qtyOnMap } from "@/lib/quad-signal-opening-match-qty";
import { isSameSizeRow, matchesCableSize } from "@/lib/quad-signal-opening-match-rows";

function rowDateIso(row: { date?: Date }): string | null {
  return row.date ? row.date.toISOString().slice(0, 10) : null;
}

export function lastEnteredOpeningByProcess(
  rows: Array<{ date?: Date; itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processNames: readonly string[] = [],
  skipInsulation = false,
  useLastClosing = false,
): { opening: Record<string, number>; fromDate: string | null } {
  const names = skipInsulation
    ? processNames.filter((p) => p.trim().toLowerCase() !== "insulation")
    : [...processNames];
  for (const row of rows) {
    const { meta } = parseQuadSignalStockNotes(row.notes);
    if (meta?.kind !== "cable" || !isSameSizeRow(row, cable, size, itemName, meta)) {
      continue;
    }
    const closing = quadSignalClosingFromMeta(meta);
    const src = useLastClosing
      ? { ...(meta.opening ?? {}), ...closing }
      : { ...closing, ...(meta.opening ?? {}) };
    const out: Record<string, number> = {};
    const keys = names.length > 0 ? names : Object.keys(src);
    if (useLastClosing) {
      Object.assign(out, nextDayFormOpeningFromMeta(keys, meta));
      if (isPowerCableName(cable) && out[INSULATION_KEY] == null) {
        const insVal = qtyOnMap(closing, INSULATION_KEY);
        if (Number.isFinite(insVal)) out[INSULATION_KEY] = insVal;
      }
    } else {
      for (const proc of keys) {
        if (skipInsulation && proc.trim().toLowerCase() === "insulation") continue;
        const n = qtyOnMap(src, proc);
        if (Number.isFinite(n)) out[proc] = n;
      }
    }
    return { opening: out, fromDate: rowDateIso(row) };
  }
  return { opening: {}, fromDate: null };
}

function lastProductionSnapshot(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processNames: readonly string[],
  skipInsulation: boolean,
  requirePositive: boolean,
): Record<string, number> {
  const names = skipInsulation
    ? processNames.filter((p) => p.trim().toLowerCase() !== "insulation")
    : [...processNames];
  for (const row of rows) {
    const { meta } = parseQuadSignalStockNotes(row.notes);
    if (meta?.kind !== "cable" || !isSameSizeRow(row, cable, size, itemName, meta)) {
      continue;
    }
    const out: Record<string, number> = {};
    const keys = names.length > 0 ? names : Object.keys(meta.production ?? {});
    let any = !requirePositive;
    for (const proc of keys) {
      if (skipInsulation && proc.trim().toLowerCase() === "insulation") continue;
      const n = qtyOnMap(meta.production, proc);
      out[proc] = n;
      if (requirePositive && n > 0) any = true;
    }
    if (any) return out;
  }
  return {};
}

export function lastEnteredProductionByProcess(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processNames: readonly string[] = [],
  skipInsulation = false,
): Record<string, number> {
  return lastProductionSnapshot(rows, cable, size, itemName, processNames, skipInsulation, false);
}

export function lastNonZeroProductionByProcess(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processNames: readonly string[] = [],
  skipInsulation = false,
): Record<string, number> {
  return lastProductionSnapshot(rows, cable, size, itemName, processNames, skipInsulation, true);
}

/** @deprecated Use lastEnteredProductionByProcess — latest row, including P=0. */
export function lastPositiveProductionByProcess(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processNames: readonly string[] = [],
): Record<string, number> {
  return lastEnteredProductionByProcess(rows, cable, size, itemName, processNames);
}

export function lastInsulationContributions(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
): NonNullable<QuadSignalStockMeta["sharedInsulation"]>["contributions"] {
  for (const row of rows) {
    const { match, meta } = matchesCableSize(row, cable, size, itemName);
    if (!match) continue;
    return meta?.sharedInsulation?.contributions ?? [];
  }
  return [];
}