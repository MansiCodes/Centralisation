import { toYmd } from "@/components/pnl/EntryEditDrawer";
import { collectBillPhotoUrls } from "@/lib/bill-photos";
import { electricityUnitsKwh } from "@/lib/electricity-readings";
import type { ExpenseRow } from "./types";

type CrudOpen = {
  openEdit: (
    row: ExpenseRow,
    values: Record<string, string>,
    photos: string[],
  ) => void;
};

export function openExpenseRowEdit(crud: CrudOpen, r: ExpenseRow) {
  const ymd = toYmd(r.date);
  const opening =
    r.openingReading == null ? "" : String(r.openingReading);
  const closing =
    r.closingReading == null ? "" : String(r.closingReading);
  const amountNum = Number(r.amount ?? 0);
  const units = electricityUnitsKwh(opening, closing);
  const rate =
    units != null && units > 0 && amountNum > 0
      ? String(Math.round((amountNum / units) * 10000) / 10000)
      : "";
  crud.openEdit(
    r,
    {
      date: ymd,
      month: ymd.slice(0, 7),
      expenseHead: r.expenseHead ?? "",
      expenseName: r.expenseName ?? "",
      description: r.description ?? "",
      amount: String(r.amount ?? ""),
      rate,
      contractorSalary: String(r.contractorSalary ?? "0"),
      supervisorSalary: String(r.supervisorSalary ?? "0"),
      payMode: r.payMode ?? "Cash",
      nature: r.nature ?? "",
      location: r.location ?? "",
      billNumber: r.billNumber ?? "",
      openingReading: opening,
      closingReading: closing,
      shift: r.shift ?? "DAY",
    },
    collectBillPhotoUrls(r),
  );
}