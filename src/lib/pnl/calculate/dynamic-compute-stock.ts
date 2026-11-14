import { isAtclPurchase } from "@/lib/plant-catalogs";
import { round2, toNumber } from "./helpers";
import type { DynamicInputs } from "./dynamic-query";

export function computePurchaseStock(data: DynamicInputs, salesRevenue: number) {
  const {
    purchaseRowsScoped,
    openingStockRaw,
    closingStockRaw,
    openingStockManualRaw,
  } = data;

  const vendorPurchaseRowsScoped = purchaseRowsScoped.filter((row) => !isAtclPurchase(row));
  const atclPurchaseRowsScoped = purchaseRowsScoped.filter((row) => isAtclPurchase(row));
  const purchases = round2(
    vendorPurchaseRowsScoped.reduce((sum, row) => sum + toNumber(row.basicValue), 0),
  );
  const stockFromAtclPurchases = round2(
    atclPurchaseRowsScoped.reduce((sum, row) => sum + toNumber(row.basicValue), 0),
  );
  const stockFromAtcl = stockFromAtclPurchases;
  const totalPurchases = round2(purchases + stockFromAtcl);
  const openingStockSnap = round2(openingStockManualRaw);
  const openingStock =
    openingStockSnap > 0
      ? openingStockSnap
      : totalPurchases > 0 || salesRevenue > 0
        ? round2(openingStockRaw)
        : 0;
  const closingStockSnap = round2(closingStockRaw);
  const closingStock =
    closingStockSnap > 0
      ? closingStockSnap
      : openingStock > 0 || totalPurchases > 0 || salesRevenue > 0
        ? Math.max(0, round2(openingStock + totalPurchases - salesRevenue))
        : stockFromAtclPurchases > 0
          ? closingStockSnap
          : 0;

  return {
    purchases,
    stockFromAtcl,
    totalPurchases,
    openingStock,
    closingStock,
  };
}