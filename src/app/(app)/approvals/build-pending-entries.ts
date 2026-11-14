import type { PendingEntryRow } from "@/components/dashboard/EntryApprovalsPanel";
import { getPlantDisplayName } from "@/lib/plant-segments";
import {
  formatElectricityApprovalDetail,
  isElectricityExpenseHead,
} from "@/lib/electricity-readings";
import { fmtQty, fmtRate, joinDetail, stockUserRemark } from "./approvals-format";

type PurchaseRow = {
  id: string;
  plantId: string;
  date: Date;
  shift: string | null;
  itemDescription: string;
  vendorName: string | null;
  quantity: unknown;
  unit: string | null;
  rate: unknown;
  billNumber: string | null;
  gstPercent: unknown;
  notes: string | null;
  invoiceValue: unknown;
  plant: { name: string; code: string };
  enteredBy: { name: string | null };
};

type SaleRow = {
  id: string;
  plantId: string;
  date: Date;
  shift: string | null;
  itemDescription: string;
  customerName: string | null;
  quantity: unknown;
  unit: string | null;
  rate: unknown;
  billNumber: string | null;
  notes: string | null;
  salesValue: unknown;
  plant: { name: string; code: string };
  enteredBy: { name: string | null };
};

type StockRow = {
  id: string;
  plantId: string;
  date: Date;
  shift: string | null;
  itemName: string;
  category: string | null;
  quantity: unknown;
  unit: string | null;
  rate: unknown;
  notes: string | null;
  closingValue: unknown;
  plant: { name: string; code: string };
  enteredBy: { name: string | null };
};

type ExpenseRow = {
  id: string;
  plantId: string;
  date: Date;
  shift: string | null;
  expenseHead: string;
  nature: string | null;
  openingReading: unknown;
  closingReading: unknown;
  payMode: string | null;
  location: string | null;
  billNumber: string | null;
  description: string | null;
  amount: unknown;
  contractorSalary: unknown;
  supervisorSalary: unknown;
  plant: { name: string; code: string };
  enteredBy: { name: string | null };
};

export function mapPurchasesToPending(purchases: PurchaseRow[]): PendingEntryRow[] {
  return purchases.map((p) => {
    const qty = Number(p.quantity);
    const rate = Number(p.rate);
    return {
      id: p.id,
      kind: "purchase" as const,
      plantId: p.plantId,
      date: p.date.toISOString(),
      shift: p.shift ?? "",
      plantName: getPlantDisplayName(p.plant.code, p.plant.name),
      enteredByName: p.enteredBy.name,
      label: p.itemDescription,
      detail: joinDetail([
        p.vendorName,
        Number.isFinite(qty)
          ? `${fmtQty(qty)} ${p.unit || ""}`.trim()
          : null,
        Number.isFinite(rate) && rate > 0 ? `@ ₹${fmtRate(rate)}` : null,
        p.billNumber?.trim() ? `Bill ${p.billNumber.trim()}` : null,
        Number(p.gstPercent) > 0 ? `GST ${Number(p.gstPercent)}%` : null,
      ]),
      remark: p.notes?.trim() || null,
      amount: Number(p.invoiceValue),
    };
  });
}

export function mapSalesToPending(sales: SaleRow[]): PendingEntryRow[] {
  return sales.map((s) => {
    const qty = Number(s.quantity);
    const rate = Number(s.rate);
    return {
      id: s.id,
      kind: "sale" as const,
      plantId: s.plantId,
      date: s.date.toISOString(),
      shift: s.shift ?? "",
      plantName: getPlantDisplayName(s.plant.code, s.plant.name),
      enteredByName: s.enteredBy.name,
      label: s.itemDescription,
      detail: joinDetail([
        s.customerName,
        Number.isFinite(qty)
          ? `${fmtQty(qty)} ${s.unit || ""}`.trim()
          : null,
        Number.isFinite(rate) && rate > 0 ? `@ ₹${fmtRate(rate)}` : null,
        s.billNumber?.trim() ? `Bill ${s.billNumber.trim()}` : null,
      ]),
      remark: s.notes?.trim() || null,
      amount: Number(s.salesValue),
    };
  });
}

export function mapStocksToPending(stocks: StockRow[]): PendingEntryRow[] {
  return stocks.map((s) => {
    const qty = Number(s.quantity);
    const rate = Number(s.rate);
    const unit = String(s.unit ?? "").trim() || "kg";
    const note = String(s.notes ?? "");
    const entryKind = note.startsWith("Closing stock")
      ? "Closing stock"
      : note.startsWith("Issued quantity")
        ? "Issued quantity"
        : null;
    return {
      id: s.id,
      kind: "stock" as const,
      plantId: s.plantId,
      date: s.date.toISOString(),
      shift: s.shift ?? "",
      plantName: getPlantDisplayName(s.plant.code, s.plant.name),
      enteredByName: s.enteredBy.name,
      label: s.itemName,
      detail: joinDetail([
        s.category ? String(s.category) : null,
        entryKind,
        Number.isFinite(qty) ? `${fmtQty(qty)} ${unit}` : unit,
        Number.isFinite(rate) && rate > 0 ? `@ ₹${fmtRate(rate)}` : null,
      ]),
      remark: stockUserRemark(s.notes) || null,
      amount: Number(s.closingValue),
    };
  });
}

export function mapExpensesToPending(expenses: ExpenseRow[]): PendingEntryRow[] {
  return expenses.map((e) => ({
    id: e.id,
    kind: "expense" as const,
    plantId: e.plantId,
    date: e.date.toISOString(),
    shift: e.shift ?? "",
    plantName: getPlantDisplayName(e.plant.code, e.plant.name),
    enteredByName: e.enteredBy.name,
    label: e.expenseHead,
    detail: joinDetail([
      isElectricityExpenseHead(e.expenseHead)
        ? formatElectricityApprovalDetail({
            nature: e.nature,
            openingReading: e.openingReading,
            closingReading: e.closingReading,
          })
        : e.nature,
      e.payMode?.trim() ? `Pay ${e.payMode.trim()}` : null,
      e.location?.trim() || null,
      e.billNumber?.trim() ? `Bill ${e.billNumber.trim()}` : null,
    ]),
    remark: e.description?.trim() || null,
    amount:
      Number(e.amount) +
      Number(e.contractorSalary) +
      Number(e.supervisorSalary),
  }));
}