import {
  INCOME_TAX_RATE,
  PVC_INCOME_TAX_BASE,
  round2,
  round4,
  toNumber,
} from "./helpers";
import type { PvcQueryInputs } from "./pvc-query";
import { computePvcStockTotals } from "./pvc-compute-stock";
import {
  sumContractorSalary,
  sumElectricityFromPetty,
  sumFinancialCost,
  sumMiscellaneousExpense,
  sumOtherDirectExpense,
  sumPettyCashExp,
  sumRentFromPetty,
  sumSupervisorSalary,
  sumTransportExpense,
  sumUnloadingExpense,
} from "./pvc-petty-totals";

function computePvcUtilityTotals(
  electricityRows: PvcQueryInputs["electricityRows"],
  pettyEntries: PvcQueryInputs["pettyEntries"],
) {
  const electricityRentAmount = round2(
    electricityRows.reduce((sum, row) => sum + toNumber(row.billAmount), 0),
  );
  const rentFromElectricityRent = round2(
    electricityRows.reduce((sum, row) => sum + toNumber(row.rentAmount), 0),
  );
  const electricity = round2(
    electricityRentAmount + sumElectricityFromPetty(pettyEntries),
  );
  const rentFromPettyCash = sumRentFromPetty(pettyEntries);
  const rent =
    rentFromElectricityRent > 0 ? rentFromElectricityRent : rentFromPettyCash;
  return { electricity, rent };
}

function computePvcPettyTotals(pettyEntries: PvcQueryInputs["pettyEntries"]) {
  const unloadingExpense = sumUnloadingExpense(pettyEntries);
  const financialCost = sumFinancialCost(pettyEntries);
  const contractorSalary = sumContractorSalary(pettyEntries);
  const supervisorSalary = sumSupervisorSalary(pettyEntries);
  const pettyCashExp = sumPettyCashExp(pettyEntries);
  const otherDirectExpense = sumOtherDirectExpense(pettyEntries);
  const transportExpense = sumTransportExpense(pettyEntries);
  const miscellaneousExpense = sumMiscellaneousExpense(pettyEntries);
  const otherIndirectExpense = round2(transportExpense + miscellaneousExpense);
  return {
    unloadingExpense,
    financialCost,
    contractorSalary,
    supervisorSalary,
    pettyCashExp,
    otherDirectExpense,
    transportExpense,
    miscellaneousExpense,
    otherIndirectExpense,
  };
}

function computePvcDepreciation(
  fixedAssets: PvcQueryInputs["fixedAssets"],
  pvcFarMonths: number,
) {
  return round4(
    fixedAssets.reduce((sum, asset) => {
      const annual =
        toNumber(asset.cost) * (toNumber(asset.depreciationPercent) / 100);
      return sum + (annual * pvcFarMonths) / 12;
    }, 0),
  );
}

export function computePvcTotals(data: PvcQueryInputs) {
  const stock = computePvcStockTotals(data);
  const utility = computePvcUtilityTotals(data.electricityRows, data.pettyEntries);
  const petty = computePvcPettyTotals(data.pettyEntries);
  const manpower = petty.contractorSalary;
  const directExpenses = round2(
    utility.electricity + petty.unloadingExpense + manpower + petty.otherDirectExpense,
  );
  const cogs = round2(stock.openingStock + stock.totalPurchases + directExpenses - stock.closingStock);
  const grossProfit = round2(
    stock.salesRevenue + stock.closingStock - stock.openingStock - stock.purchasesRaw - stock.stockFromAtcl - directExpenses,
  );
  const depreciation = computePvcDepreciation(data.fixedAssets, data.pvcFarMonths);
  const profitBeforeTax = round2(
    grossProfit -
      utility.rent -
      petty.pettyCashExp -
      petty.supervisorSalary -
      depreciation -
      petty.financialCost -
      petty.otherIndirectExpense,
  );
  const incomeTax = profitBeforeTax > 0 ? round2(PVC_INCOME_TAX_BASE * INCOME_TAX_RATE) : 0;
  const netProfit = round2(profitBeforeTax - incomeTax);

  return {
    salesRevenue: stock.salesRevenue,
    cogs,
    manpower,
    electricity: utility.electricity,
    rent: utility.rent,
    pettyCashExp: petty.pettyCashExp,
    depreciation,
    grossProfit,
    netProfit,
    openingStock: stock.openingStock,
    closingStock: stock.closingStock,
    purchases: stock.purchases,
    stockFromAtcl: stock.stockFromAtcl,
    totalPurchases: stock.totalPurchases,
    unloadingExpense: petty.unloadingExpense,
    incomeTax,
    profitBeforeTax,
    financialCost: petty.financialCost,
    supervisorSalary: petty.supervisorSalary,
    otherDirectExpense: petty.otherDirectExpense,
    transportExpense: petty.transportExpense,
    miscellaneousExpense: petty.miscellaneousExpense,
  };
}