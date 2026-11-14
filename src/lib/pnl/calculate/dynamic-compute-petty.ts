import { PettyCashKind } from "@prisma/client";
import {
  expenseSectionForPlant,
  normalizeUpcastExpenseHead,
  upcastEntryHead,
} from "@/lib/plant-catalogs";
import { round2, toNumber } from "./helpers";
import type { DynamicInputs } from "./dynamic-query";

export function computePettyExpenseTotals(
  data: DynamicInputs,
  plantCode: string | null | undefined,
  periodDays: number,
) {
  const { pettyEntries, fixedAssets, manpowerAgg } = data;
  const isUpcast = plantCode?.toUpperCase() === "UPCAST";

  const electricity = pettyHeadSum(pettyEntries, "Electricity", true);
  const rent = pettyHeadSum(pettyEntries, "Factory Rent", false);
  const unloadingExpense = round2(
    pettyEntries
      .filter(
        (r) => /unloading/i.test(r.expenseHead.trim()) && toNumber(r.amount) > 0,
      )
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );

  const emptyUpcastMisc = {
    upcastMiscDirectTotals: {} as Record<string, number>,
    upcastMiscDirectTotal: 0,
    depreciation: 0,
  };
  const upcastMisc: {
    upcastMiscDirectTotals: Record<string, number>;
    upcastMiscDirectTotal: number;
    depreciation: number;
  } = isUpcast ? computeUpcastMisc(pettyEntries) : emptyUpcastMisc;

  const pettyCashExp = isUpcast
    ? 0
    : round2(
        pettyEntries
          .filter((r) => r.entryType === PettyCashKind.PETTY_CASH)
          .reduce((sum, row) => sum + toNumber(row.amount), 0),
      );

  const contractorSalary = computeContractorSalary(pettyEntries, isUpcast);
  const supervisorSalary = computeSupervisorSalary(pettyEntries, isUpcast);
  const otherDirectExpense = isUpcast ? 0 : computeOtherDirect(pettyEntries, plantCode);
  const miscellaneousExpense = isUpcast ? 0 : computeMiscExpense(pettyEntries);
  const financialCost = round2(
    pettyEntries.reduce((sum, row) => {
      const head = upcastEntryHead(row.expenseHead || "", row.nature);
      if (head !== "Financial Cost") return sum;
      const amt = toNumber(row.amount);
      return amt > 0 ? sum + amt : sum;
    }, 0),
  );

  let depreciation = upcastMisc.depreciation;
  if (!isUpcast) {
    depreciation = round2(
      fixedAssets.reduce((sum, asset) => {
        const annual =
          toNumber(asset.cost) * (toNumber(asset.depreciationPercent) / 100);
        return sum + (annual * periodDays) / 365;
      }, 0),
    );
  }

  const manpower = round2(toNumber(manpowerAgg._sum.totalCost)) + contractorSalary;
  const directExpenses = round2(
    electricity +
      unloadingExpense +
      manpower +
      otherDirectExpense +
      (isUpcast ? upcastMisc.upcastMiscDirectTotal : 0),
  );

  return {
    electricity,
    rent,
    unloadingExpense,
    isUpcast,
    upcastMiscDirectTotals: upcastMisc.upcastMiscDirectTotals,
    upcastMiscDirectTotal: upcastMisc.upcastMiscDirectTotal,
    pettyCashExp,
    otherDirectExpense,
    miscellaneousExpense,
    manpower,
    directExpenses,
    financialCost,
    depreciation,
    supervisorSalary,
  };
}

function pettyHeadSum(
  rows: DynamicInputs["pettyEntries"],
  head: string,
  allowPayModeElectricity: boolean,
) {
  return round2(
    rows.reduce((sum, row) => {
      const normalized = normalizeUpcastExpenseHead(row.expenseHead || row.nature || "");
      const pay = row.payMode.trim().toLowerCase();
      const matches =
        normalized === head || (allowPayModeElectricity && pay === "electricity");
      if (!matches) return sum;
      const amt = toNumber(row.amount);
      return amt > 0 ? sum + amt : sum;
    }, 0),
  );
}

function computeUpcastMisc(rows: DynamicInputs["pettyEntries"]) {
  const upcastMiscDirectTotals: Record<string, number> = {};
  let depreciation = 0;
  for (const row of rows) {
    const head = upcastEntryHead(row.expenseHead || "", row.nature);
    const amt = toNumber(row.amount);
    if (!(amt > 0) || !head) continue;
    if (
      head === "Fuel & Power" ||
      head === "Electricity" ||
      head === "Unloading of MT" ||
      head === "Factory Rent" ||
      head === "Salary Expenses" ||
      head === "Contractor Wages" ||
      head === "FAR" ||
      head === "Financial Cost"
    ) {
      continue;
    }
    if (head === "Depreciation") {
      depreciation = round2(depreciation + amt);
      continue;
    }
    upcastMiscDirectTotals[head] = round2((upcastMiscDirectTotals[head] ?? 0) + amt);
  }
  const upcastMiscDirectTotal = round2(
    Object.values(upcastMiscDirectTotals).reduce((s, n) => s + n, 0),
  );
  return { upcastMiscDirectTotals, upcastMiscDirectTotal, depreciation };
}

function computeContractorSalary(rows: DynamicInputs["pettyEntries"], isUpcast: boolean) {
  return round2(
    rows.reduce((sum, row) => {
      const head = normalizeUpcastExpenseHead(row.expenseHead || "");
      const fromField = toNumber(row.contractorSalary);
      if (fromField > 0) return sum + fromField;
      if (isUpcast && head === "Contractor Wages" && toNumber(row.amount) > 0) {
        return sum + toNumber(row.amount);
      }
      return sum;
    }, 0),
  );
}

function computeSupervisorSalary(rows: DynamicInputs["pettyEntries"], isUpcast: boolean) {
  return round2(
    rows.reduce((sum, row) => {
      const rawHead = row.expenseHead || row.nature || "";
      const head = normalizeUpcastExpenseHead(rawHead);
      const fromField = toNumber(row.supervisorSalary);
      if (fromField > 0) return sum + fromField;
      const amt = toNumber(row.amount);
      if (!(amt > 0)) return sum;
      if (isUpcast) return head === "Salary Expenses" ? sum + amt : sum;
      if (/salary/i.test(rawHead)) return sum + amt;
      return sum;
    }, 0),
  );
}

function computeOtherDirect(
  rows: DynamicInputs["pettyEntries"],
  plantCode: string | null | undefined,
) {
  return round2(
    rows.reduce((sum, row) => {
      const rawHead = (row.expenseHead || row.nature || "").trim();
      const amt = toNumber(row.amount);
      if (!(amt > 0)) return sum;
      if (/salary|electric|fuel|unload|labour|contractor|rent|far|financial|misc|petty/i.test(rawHead)) {
        return sum;
      }
      if (expenseSectionForPlant(plantCode, rawHead) !== "direct") return sum;
      return sum + amt;
    }, 0),
  );
}

function computeMiscExpense(rows: DynamicInputs["pettyEntries"]) {
  return round2(
    rows.reduce((sum, row) => {
      const rawHead = (row.expenseHead || row.nature || "").trim();
      const amt = toNumber(row.amount);
      if (!(amt > 0)) return sum;
      if (!/misc/i.test(rawHead)) return sum;
      return sum + amt;
    }, 0),
  );
}