import { isAtclPurchase } from "@/lib/plant-catalogs";
import { round2, toNumber } from "./helpers";
import type { PvcQueryInputs } from "./pvc-query";

export function computePvcStockTotals(data: Pick<PvcQueryInputs, "salesAgg" | "purchaseRows" | "openingStockRaw" | "closingStockRaw">) {
  const salesRevenue = round2(toNumber(data.salesAgg._sum.salesValue));
  const vendorPurchaseRows = data.purchaseRows.filter((row) => !isAtclPurchase(row));
  const atclPurchaseRows = data.purchaseRows.filter((row) => isAtclPurchase(row));
  const purchasesRaw = vendorPurchaseRows.reduce(
    (sum, row) => sum + toNumber(row.basicValue),
    0,
  );
  const purchases = Math.round(purchasesRaw * 100) / 100;
  const stockFromAtclPurchases = round2(
    atclPurchaseRows.reduce((sum, row) => sum + toNumber(row.basicValue), 0),
  );
  const stockFromAtcl = stockFromAtclPurchases;
  const totalPurchases = round2(purchasesRaw + stockFromAtcl);
  const openingStock = round2(data.openingStockRaw);
  const closingStockSnapshot = round2(data.closingStockRaw);
  const closingStock = closingStockSnapshot > 0
    ? closingStockSnapshot
    : (openingStock > 0 || totalPurchases > 0 || salesRevenue > 0)
      ? Math.max(0, round2(openingStock + totalPurchases - salesRevenue))
      : (stockFromAtclPurchases > 0 ? closingStockSnapshot : 0);

  return {
    salesRevenue,
    purchasesRaw,
    purchases,
    stockFromAtcl,
    totalPurchases,
    openingStock,
    closingStock,
  };
}