export type ElectricityRentRow = {
  id: string;
  month: string;
  openingReading: number | string | null;
  closingReading: number | string | null;
  consumedUnits: number | string | null;
  billAmount: number;
  rentAmount: number;
  coveredAreaSqft?: number | string | null;
  rentRatePerSqft?: number | string | null;
  notes: string | null;
};

export function num(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatReading(value: number | string | null | undefined) {
  const n = num(value);
  if (n == null) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function avgRate(row: ElectricityRentRow) {
  const consumed = num(row.consumedUnits);
  const bill = num(row.billAmount) ?? 0;
  if (consumed != null && consumed > 0 && bill > 0) {
    return bill / consumed;
  }
  return null;
}

export function coveredAreaLabel(row: ElectricityRentRow) {
  const area = num(row.coveredAreaSqft);
  if (area == null) return "—";
  return `${area.toLocaleString("en-IN")} SQFT`;
}