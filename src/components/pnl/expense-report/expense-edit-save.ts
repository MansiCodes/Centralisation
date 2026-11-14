import {
  electricityUnitsKwh,
  isElectricityExpenseHead,
} from "@/lib/electricity-readings";
import { postJson } from "@/lib/client-forms";

type CrudLike = {
  values: Record<string, string>;
  photoUrls: string[];
  save: (payload: Record<string, unknown>) => void;
};

export function saveExpenseEdit(
  crud: CrudLike,
  plantId: string,
  isPettyCategory: boolean,
) {
  const head = (crud.values.expenseHead || "").trim();
  const isElec = isElectricityExpenseHead(head);
  const month =
    crud.values.month?.trim() ||
    (crud.values.date || "").slice(0, 7);
  const dayPart = (crud.values.date || "").slice(8, 10) || "01";
  const date = isElec && month ? `${month}-${dayPart}` : crud.values.date;
  const opening = crud.values.openingReading
    ? Number(crud.values.openingReading)
    : null;
  const closing = crud.values.closingReading
    ? Number(crud.values.closingReading)
    : null;
  const rate = Number(crud.values.rate) || 0;
  const units = electricityUnitsKwh(opening, closing);
  const amount =
    isElec && units != null && rate > 0
      ? Math.round(units * rate * 100) / 100
      : Number(crud.values.amount || 0);
  const isWageHead =
    head === "Contractor Wages" || head === "Labour Contractor";
  const isSalaryHead = head === "Salary Expenses";
  const contractorSalary = isPettyCategory
    ? Number(crud.values.contractorSalary || 0)
    : isWageHead || isSalaryHead
      ? 0
      : Number(crud.values.contractorSalary || 0);
  const supervisorSalary = isPettyCategory
    ? Number(crud.values.supervisorSalary || 0)
    : isWageHead || isSalaryHead
      ? 0
      : Number(crud.values.supervisorSalary || 0);

  void (async () => {
    if (isElec && month) {
      await postJson(`/api/plants/${plantId}/electricity`, {
        month,
        openingReading: opening,
        closingReading: closing,
        consumedUnits: units,
        billAmount: amount,
        notes: crud.values.description || null,
        dailyDate: date,
        shift: crud.values.shift || "DAY",
        expenseHead: head,
        payMode: crud.values.payMode || "Cash",
      });
    }
    void crud.save({
      date,
      expenseHead: crud.values.expenseHead,
      expenseName: crud.values.expenseName || null,
      description: crud.values.description || null,
      amount,
      payMode: crud.values.payMode || undefined,
      nature: isElec ? null : crud.values.nature || null,
      location: isElec ? null : crud.values.location || null,
      billNumber: isElec ? null : crud.values.billNumber || null,
      contractorSalary,
      supervisorSalary,
      openingReading: opening,
      closingReading: closing,
      billPhotoUrls: crud.photoUrls,
    });
  })();
}