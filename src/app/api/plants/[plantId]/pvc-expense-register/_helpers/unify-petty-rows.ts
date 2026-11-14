import { PettyCashKind, type ElectricityRent, type PettyCashEntry } from "@prisma/client";
import { toIsoDateString } from "@/lib/dates";
import { normalizePvcExpenseHead } from "@/lib/plant-catalogs";
import type { PvcExpenseRegisterRow } from "./pvc-expense-types";
import { formatDay, pettyPhotoFields } from "./pvc-expense-format";
import { pettyRowDetails } from "./petty-row-details";

export function unifyPettyRows(
  pettyRows: PettyCashEntry[],
  electricityRows: ElectricityRent[],
): PvcExpenseRegisterRow[] {
  const unified: PvcExpenseRegisterRow[] = [];
  for (const row of pettyRows) {
    unified.push(...pettyRowsForOne(row, electricityRows));
  }
  return unified;
}

function pettyCashKindRows(row: PettyCashEntry, dateIso: string): PvcExpenseRegisterRow[] {
  const contractor = Number(row.contractorSalary) || 0;
  const supervisor = Number(row.supervisorSalary) || 0;
  const cashAmount = Number(row.amount) || 0;
  const head = normalizePvcExpenseHead(row.expenseHead.trim() || "Expense");
  const out: PvcExpenseRegisterRow[] = [];
  const photos = pettyPhotoFields(row);

  if (contractor > 0) {
    out.push({
      id: `labour-${row.id}`,
      expenseLabel: "Labour Contractor",
      sortDate: dateIso,
      periodLabel: formatDay(dateIso),
      description: row.description?.trim() || "Labour contractor",
      details: row.payMode?.trim() || null,
      amount: contractor,
      source: "pettyCash",
      ...photos,
    });
  }
  if (supervisor > 0) {
    out.push({
      id: `salary-${row.id}`,
      expenseLabel: "Salary Expenses",
      sortDate: dateIso,
      periodLabel: formatDay(dateIso),
      description: row.description?.trim() || "Salary expenses",
      details: row.payMode?.trim() || null,
      amount: supervisor,
      source: "pettyCash",
      ...photos,
    });
  }
  if (cashAmount > 0) {
    const isFin = head === "Financial Cost";
    out.push({
      id: `petty-${row.id}`,
      expenseLabel: isFin ? "Financial Cost" : "Petty Cash",
      sortDate: dateIso,
      periodLabel: formatDay(dateIso),
      description: row.description?.trim() || (isFin ? "Financial Cost" : "Petty cash"),
      details: row.nature?.trim() || row.payMode?.trim() || null,
      amount: cashAmount,
      source: "pettyCash",
      ...photos,
    });
  }
  return out;
}

function skipDuplicateFactoryRent(
  row: PettyCashEntry,
  electricityRows: ElectricityRent[],
): boolean {
  return electricityRows.some(
    (e) =>
      Number(e.rentAmount) > 0 &&
      e.month.getUTCFullYear() === row.date.getUTCFullYear() &&
      e.month.getUTCMonth() === row.date.getUTCMonth(),
  );
}

function pettyRowsForOne(
  row: PettyCashEntry,
  electricityRows: ElectricityRent[],
): PvcExpenseRegisterRow[] {
  const dateIso = toIsoDateString(row.date);
  const head = normalizePvcExpenseHead(row.expenseHead.trim() || "Expense");

  if (row.entryType === PettyCashKind.PETTY_CASH) {
    return pettyCashKindRows(row, dateIso);
  }

  if (head === "Factory Rent" && skipDuplicateFactoryRent(row, electricityRows)) {
    return [];
  }

  return [
    {
      id: `petty-${row.id}`,
      expenseLabel: head,
      sortDate: dateIso,
      periodLabel: formatDay(dateIso),
      description: row.description?.trim() || head,
      details: pettyRowDetails(row, head),
      amount: Number(row.amount) || 0,
      source: "pettyCash",
      ...pettyPhotoFields(row),
    },
  ];
}