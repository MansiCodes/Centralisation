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

export function parseRentSheets(
  wb: ExcelJS.Workbook,
  result: ParsedPnlWorkbook,
): void {
  const dedicated = findSheet(wb, ["Rent", "Factory Rent"]);
  const combined = findSheet(wb, ["Electricity, Rent & Stock"]);
  const sheets = [dedicated, combined].filter(
    (s, i, arr): s is ExcelJS.Worksheet =>
      !!s && arr.findIndex((x) => x?.name === s.name) === i,
  );
  for (const sheet of sheets) {
    const start =
      sheet.name.toLowerCase().includes("electricity") ||
      sheet.name.toLowerCase().includes("stock")
        ? 25
        : 1;
    const header = findHeaderRow(sheet, RENT_ALIASES, 80, start);
    if (!header) continue;
    if (header.map.opening != null || header.map.closing != null) continue;
    for (let r = header.row + 1; r <= sheet.rowCount; r++) {
      const dateRaw = asUtcDate(getCell(sheet, r, header.map, "date"));
      const area = num(getCell(sheet, r, header.map, "area"));
      const rentRate =
        num(getCell(sheet, r, header.map, "rentRate")) ??
        num(getCell(sheet, r, header.map, "rateOnly"));
      let amount = num(getCell(sheet, r, header.map, "amount"));
      if ((amount == null || amount === 0) && area != null && rentRate != null) {
        amount = area * rentRate;
      }
      amount = amount ?? 0;
      if (!dateRaw && amount === 0) continue;
      const label = str(getCell(sheet, r, header.map, "date"));
      if (/\bTOTAL\b/i.test(label)) break;
      if (!dateRaw || amount <= 0) continue;
      result.expenses.push({
        row: r,
        date: ymd(dateRaw),
        shift: ManpowerShift.DAY,
        target: "rent",
        expenseHead: "Factory Rent",
        nature: null,
        expenseName: null,
        description: str(getCell(sheet, r, header.map, "notes")) || null,
        payMode: "Bank",
        amount,
        contractorSalary: 0,
        supervisorSalary: 0,
        billNumber: null,
        openingReading: null,
        closingReading: null,
        vendor: null,
        cost: null,
        gst: null,
        depreciationPercent: null,
        coveredAreaSqft: area,
        rentRatePerSqft: rentRate,
      });
    }
  }
}
