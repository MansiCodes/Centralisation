import type ExcelJS from "exceljs";
import { ManpowerShift } from "@prisma/client";
import { asUtcDate, num, str, ymd } from "@/lib/pnl/excel-import/cells";
import { ELECTRICITY_ALIASES, FAR_ALIASES, RENT_ALIASES } from "./aliases";
import {
  findHeaderRow,
  findSheet,
  findSheetFallbackDate,
  getCell,
  resolveEntryDate,
  todayUtc,
} from "./sheet";
import type { ParsedPnlWorkbook } from "./types";
import { sectionBreak } from "./values";

export function parseElectricitySheets(
  wb: ExcelJS.Workbook,
  result: ParsedPnlWorkbook,
): void {
  const dedicated = findSheet(wb, [
    "Electricity",
    "Electricity & Power",
    "Fuel & Power",
    "Fuel and Power",
  ]);
  const combined = findSheet(wb, ["Electricity, Rent & Stock"]);
  const sheets = [dedicated, combined].filter(
    (s, i, arr): s is ExcelJS.Worksheet =>
      !!s && arr.findIndex((x) => x?.name === s.name) === i,
  );
  for (const sheet of sheets) {
    const start =
      sheet.name.toLowerCase().includes("rent") ||
      sheet.name.toLowerCase().includes("stock")
        ? 10
        : 1;
    const header = findHeaderRow(sheet, ELECTRICITY_ALIASES, 60, start);
    if (!header || header.map.amount == null) continue;
    // Avoid re-using stock header
    if (header.map.quantity != null && header.map.item != null) continue;
    for (let r = header.row + 1; r <= sheet.rowCount; r++) {
      const dateRaw = asUtcDate(getCell(sheet, r, header.map, "date"));
      const amount = num(getCell(sheet, r, header.map, "amount")) ?? 0;
      const opening = num(getCell(sheet, r, header.map, "opening"));
      const closing = num(getCell(sheet, r, header.map, "closing"));
      if (!dateRaw && amount === 0 && opening == null && closing == null) {
        continue;
      }
      const label = str(getCell(sheet, r, header.map, "date"));
      if (/\bTOTAL\b/i.test(label) || sectionBreak(label)) break;
      if (!dateRaw || amount <= 0) continue;
      result.expenses.push({
        row: r,
        date: ymd(dateRaw),
        shift: ManpowerShift.DAY,
        target: "electricity",
        expenseHead: "Electricity",
        nature: null,
        expenseName: null,
        description: str(getCell(sheet, r, header.map, "notes")) || null,
        payMode: "Bank",
        amount,
        contractorSalary: 0,
        supervisorSalary: 0,
        billNumber: null,
        openingReading: opening,
        closingReading: closing,
        vendor: null,
        cost: null,
        gst: null,
        depreciationPercent: null,
        coveredAreaSqft: null,
        rentRatePerSqft: null,
      });
    }
  }
}
