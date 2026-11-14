import { parseQuadSignalStockNotes } from "@/lib/plant-catalogs";
import { pickSharedInsulationPool } from "./build-cable-insulation";
import {
  cableBlockFromRow,
  finalizeCableBlocks,
} from "./build-cable-block";
import { mergeOrderPutups, putupItemsFromMeta } from "./build-cable-putup";
import type { CableStockStatusBlock, SharedInsulationStatus } from "./types";

/**
 * Build cable-size production status from the last fill per cable · size
 * (newest save, any date — not last calendar day).
 * Near-duplicate "Other" spellings collapse via normalizeQuadSignalCableSizeKey.
 * Signalling Insulation is returned separately (shared across sizes).
 */
export function buildCableStockStatus(
  rows: Array<{
    id: string;
    date: Date;
    itemName: string;
    notes?: string | null;
  }>,
): {
  blocks: CableStockStatusBlock[];
  sharedInsulation: SharedInsulationStatus | null;
  quadInsulation: SharedInsulationStatus | null;
} {
  const byKey = new Map<string, CableStockStatusBlock>();
  const signallingInsul: SharedInsulationStatus[] = [];
  const quadInsul: SharedInsulationStatus[] = [];

  for (const row of rows) {
    try {
      const { meta, userNotes } = parseQuadSignalStockNotes(row.notes);
      if (!meta || meta.kind !== "cable" || !meta.cable || !meta.size) continue;

      const parsed = cableBlockFromRow(row, meta, userNotes);
      if (!parsed) continue;
      if (parsed.sig) signallingInsul.push(parsed.sig);
      if (parsed.quad) quadInsul.push(parsed.quad);

      if (byKey.has(parsed.key)) {
        const block = byKey.get(parsed.key)!;
        block.orderPutupItems = mergeOrderPutups(
          block.orderPutupItems ?? block.callPutupItems ?? [],
          putupItemsFromMeta(meta),
        );
        continue;
      }
      byKey.set(parsed.key, parsed.block);
    } catch (err) {
      console.error("[buildCableStockStatus] skipped bad row", row.id, err);
    }
  }

  const blocks = Array.from(byKey.values());
  finalizeCableBlocks(blocks);

  return {
    blocks,
    sharedInsulation: pickSharedInsulationPool(signallingInsul),
    quadInsulation: pickSharedInsulationPool(quadInsul),
  };
}