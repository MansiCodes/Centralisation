import type { ElectricityRent } from "@prisma/client";
import { toIsoDateString } from "@/lib/dates";
import type { PvcExpenseRegisterRow } from "./pvc-expense-types";
import { formatDay, monthLabel } from "./pvc-expense-format";

export function unifyElectricityRows(rows: ElectricityRent[]): PvcExpenseRegisterRow[] {
  const unified: PvcExpenseRegisterRow[] = [];
  for (const row of rows) {
    unified.push(...electricityRowsForOne(row));
  }
  return unified;
}

function electricityRowsForOne(row: ElectricityRent): PvcExpenseRegisterRow[] {
  const monthIso = toIsoDateString(row.month);
  const bill = Number(row.billAmount) || 0;
  const rent = Number(row.rentAmount) || 0;
  const out: PvcExpenseRegisterRow[] = [];

  if (bill > 0) {
    const details = [
      row.openingReading != null ? `Opening ${row.openingReading}` : null,
      row.closingReading != null ? `Closing ${row.closingReading}` : null,
      row.consumedUnits != null ? `Consumed ${row.consumedUnits}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    out.push({
      id: `elec-bill-${row.id}`,
      expenseLabel: "Fuel & Power",
      sortDate: monthIso,
      periodLabel: monthLabel(monthIso),
      description: "Fuel & power / electricity bill",
      details: details || row.notes,
      amount: bill,
      source: "electricityRent",
    });
  }

  if (rent > 0) {
    const area = row.coveredAreaSqft != null ? Number(row.coveredAreaSqft) : null;
    const rate = row.rentRatePerSqft != null ? Number(row.rentRatePerSqft) : null;
    const details =
      area != null && rate != null
        ? `${area.toLocaleString("en-IN")} SQFT @ ${rate}`
        : row.notes;
    out.push({
      id: `elec-rent-${row.id}`,
      expenseLabel: "Factory Rent",
      sortDate: monthIso,
      periodLabel: monthLabel(monthIso),
      description: "Factory rent",
      details,
      amount: rent,
      source: "electricityRent",
    });
  }
  return out;
}