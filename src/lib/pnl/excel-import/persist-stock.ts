import { isBackdated, parseDateOnly } from "@/lib/dates";
import { round2, round4 } from "@/lib/pnl/excel-import/cells";
import { stockSourceKey } from "@/lib/pnl/excel-import/dedupe";
import type { ParsedPnlWorkbook } from "@/lib/pnl/excel-import/parse";
import { resolveQuadStockRow } from "@/lib/pnl/excel-import/persist-stock-quad";
import { approvalFor, type PersistCtx } from "@/lib/pnl/excel-import/persist-types";

export async function persistStock(
  ctx: PersistCtx,
  stock: ParsedPnlWorkbook["stock"],
) {
  const {
    prisma,
    writePlantId,
    enteredById,
    role,
    familyKey,
    pScope,
    uploadedAt,
    summary,
    seenKeys,
    daysToRefresh,
    markDuplicate,
  } = ctx;

  for (const row of stock) {
    const day = parseDateOnly(row.date);

    let quantity = round4(row.quantity);
    let notes = row.notes;
    let category = row.category;

    const quad = await resolveQuadStockRow(ctx, row, day, quantity);
    if (quad) {
      if ("skip" in quad) continue;
      quantity = quad.quantity;
      notes = quad.notes ?? notes;
      category = quad.category;
    }

    const keyed = { ...row, quantity };
    const sourceKey = stockSourceKey(familyKey, keyed);
    if (seenKeys.has(sourceKey)) {
      markDuplicate("Stock", row.row, "Duplicate row in this file");
      continue;
    }
    seenKeys.add(sourceKey);

    const existing = await prisma.stockEntry.findFirst({
      where: {
        ...pScope,
        OR: [
          { sourceKey },
          {
            date: day,
            itemName: row.itemName,
            quantity,
            rate: round4(row.rate),
          },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      markDuplicate("Stock", row.row, "Already uploaded");
      continue;
    }

    const closingValue = round2(quantity * row.rate);
    const approval = approvalFor(role, row.date);
    await prisma.stockEntry.create({
      data: {
        sourceKey,
        plantId: writePlantId,
        date: day,
        shift: row.shift,
        itemName: row.itemName,
        category,
        unit: row.unit,
        quantity,
        rate: round4(row.rate),
        closingValue,
        notes,
        enteredById,
        isBackdated: isBackdated(row.date),
        excelUploadedAt: uploadedAt,
        ...approval,
      },
    });
    summary.stock += 1;
    daysToRefresh.set(`${row.date}|${row.shift}`, row.shift);
  }
}