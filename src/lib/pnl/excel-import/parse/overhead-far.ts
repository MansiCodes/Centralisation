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

export function parseFarSheet(
  wb: ExcelJS.Workbook,
  result: ParsedPnlWorkbook,
): void {
  const sheet = findSheet(wb, ["FAR", "Fixed Assets", "Fixed Asset"]);
  if (sheet) {
    const header = findHeaderRow(sheet, FAR_ALIASES);
    if (!header) {
      result.skipped.push({
        sheet: sheet.name,
        row: 0,
        reason: "No recognizable FAR header row",
      });
    } else {
      for (let r = header.row + 1; r <= sheet.rowCount; r++) {
        const vendor = str(getCell(sheet, r, header.map, "vendor"));
        const description = str(
          getCell(sheet, r, header.map, "description"),
        );
        const cost = num(getCell(sheet, r, header.map, "cost"));
        if (!vendor && !description && (cost == null || cost === 0)) continue;
        if (/\bTOTAL\b/i.test(vendor + description)) break;
        const billDate = asUtcDate(getCell(sheet, r, header.map, "billDate"));
        const dateRaw = resolveEntryDate(
          getCell(sheet, r, header.map, "date"),
          billDate,
          findSheetFallbackDate(sheet),
        );
        const dateFinal = dateRaw ?? todayUtc();
        const descFinal = description || vendor || "Fixed Asset";
        result.expenses.push({
          row: r,
          date: ymd(dateFinal),
          shift: ManpowerShift.DAY,
          target: "far",
          expenseHead: "FAR",
          nature: null,
          expenseName: null,
          description: descFinal,
          payMode: "Bank",
          amount: 0,
          contractorSalary: 0,
          supervisorSalary: 0,
          billNumber:
            str(getCell(sheet, r, header.map, "billNumber")) || null,
          openingReading: null,
          closingReading: null,
          vendor: vendor || null,
          cost: cost ?? 0,
          gst: num(getCell(sheet, r, header.map, "gst")),
          depreciationPercent: num(
            getCell(sheet, r, header.map, "depPercent"),
          ),
          coveredAreaSqft: null,
          rentRatePerSqft: null,
        });
      }
    }
  }
}
