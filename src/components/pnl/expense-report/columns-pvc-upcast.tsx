import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import {
  normalizeUpcastExpenseHead,
  pvcExpensePnlLine,
  upcastExpensePnlLine,
} from "@/lib/plant-catalogs";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import {
  electricityUnitsKwh,
  isElectricityExpenseHead,
} from "@/lib/electricity-readings";
import { isoDate, totalAmount } from "@/components/pnl/expense-report/format";
import type { ExpenseRow } from "@/components/pnl/expense-report/types";
import type { ExpenseColumnOpts } from "./expense-column-types";

export function buildPvcUpcastExpenseColumns(
  opts: ExpenseColumnOpts,
): ReportColumn<ExpenseRow>[] {
  const { page, pageSize, upcast, t, tCommon } = opts;
  return [
    {
      key: "s",
      label: "S.No",
      compact: true,
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    { key: "date", label: t("date"), render: (r) => isoDate(r.date) },
    {
      key: "head",
      label: t("category"),
      render: (r) =>
        upcast ? normalizeUpcastExpenseHead(r.expenseHead) : r.expenseHead,
    },
    {
      key: "pnlLine",
      label: "P&L Line",
      wrap: true,
      render: (r) =>
        upcast
          ? upcastExpensePnlLine(r.expenseHead)
          : pvcExpensePnlLine(r.expenseHead),
    },
    {
      key: "desc",
      label: t("remarksNotes"),
      wrap: "wide",
      render: (r) => r.description || tCommon("dash"),
    },
    {
      key: "opening",
      label: "Opening",
      align: "right",
      render: (r) =>
        isElectricityExpenseHead(r.expenseHead) &&
        r.openingReading != null &&
        r.openingReading !== ""
          ? Number(r.openingReading).toLocaleString("en-IN")
          : tCommon("dash"),
    },
    {
      key: "closing",
      label: "Closing",
      align: "right",
      render: (r) =>
        isElectricityExpenseHead(r.expenseHead) &&
        r.closingReading != null &&
        r.closingReading !== ""
          ? Number(r.closingReading).toLocaleString("en-IN")
          : tCommon("dash"),
    },
    {
      key: "units",
      label: "Units (kWh)",
      align: "right",
      render: (r) => {
        if (!isElectricityExpenseHead(r.expenseHead)) {
          return tCommon("dash");
        }
        const units = electricityUnitsKwh(
          r.openingReading,
          r.closingReading,
        );
        return units == null
          ? tCommon("dash")
          : units.toLocaleString("en-IN");
      },
    },
    {
      key: "amount",
      label: t("amount"),
      align: "right",
      render: (r) => formatINR(totalAmount(r)),
    },
    {
      key: "excelUploadedAt",
      label: "Excel upload",
      compact: true,
      render: (r) =>
        r.excelUploadedAt ? formatDayMonthYear(r.excelUploadedAt) : "—",
    },
    {
      key: "approvedByHead",
      label: "Approval Status",
      compact: true,
      render: (r) => <PnlApprovalBadge row={r} level="head" />,
    },
    {
      key: "photos",
      label: "Bill",
      compact: true,
      render: (r) => (
        <BillPhotosCell
          urls={r.billPhotoUrls}
          fallbackUrl={r.billPhotoUrl}
        />
      ),
    },
  ];
}