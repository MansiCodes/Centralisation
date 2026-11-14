import { PettyCashKind } from "@prisma/client";
import { normalizePvcExpenseHead, pvcExpenseSection } from "@/lib/plant-catalogs";
import { round2, toNumber } from "./helpers";
import type { PvcQueryInputs } from "./pvc-query";

type PettyRow = PvcQueryInputs["pettyEntries"][number];

export function sumElectricityFromPetty(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter(
        (r) =>
          r.entryType === PettyCashKind.EXPENSE &&
          (r.expenseHead.trim().toLowerCase() === "electricity" ||
            r.expenseHead.trim().toLowerCase() === "fuel & power" ||
            r.payMode.trim().toLowerCase() === "electricity"),
      )
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumRentFromPetty(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter(
        (r) =>
          r.entryType === PettyCashKind.EXPENSE &&
          /rent/i.test(String(r.description ?? "")) &&
          toNumber(r.amount) > 0,
      )
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumUnloadingExpense(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter(
        (r) =>
          r.entryType === PettyCashKind.EXPENSE &&
          /unloading/i.test(r.expenseHead.trim()),
      )
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumFinancialCost(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter((r) => {
        const head = normalizePvcExpenseHead(r.expenseHead.trim());
        return (
          head === "Financial Cost" ||
          /^financial cost$/i.test(r.expenseHead.trim())
        );
      })
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumContractorSalary(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries.reduce((sum, row) => {
      const head = normalizePvcExpenseHead(row.expenseHead?.trim() || "");
      const isLabour =
        head === "Labour Contractor" ||
        /labour/i.test(row.expenseHead || "") ||
        /contractor/i.test(row.expenseHead || "");
      const fromField = toNumber(row.contractorSalary);
      if (fromField > 0) return sum + fromField;
      if (isLabour && toNumber(row.amount) > 0) {
        return sum + toNumber(row.amount);
      }
      return sum;
    }, 0),
  );
}

export function sumSupervisorSalary(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries.reduce((sum, row) => {
      const head = normalizePvcExpenseHead(row.expenseHead?.trim() || "");
      const isSalary =
        head === "Salary Expenses" ||
        /salary/i.test(row.expenseHead || "");
      const fromField = toNumber(row.supervisorSalary);
      if (fromField > 0) return sum + fromField;
      if (isSalary && toNumber(row.amount) > 0) {
        return sum + toNumber(row.amount);
      }
      return sum;
    }, 0),
  );
}

export function sumPettyCashExp(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter((r) => {
        if (r.entryType !== PettyCashKind.PETTY_CASH) return false;
        const head = normalizePvcExpenseHead(r.expenseHead?.trim() || "");
        if (
          head === "Financial Cost" ||
          head === "Labour Contractor" ||
          head === "Salary Expenses" ||
          head === "Fuel & Power" ||
          head === "Factory Rent" ||
          /labour/i.test(r.expenseHead || "") ||
          /contractor/i.test(r.expenseHead || "") ||
          /salary/i.test(r.expenseHead || "")
        ) {
          return false;
        }
        return true;
      })
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumOtherDirectExpense(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter((r) => {
        if (r.entryType !== PettyCashKind.EXPENSE) return false;
        const head = normalizePvcExpenseHead(r.expenseHead?.trim() || "");
        if (
          head === "Fuel & Power" ||
          head === "Electricity" ||
          head === "Labour Contractor" ||
          /labour/i.test(r.expenseHead || "") ||
          /contractor/i.test(r.expenseHead || "") ||
          /unloading/i.test(head) ||
          /unloading/i.test(r.expenseHead || "")
        ) {
          return false;
        }
        return (
          head === "Expense" ||
          head === "Other" ||
          pvcExpenseSection(head) === "direct"
        );
      })
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumTransportExpense(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter((r) => {
        if (r.entryType !== PettyCashKind.EXPENSE) return false;
        const head = normalizePvcExpenseHead(r.expenseHead?.trim() || "");
        return head === "Transport" || /transport/i.test(r.expenseHead || "");
      })
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}

export function sumMiscellaneousExpense(pettyEntries: PettyRow[]) {
  return round2(
    pettyEntries
      .filter((r) => {
        if (r.entryType !== PettyCashKind.EXPENSE) return false;
        const head = normalizePvcExpenseHead(r.expenseHead?.trim() || "");
        if (
          head === "Petty Cash" ||
          head === "Salary Expenses" ||
          /salary/i.test(r.expenseHead || "") ||
          head === "Factory Rent" ||
          head === "Financial Cost" ||
          head === "FAR" ||
          head === "Depreciation" ||
          head === "Transport" ||
          /transport/i.test(r.expenseHead || "") ||
          pvcExpenseSection(head) === "direct"
        ) {
          return false;
        }
        return true;
      })
      .reduce((sum, row) => sum + toNumber(row.amount), 0),
  );
}