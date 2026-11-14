import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import { cat6ExpensePnlLine } from "@/lib/plant-catalogs";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import { formatMonth, totalAmount } from "@/components/pnl/expense-report/format";
import type { ExpenseRow } from "@/components/pnl/expense-report/types";
import type { ExpenseColumnOpts } from "./expense-column-types";

export function buildCat6ExpenseColumns(
  opts: ExpenseColumnOpts,
): ReportColumn<ExpenseRow>[] {
  const { page, pageSize, t, tCommon } = opts;
  return [
    {
      key: "s",
      label: "S.No",
      compact: true,
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    {
      key: "month",
      label: "Months",
      render: (r) => formatMonth(r.date),
    },
    {
      key: "head",
      label: t("category"),
      render: (r) => r.expenseHead,
    },
    {
      key: "pnl",
      label: "P&L Line",
      wrap: true,
      render: (r) => cat6ExpensePnlLine(r.expenseHead),
    },
    {
      key: "desc",
      label: "Remarks",
      wrap: "wide",
      render: (r) => r.description || tCommon("dash"),
    },
    {
      key: "amount",
      label: "Salary Amt",
      align: "right",
      render: (r) => formatINR(totalAmount(r)),
    },
    {
      key: "excelUploadedAt",
      label: "Excel upload",
      compact: true,
      render: (r: ExpenseRow) =>
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