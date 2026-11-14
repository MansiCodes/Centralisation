import {
  callPutupItemsFromCableMeta,
  type NoteCallPutup,
} from "@/components/today/hub/process-row-out-label";
import { parseQuadSignalStockNotes } from "@/lib/plant-catalogs";
import { isFormOuterProcess } from "@/lib/quad-signal-form-stock";

export function callPutupsFromNotes(notes: string | null | undefined): NoteCallPutup[] {
  const { meta } = parseQuadSignalStockNotes(notes);
  return meta?.kind === "cable" ? callPutupItemsFromCableMeta(meta) : [];
}

export function outerQty(map: Record<string, number> | undefined): number | null {
  const hit = Object.entries(map ?? {}).find(([key]) => isFormOuterProcess(key));
  const n = hit ? Number(hit[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Saved Outer closing is below opening + production, i.e. that save subtracted put-up. */
export function outerClosingTookPutup(meta: {
  opening?: Record<string, number>;
  production?: Record<string, number>;
  closing?: Record<string, number>;
}): boolean {
  const closing = outerQty(meta.closing);
  if (closing == null) return true;
  const gross = (outerQty(meta.opening) ?? 0) + (outerQty(meta.production) ?? 0);
  return gross - closing > 0.0005;
}

export function stripInsulationQty(map: Record<string, number>) {
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(map)) {
    if (key.trim().toLowerCase() === "insulation") continue;
    out[key] = raw;
  }
  return out;
}