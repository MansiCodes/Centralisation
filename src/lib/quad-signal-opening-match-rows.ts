import {
  normalizeQuadSignalCableSizeKey,
  parseQuadSignalStockNotes,
  type QuadSignalStockMeta,
} from "@/lib/plant-catalogs";
import { isSignallingCableName, normalizeCableName } from "@/lib/quad-signal-wip";

function rowCableName(
  row: { itemName: string },
  meta: QuadSignalStockMeta | null,
): string {
  if (meta?.kind === "cable" && meta.cable) return normalizeCableName(meta.cable);
  const sep = row.itemName.indexOf(" · ");
  return sep >= 0 ? normalizeCableName(row.itemName.slice(0, sep)) : "";
}

function rowSizeName(
  row: { itemName: string },
  meta: QuadSignalStockMeta | null,
): string {
  if (meta?.kind === "cable" && meta.size) return meta.size;
  const sep = row.itemName.indexOf(" · ");
  return sep >= 0 ? row.itemName.slice(sep + 3) : "";
}

function isSameCableRow(
  row: { itemName: string },
  cable: string,
  meta: QuadSignalStockMeta | null,
): boolean {
  return rowCableName(row, meta) === normalizeCableName(cable);
}

export function isSameSizeRow(
  row: { itemName: string },
  cable: string,
  size: string,
  itemName: string,
  meta: QuadSignalStockMeta | null,
): boolean {
  if (row.itemName === itemName) return true;
  if (meta?.kind !== "cable") return false;
  return (
    isSameCableRow(row, cable, meta) &&
    normalizeQuadSignalCableSizeKey(rowSizeName(row, meta)) ===
      normalizeQuadSignalCableSizeKey(size)
  );
}

export function matchesCableSize(
  row: { itemName: string; notes: string | null },
  cable: string,
  size: string,
  itemName: string,
): { match: boolean; meta: QuadSignalStockMeta | null } {
  const { meta } = parseQuadSignalStockNotes(row.notes);
  const match = isSameSizeRow(row, cable, size, itemName, meta);
  return { match, meta };
}

export function matchesSignallingCable(row: {
  itemName: string;
  notes: string | null;
}): { match: boolean; meta: QuadSignalStockMeta | null } {
  const { meta } = parseQuadSignalStockNotes(row.notes);
  if (meta?.kind === "cable" && meta.cable && isSignallingCableName(meta.cable)) {
    return { match: true, meta };
  }
  if (row.itemName.toLowerCase().startsWith("signalling cable")) {
    return { match: true, meta };
  }
  return { match: false, meta };
}