import {
  parseQuadSignalStockNotes,
  quadSignalClosingFromMeta,
  type QuadSignalStockMeta,
} from "@/lib/plant-catalogs";
import { qtyOnMap } from "@/lib/quad-signal-opening-match-qty";
import { isSameSizeRow } from "@/lib/quad-signal-opening-match-rows";

/** Latest size-row closing: opening + production − next production (P=0 still counts). */
export function stageClosingFromMeta(
  meta: QuadSignalStockMeta,
  processName: string,
  nextProcessName?: string,
): number | null {
  const p = qtyOnMap(meta.production, processName);
  const o = qtyOnMap(meta.opening, processName);
  const c = qtyOnMap(quadSignalClosingFromMeta(meta), processName);
  const outbound = nextProcessName ? qtyOnMap(meta.production, nextProcessName) : 0;
  if (o === 0 && p === 0 && c === 0 && outbound === 0) return null;
  const implied = o + p - outbound;
  if (Number.isFinite(implied)) return Math.round(implied * 1000) / 1000;
  return c;
}

/**
 * Signalling size WIP from one fill: each stage O + P − next P.
 * DST still includes Laying km, so DST display = that closing − Laying.
 */
export function signallingProcessClosingsFromMeta(
  meta: QuadSignalStockMeta,
  processNames: readonly string[],
): Record<string, number> {
  const names = processNames.filter((p) => p.trim().toLowerCase() !== "insulation");
  const out: Record<string, number> = {};
  for (let i = 0; i < names.length; i++) {
    const proc = names[i]!;
    const n = stageClosingFromMeta(meta, proc, names[i + 1]);
    if (n != null) out[proc] = n;
  }
  const layingKm = qtyOnMap(out, "Laying");
  if (layingKm > 0 && !meta.dstExcludesLaying) {
    for (const key of Object.keys(out)) {
      if (key.trim().toLowerCase() !== "dst") continue;
      out[key] = Math.round(Math.max(0, qtyOnMap(out, "DST") - layingKm) * 1000) / 1000;
    }
  }
  return out;
}

export function lastClosingAfterProduction(
  rows: Array<{ itemName: string; notes: string | null }>,
  cable: string,
  size: string,
  itemName: string,
  processName: string,
  nextProcessName?: string,
): number | null {
  for (const row of rows) {
    const { meta } = parseQuadSignalStockNotes(row.notes);
    if (meta?.kind !== "cable" || !isSameSizeRow(row, cable, size, itemName, meta)) {
      continue;
    }
    const fresh = stageClosingFromMeta(meta, processName, nextProcessName);
    if (fresh != null) return fresh;
  }
  return null;
}

export function freshClosingAfterProd(
  meta: QuadSignalStockMeta,
  processName: string,
  nextProcessName?: string,
): number | null {
  return stageClosingFromMeta(meta, processName, nextProcessName);
}

/** Size WIP with no production (Insulation P does not count). */
export function isIdleSizeWipFill(meta: QuadSignalStockMeta): boolean {
  const prod = meta.production ?? {};
  for (const [key, raw] of Object.entries(prod)) {
    if (key.trim().toLowerCase() === "insulation") continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return false;
  }
  return true;
}