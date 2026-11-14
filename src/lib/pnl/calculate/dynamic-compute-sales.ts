import { getSaleCategory } from "@/lib/pnl/sales-category";
import { round2, toNumber } from "./helpers";
import type { DynamicInputs } from "./dynamic-query";

export function computeSalesBuckets(data: DynamicInputs) {
  const { salesAgg, salesRows } = data;
  let salesToCustomer = 0;
  let freightOnSale = 0;
  let inspectionCharge = 0;
  let interestIncome = 0;

  for (const s of salesRows || []) {
    const val = toNumber(s.salesValue);
    const cat = getSaleCategory(s);
    if (cat === "FREIGHT") freightOnSale = round2(freightOnSale + val);
    else if (cat === "INSPECTION") inspectionCharge = round2(inspectionCharge + val);
    else if (cat === "INTEREST") interestIncome = round2(interestIncome + val);
    else salesToCustomer = round2(salesToCustomer + val);
  }

  const aggregatedSales = round2(toNumber(salesAgg._sum.salesValue));
  const totalSales = round2(
    salesToCustomer + freightOnSale + inspectionCharge + interestIncome,
  );
  const salesRevenue = totalSales > 0 ? totalSales : aggregatedSales;
  if (
    salesToCustomer === 0 &&
    freightOnSale === 0 &&
    inspectionCharge === 0 &&
    interestIncome === 0
  ) {
    salesToCustomer = salesRevenue;
  }

  return {
    salesRevenue,
    salesToCustomer,
    freightOnSale,
    inspectionCharge,
    interestIncome,
  };
}