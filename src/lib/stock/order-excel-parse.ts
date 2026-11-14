import ExcelJS from "exceljs";
import { cellVal, normHeader, num } from "@/lib/pnl/excel-import/cells";
import type { ParseStockOrdersResult } from "@/lib/stock/order-excel-types";
import { findCol, findDoneCol } from "./order-excel-columns";
import { cellStr, formatDelivery } from "./order-excel-delivery";
import { matchCableAndSize, qtyToKm } from "./order-excel-match";
import { addLine, isCarryParty, isJunkRow } from "./order-excel-row-helpers";

export async function parseStockOrdersExcel(
  buffer: ArrayBuffer | Buffer,
): Promise<ParseStockOrdersResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as never);

  const byKey: Record<string, import("@/lib/stock/order-excel-types").StockOrderBySize> = {};
  const unmatched = new Set<string>();
  let matchedRows = 0;
  let skippedRows = 0;
  let hasDoneColumn = false;

  for (const sheet of wb.worksheets) {
    if (!sheet || sheet.state === "hidden" || sheet.state === "veryHidden") {
      continue;
    }

    let headerRow = 0;
    let colMap = new Map<string, number>();
    for (let r = 1; r <= Math.min(12, sheet.rowCount || 12); r++) {
      const row = sheet.getRow(r);
      const map = new Map<string, number>();
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const h = normHeader(cellVal(cell));
        if (h) map.set(h, col);
      });
      const hasSize =
        findCol(map, ["size", "cable size", "size of cable"]) != null;
      const hasQty =
        findCol(map, [
          "qty",
          "qty.",
          "quantity",
          "po qty",
          "po (qty)",
          "order qty",
        ]) != null;
      if (hasSize && hasQty) {
        headerRow = r;
        colMap = map;
        break;
      }
    }
    if (!headerRow) continue;

    const sizeCol = findCol(colMap, [
      "size",
      "cable size",
      "size of cable",
    ])!;
    const qtyCol = findCol(colMap, [
      "qty",
      "qty.",
      "quantity",
      "po qty",
      "po (qty)",
      "order qty",
      "order in hand",
    ])!;
    const uomCol = findCol(colMap, ["uom", "unit", "units"]);
    const partyCol =
      findCol(colMap, ["party name"]) ??
      findCol(colMap, ["party"]) ??
      findCol(colMap, ["consignee", "customer", "customer name"]);
    const deliveryCol = findCol(colMap, [
      "delivery date",
      "delivery period",
      "delivery",
      "del date",
      "due date",
    ]);
    const doneCol = findDoneCol(colMap);
    if (doneCol != null) hasDoneColumn = true;

    const last = Math.min(sheet.rowCount || headerRow, headerRow + 5000);
    let lastParty = "";
    let lastUom = "";
    for (let r = headerRow + 1; r <= last; r++) {
      const row = sheet.getRow(r);
      const sizeRaw = cellStr(row, sizeCol);
      let partyName = partyCol ? cellStr(row, partyCol) : "";
      if (isCarryParty(partyName)) partyName = lastParty;
      else lastParty = partyName.trim();
      if (isJunkRow(sizeRaw, partyName)) {
        skippedRows += 1;
        continue;
      }
      const qtyRaw = num(cellVal(row.getCell(qtyCol)));
      if (qtyRaw == null || qtyRaw <= 0) {
        skippedRows += 1;
        continue;
      }
      let uom = uomCol ? cellStr(row, uomCol) : "";
      if (!uom.trim() && lastUom) uom = lastUom;
      else if (uom.trim()) lastUom = uom;
      const qtyKm = qtyToKm(qtyRaw, uom);
      if (qtyKm <= 0) {
        skippedRows += 1;
        continue;
      }
      const deliveryPeriod = deliveryCol
        ? formatDelivery(cellVal(row.getCell(deliveryCol)))
        : null;
      let doneKm = 0;
      if (doneCol != null) {
        const doneRaw = num(cellVal(row.getCell(doneCol)));
        if (doneRaw != null && doneRaw >= 0) {
          doneKm = qtyToKm(doneRaw, uom);
        }
      }

      const matched = matchCableAndSize(sizeRaw);
      if (!matched) {
        unmatched.add(sizeRaw);
        skippedRows += 1;
        continue;
      }

      addLine(byKey, matched, {
        partyName,
        qty: qtyKm,
        done: doneKm,
        deliveryPeriod,
      });
      matchedRows += 1;
    }
  }

  return {
    byKey,
    matchedRows,
    unmatchedSizes: [...unmatched].sort((a, b) => a.localeCompare(b)),
    skippedRows,
    hasDoneColumn,
  };
}