import type { FixedAsset } from "@prisma/client";
import { toIsoDateString } from "@/lib/dates";
import { monthStartsInRange } from "@/lib/pnl/calculate/helpers";
import type { PvcExpenseRegisterRow } from "./pvc-expense-types";
import { formatDay } from "./pvc-expense-format";

export function pvcFarMonthCount(fromDate: Date, toDate: Date): number {
  const farMonthsList = monthStartsInRange(fromDate, toDate);
  return Math.max(
    1,
    farMonthsList.filter(
      (m) =>
        (m.getUTCFullYear() === 2026 && m.getUTCMonth() >= 1) ||
        m.getUTCFullYear() > 2026,
    ).length,
  );
}

export function unifyAssetRows(
  assetRows: FixedAsset[],
  fromDate: Date | undefined,
  toDate: Date | undefined,
  pvcFarMonths: number,
): PvcExpenseRegisterRow[] {
  const unified: PvcExpenseRegisterRow[] = [];
  for (const row of assetRows) {
    const item = assetRowToUnified(row, fromDate, toDate, pvcFarMonths);
    if (item) unified.push(item);
  }
  return unified;
}

function assetRowToUnified(
  row: FixedAsset,
  fromDate: Date | undefined,
  toDate: Date | undefined,
  pvcFarMonths: number,
): PvcExpenseRegisterRow | null {
  const dateToCompare = row.billDate ?? row.createdAt;
  if (dateToCompare) {
    const time = dateToCompare.getTime();
    if (fromDate && time < fromDate.getTime()) return null;
    if (toDate && time > toDate.getTime()) return null;
  }

  const dateIso = row.billDate
    ? toIsoDateString(row.billDate)
    : toIsoDateString(row.createdAt);
  const cost = Number(row.cost) || 0;
  const depPercent = Number(row.depreciationPercent) || 18.1;
  const annual = cost * (depPercent / 100);
  const depAmount = Math.round(((annual * pvcFarMonths) / 12) * 100) / 100;
  const vendorBill = [row.vendor, row.billNumber].filter(Boolean).join(" · ");
  const details = [
    `Asset Cost: ₹${cost.toLocaleString("en-IN")} @ ${depPercent}% p.a. (${pvcFarMonths} mos)`,
    vendorBill,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: `far-${row.id}`,
    expenseLabel: "FAR",
    sortDate: dateIso,
    periodLabel: formatDay(dateIso),
    description: row.assetDescription,
    details,
    amount: depAmount,
    source: "fixedAsset",
  };
}