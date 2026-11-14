import { INCOME_TAX_RATE, round2 } from "./helpers";
import type { DynamicInputs } from "./dynamic-query";
import { computeSalesBuckets } from "./dynamic-compute-sales";
import { computePurchaseStock } from "./dynamic-compute-stock";
import { computePettyExpenseTotals } from "./dynamic-compute-petty";

export function computeDynamicTotals(
  data: DynamicInputs,
  plantCode?: string | null,
) {
  const sales = computeSalesBuckets(data);
  const stock = computePurchaseStock(data, sales.salesRevenue);
  const petty = computePettyExpenseTotals(data, plantCode, data.periodDays);

  const cogs = round2(
    stock.openingStock + stock.totalPurchases + petty.directExpenses - stock.closingStock,
  );
  const grossProfit = round2(sales.salesRevenue - cogs);
  const profitBeforeTax = round2(
    grossProfit -
      petty.rent -
      petty.pettyCashExp -
      petty.supervisorSalary -
      petty.miscellaneousExpense -
      petty.depreciation -
      petty.financialCost,
  );
  const incomeTax =
    profitBeforeTax > 0 ? round2(profitBeforeTax * INCOME_TAX_RATE) : 0;
  const netProfit = round2(profitBeforeTax - incomeTax);

  return {
    ...sales,
    ...stock,
    ...petty,
    cogs,
    grossProfit,
    profitBeforeTax,
    incomeTax,
    netProfit,
  };
}

export type DynamicTotals = ReturnType<typeof computeDynamicTotals>;