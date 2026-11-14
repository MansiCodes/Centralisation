import {
  orderKey,
  type StockOrderBySize,
  type StockOrderPartyLine,
} from "@/lib/stock/order-excel-types";

export function isCarryParty(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  if (!t || t === "—" || t === "-") return true;
  const n = t.replace(/[.\s'"-]/g, "");
  return n === "do" || n === "ditto" || n === "same";
}

export function isJunkRow(size: string, party: string): boolean {
  const blob = `${size} ${party}`.toLowerCase();
  return (
    !size.trim() ||
    blob.includes("total pending") ||
    blob.includes("crore") ||
    /^loa$/i.test(size.trim())
  );
}

export function addLine(
  byKey: Record<string, StockOrderBySize>,
  matched: { cable: string; size: string },
  line: StockOrderPartyLine,
) {
  const key = orderKey(matched.cable, matched.size);
  const existing = byKey[key];
  if (!existing) {
    byKey[key] = {
      cable: matched.cable,
      size: matched.size,
      totalQty: line.qty,
      parties: [line],
    };
    return;
  }
  existing.totalQty =
    Math.round((existing.totalQty + line.qty) * 10000) / 10000;
  const same = existing.parties.find(
    (p) =>
      p.partyName.toLowerCase() === line.partyName.toLowerCase() &&
      (p.deliveryPeriod ?? "") === (line.deliveryPeriod ?? ""),
  );
  if (same) {
    same.qty = Math.round((same.qty + line.qty) * 10000) / 10000;
    same.done = Math.round((same.done + line.done) * 10000) / 10000;
  } else {
    existing.parties.push(line);
  }
}