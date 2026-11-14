import { quadSignalClosingFromMeta, type QuadSignalStockMeta } from "@/lib/plant-catalogs";
import { INSULATION_KEY, qtyOnMap } from "@/lib/quad-signal-opening-match-qty";
import { matchesSignallingCable } from "@/lib/quad-signal-opening-match-rows";

function rowDateIso(row: { date?: Date }): string | null {
  return row.date ? row.date.toISOString().slice(0, 10) : null;
}

/** Shared Insulation closing from a Signalling Cable stock entry. */
export function insulationClosingFromMeta(
  meta: QuadSignalStockMeta | null | undefined,
): number | null {
  if (!meta || meta.kind !== "cable") return null;
  if (
    meta.sharedInsulation &&
    Number.isFinite(meta.sharedInsulation.closing)
  ) {
    return Number(meta.sharedInsulation.closing);
  }
  const closing = quadSignalClosingFromMeta(meta);
  if (
    closing[INSULATION_KEY] != null &&
    Number.isFinite(closing[INSULATION_KEY])
  ) {
    return Number(closing[INSULATION_KEY]);
  }
  return null;
}

function insulationProductionFromMeta(meta: QuadSignalStockMeta | null): number {
  if (!meta || meta.kind !== "cable") return 0;
  return Number(meta.production?.[INSULATION_KEY]) || 0;
}

function insulationConsumedFromMeta(meta: QuadSignalStockMeta | null): number {
  if (!meta || meta.kind !== "cable") return 0;
  return Number(meta.sharedInsulation?.consumed) || 0;
}

function insulationOpeningFromMeta(
  meta: QuadSignalStockMeta | null,
  closing: number,
): number {
  const openMap = meta?.opening;
  if (openMap) {
    for (const key of Object.keys(openMap)) {
      if (key.trim().toLowerCase() !== "insulation") continue;
      return qtyOnMap(openMap, INSULATION_KEY);
    }
  }
  return closing;
}

function canonicalizeInsulationSnap(s: {
  opening: number;
  production: number;
  consumed: number;
  closing: number;
}): {
  opening: number;
  production: number;
  consumed: number;
  closing: number;
} {
  const idle = s.production === 0 && s.consumed === 0;
  if (idle && Math.round(s.opening * 1000) !== Math.round(s.closing * 1000)) {
    return { ...s, opening: s.closing };
  }
  return s;
}

function insulationSnapKey(s: {
  opening: number;
  production: number;
  consumed: number;
  closing: number;
}): string {
  const r = (n: number) => String(Math.round(n * 1000) / 1000);
  return `${r(s.opening)}|${r(s.production)}|${r(s.consumed)}|${r(s.closing)}`;
}

/**
 * Last Insulation fill: later size saves that only copy an older idle
 * snapshot (P=0, Out=0) do not replace a newer distinct Opening the user typed.
 */
export function pickLastInsulationFillRow<T>(
  newestFirst: T[],
  toSnap: (row: T) => {
    opening: number;
    production: number;
    consumed: number;
    closing: number;
  } | null,
): T | null {
  const oldestFirst = [...newestFirst].reverse();
  const seenIdle = new Set<string>();
  let last: T | null = null;
  for (const row of oldestFirst) {
    const raw = toSnap(row);
    if (!raw) continue;
    const snap = canonicalizeInsulationSnap(raw);
    const key = insulationSnapKey(snap);
    const idle = snap.production === 0 && snap.consumed === 0;
    if (!idle) {
      last = row;
      seenIdle.add(key);
      continue;
    }
    if (last == null) {
      last = row;
      seenIdle.add(key);
      continue;
    }
    if (seenIdle.has(key)) continue;
    last = row;
    seenIdle.add(key);
  }
  return last;
}

export function findLatestInsulationPoolMeta(
  rows: Array<{ date?: Date; itemName: string; notes: string | null }>,
): {
  opening: number;
  closing: number;
  production: number;
  contributions: NonNullable<QuadSignalStockMeta["sharedInsulation"]>["contributions"];
  fromDate: string | null;
} | null {
  const picked = pickLastInsulationFillRow(rows, (row) => {
    const sig = matchesSignallingCable(row);
    if (!sig.match) return null;
    const ins = insulationClosingFromMeta(sig.meta);
    if (ins == null) return null;
    return {
      opening: insulationOpeningFromMeta(sig.meta, ins),
      production: insulationProductionFromMeta(sig.meta),
      consumed: insulationConsumedFromMeta(sig.meta),
      closing: ins,
    };
  });
  if (!picked) return null;
  const sig = matchesSignallingCable(picked);
  const ins = insulationClosingFromMeta(sig.meta);
  if (ins == null) return null;
  const production = insulationProductionFromMeta(sig.meta);
  const consumed = insulationConsumedFromMeta(sig.meta);
  const openingRaw = insulationOpeningFromMeta(sig.meta, ins);
  const snap = canonicalizeInsulationSnap({
    opening: openingRaw,
    production,
    consumed,
    closing: ins,
  });
  return {
    opening: snap.opening,
    closing: snap.closing,
    production: snap.production,
    contributions: sig.meta?.sharedInsulation?.contributions ?? [],
    fromDate: rowDateIso(picked),
  };
}

/**
 * Latest Signalling Insulation closing from the newest matching save.
 */
export function findLatestSharedInsulationOpening(
  rows: Array<{ date?: Date; itemName: string; notes: string | null }>,
): { value: number; fromDate: string | null } | null {
  for (const row of rows) {
    const sig = matchesSignallingCable(row);
    if (!sig.match) continue;
    const ins = insulationClosingFromMeta(sig.meta);
    if (ins == null) continue;
    return { value: ins, fromDate: rowDateIso(row) };
  }
  return null;
}