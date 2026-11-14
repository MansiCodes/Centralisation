import { prisma } from "@/lib/db";
import { atclStockEntryFilter } from "@/lib/plant-catalogs";
import { plantIdFilter } from "@/lib/plant-merge";
import {
  COGS_PURCHASE_TYPES,
  getApprovedFilter,
  monthStartsInRange,
} from "./helpers";
import { openingStockFromLastSnapshot, pvcClosingStockSnapshot } from "./stock";

export type PvcQueryInputs = Awaited<ReturnType<typeof fetchPvcInputs>>;

export async function fetchPvcInputs(
  plantIds: string[],
  from: Date,
  to: Date,
  scoped: boolean,
  enteredById?: string,
  approvedOnly?: boolean,
) {
  const byUser = enteredById ? { enteredById } : {};
  const months = monthStartsInRange(from, to);
  const pvcFarMonths = Math.max(
    1,
    months.filter(
      (m) =>
        (m.getUTCFullYear() === 2026 && m.getUTCMonth() >= 1) ||
        m.getUTCFullYear() > 2026,
    ).length,
  );

  const approvedFilter = await getApprovedFilter(plantIds, approvedOnly, from, to);
  const globalApprovedFilter = await getApprovedFilter(plantIds, approvedOnly);

  const [
    salesAgg,
    purchaseRows,
    stockInwardAgg,
    pettyEntries,
    electricityRows,
    fixedAssets,
    closingStockRaw,
    openingStockRaw,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        ...plantIdFilter(plantIds),
        ...byUser,
        date: { gte: from, lte: to },
        ...approvedFilter,
      },
      _sum: { salesValue: true },
    }),
    prisma.purchase.findMany({
      where: {
        ...plantIdFilter(plantIds),
        ...byUser,
        date: { gte: from, lte: to },
        type: { in: COGS_PURCHASE_TYPES },
        ...approvedFilter,
      },
      select: { quantity: true, basicValue: true, vendorName: true, notes: true },
    }),
    scoped
      ? Promise.resolve({ _sum: { closingValue: null } })
      : prisma.stockEntry.aggregate({
          where: {
            ...plantIdFilter(plantIds),
            date: { gte: from, lte: to },
            ...atclStockEntryFilter(),
            ...approvedFilter,
          },
          _sum: { closingValue: true },
        }),
    prisma.pettyCashEntry.findMany({
      where: {
        ...plantIdFilter(plantIds),
        ...byUser,
        date: { gte: from, lte: to },
        ...approvedFilter,
      },
      select: {
        entryType: true,
        amount: true,
        contractorSalary: true,
        supervisorSalary: true,
        expenseHead: true,
        payMode: true,
        description: true,
      },
    }),
    scoped
      ? Promise.resolve([])
      : prisma.electricityRent.findMany({
          where: { ...plantIdFilter(plantIds), month: { in: months } },
          select: { billAmount: true, rentAmount: true },
        }),
    scoped
      ? Promise.resolve([])
      : prisma.fixedAsset.findMany({
          where: { ...plantIdFilter(plantIds) },
          select: {
            cost: true,
            gst: true,
            invoiceValue: true,
            depreciationPercent: true,
          },
        }),
    scoped
      ? Promise.resolve(0)
      : pvcClosingStockSnapshot(plantIds, to, approvedOnly, globalApprovedFilter),
    scoped
      ? Promise.resolve(0)
      : openingStockFromLastSnapshot(plantIds, from, approvedOnly, globalApprovedFilter),
  ]);

  void stockInwardAgg;

  return {
    pettyEntries,
    salesAgg,
    purchaseRows,
    electricityRows,
    fixedAssets,
    closingStockRaw,
    openingStockRaw,
    pvcFarMonths,
  };
}