import { prisma } from "@/lib/db";
import { pendingEntryWhere } from "@/lib/entry-approval";
import { enrichExpenseElectricityReadings } from "@/lib/electricity-readings-enrich";
import { resolveCanonicalWritePlantId } from "@/lib/plant-merge";

export async function loadPendingApprovalRows(
  scopedPlantIds: string[],
  fromDate?: Date,
  toDate?: Date,
) {
  const pendingWhere = {
    plantId: { in: scopedPlantIds },
    ...pendingEntryWhere(fromDate, toDate),
  };

  const [purchases, sales, stocks, expenses] = await Promise.all([
    prisma.purchase.findMany({
      where: pendingWhere,
      include: {
        plant: { select: { name: true, code: true } },
        enteredBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.sale.findMany({
      where: pendingWhere,
      include: {
        plant: { select: { name: true, code: true } },
        enteredBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.stockEntry.findMany({
      where: pendingWhere,
      include: {
        plant: { select: { name: true, code: true } },
        enteredBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.pettyCashEntry.findMany({
      where: {
        ...pendingWhere,
        entryType: { in: ["EXPENSE", "PETTY_CASH"] },
      },
      include: {
        plant: { select: { name: true, code: true } },
        enteredBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const expensesByPlant = new Map<string, typeof expenses>();
  for (const e of expenses) {
    const list = expensesByPlant.get(e.plantId) ?? [];
    list.push(e);
    expensesByPlant.set(e.plantId, list);
  }
  const enrichedExpenses: typeof expenses = [];
  for (const [plantId, rows] of expensesByPlant) {
    const writePlantId = await resolveCanonicalWritePlantId(plantId);
    enrichedExpenses.push(
      ...(await enrichExpenseElectricityReadings(writePlantId, rows)),
    );
  }

  return { purchases, sales, stocks, expenses: enrichedExpenses };
}