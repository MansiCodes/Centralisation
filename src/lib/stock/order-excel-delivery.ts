import { asUtcDate, cellVal, str } from "@/lib/pnl/excel-import/cells";

function parseDeliveryDateToken(s: string): string | null {
  const dmy = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})$/);
  if (!dmy) return null;
  const day = Number(dmy[1]);
  const month = Number(dmy[2]);
  let year = Number(dmy[3]);
  if (year < 100) year += 2000;
  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function cleanDeliveryText(raw: string): string {
  return raw
    .replace(/^(comm(ercial)?|del(ivery)?(\s*period)?|due)\s*[:\-–]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDelivery(v: unknown): string | null {
  const d = asUtcDate(v);
  if (d) return d.toISOString().slice(0, 10);
  let s = str(v);
  if (!s || /^loa$/i.test(s)) return null;
  s = cleanDeliveryText(s);
  if (!s || /^loa$/i.test(s)) return null;
  const exact = parseDeliveryDateToken(s);
  if (exact) return exact;
  const embedded = s.match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/);
  if (embedded) {
    const parsed = parseDeliveryDateToken(embedded[0]);
    if (parsed) return parsed;
  }
  return s || null;
}

export function cellStr(
  row: { getCell: (col: number) => unknown },
  col: number,
): string {
  const cell = row.getCell(col) as {
    master?: Parameters<typeof cellVal>[0];
  } & Parameters<typeof cellVal>[0];
  return str(cellVal(cell.master ?? cell));
}