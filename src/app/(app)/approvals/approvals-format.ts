import { parseQuadSignalStockNotes } from "@/lib/plant-catalogs";

export function fmtQty(n: number): string {
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 4,
  });
}

export function fmtRate(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function joinDetail(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p == null ? "" : String(p).trim()))
    .filter(Boolean)
    .join(" · ");
}

export function stockUserRemark(notes: string | null | undefined): string {
  const raw = notes?.trim() ?? "";
  if (!raw) return "";
  const { meta, userNotes } = parseQuadSignalStockNotes(raw);
  if (meta) return userNotes.trim();
  return raw;
}