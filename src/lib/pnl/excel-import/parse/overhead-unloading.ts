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

export function parseUnloadingSheet(
  wb: ExcelJS.Workbook,
  result: ParsedPnlWorkbook,
): void {
  const sheet = findSheet(wb, [
    "Unloading of MT",
    "Unloading MT",
    "Unloading",
  ]);
  if (sheet) {
    const aliases: Record<string, string[]> = {
      date: ["date", "payment date", "entry date"],
      quantity: ["quantity mt", "quantity", "qty", "mt"],
      rate: ["rate mt", "rate"],
      paidTo: ["paid to", "payee", "contractor"],
      payMode: ["pay mode", "payment mode", "mode"],
      amount: ["amount", "value"],
      notes: ["remarks", "notes", "remark"],
    };
    const header = findHeaderRow(sheet, aliases);
    if (header) {
      for (let r = header.row + 1; r <= sheet.rowCount; r++) {
        const dateRaw = asUtcDate(getCell(sheet, r, header.map, "date"));
        const qty = num(getCell(sheet, r, header.map, "quantity"));
        const rate = num(getCell(sheet, r, header.map, "rate"));
        let amount = num(getCell(sheet, r, header.map, "amount"));
        if (
          (amount == null || amount === 0) &&
          qty != null &&
          rate != null
        ) {
          amount = qty * rate;
        }
        amount = amount ?? 0;
        if (!dateRaw || amount <= 0) continue;
        const paidTo = str(getCell(sheet, r, header.map, "paidTo"));
        const notes = str(getCell(sheet, r, header.map, "notes"));
        result.expenses.push({
          row: r,
          date: ymd(dateRaw),
          shift: ManpowerShift.DAY,
          target: "petty",
          expenseHead: "Unloading of MT",
          nature: null,
          expenseName: null,
          description:
            [paidTo && `Paid to ${paidTo}`, notes, qty != null && `Qty ${qty} MT`]
              .filter(Boolean)
              .join(" · ") || null,
          payMode: str(getCell(sheet, r, header.map, "payMode")) || "Cash",
          amount,
          contractorSalary: 0,
          supervisorSalary: 0,
          billNumber: null,
          openingReading: null,
          closingReading: null,
          vendor: paidTo || null,
          cost: null,
          gst: null,
          depreciationPercent: null,
          coveredAreaSqft: null,
          rentRatePerSqft: null,
        });
      }
    }
  }
}
