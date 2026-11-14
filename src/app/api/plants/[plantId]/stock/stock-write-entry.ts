import { prisma } from "@/lib/db";
import type { stockEntryCreateData } from "./stock-amounts";

export async function writeStockEntry(
  db: {
    stockEntry: {
      findFirst: typeof prisma.stockEntry.findFirst;
      create: typeof prisma.stockEntry.create;
      update: typeof prisma.stockEntry.update;
    };
  },
  payload: ReturnType<typeof stockEntryCreateData>,
) {
  const existing = await db.stockEntry.findFirst({
    where: {
      plantId: payload.plantId,
      date: payload.date,
      shift: payload.shift,
      itemName: payload.itemName,
      category: payload.category,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!existing) return db.stockEntry.create({ data: payload });
  return db.stockEntry.update({
    where: { id: existing.id },
    data: {
      quantity: payload.quantity,
      rate: payload.rate,
      closingValue: payload.closingValue,
      notes: payload.notes,
      unit: payload.unit,
      category: payload.category,
      photoUrl: payload.photoUrl,
      photoUrls: payload.photoUrls,
      isBackdated: payload.isBackdated,
    },
  });
}