import type { PettyCashEntry } from "@prisma/client";

export function pettyRowDetails(row: PettyCashEntry, head: string): string | null {
  const isUnload = /unloading/i.test(head);
  if (isUnload && (row.openingReading != null || row.closingReading != null)) {
    const qty = row.openingReading != null ? Number(row.openingReading) : null;
    const rate = row.closingReading != null ? Number(row.closingReading) : null;
    if (qty != null && rate != null) {
      return `${qty.toLocaleString("en-IN")} MT @ ₹${rate.toLocaleString("en-IN")}`;
    }
    if (qty != null) return `${qty.toLocaleString("en-IN")} MT`;
    if (rate != null) return `₹${rate.toLocaleString("en-IN")}/MT`;
  }
  if (row.openingReading != null || row.closingReading != null) {
    return [
      row.openingReading != null ? `Opening ${row.openingReading}` : null,
      row.closingReading != null ? `Closing ${row.closingReading}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return null;
}