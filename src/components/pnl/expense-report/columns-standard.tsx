import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import { isoDate, totalAmount } from "@/components/pnl/expense-report/format";
import type { ExpenseRow } from "@/components/pnl/expense-report/types";
import type { ExpenseColumnOpts } from "./expense-column-types";

export function buildStandardExpenseColumns(
  opts: ExpenseColumnOpts,
): ReportColumn<ExpenseRow>[] {
  const { page, pageSize, isQuad, t, tCommon } = opts;
  return [
    {
      key: "s",
      label: "S.No",
      compact: true,
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    { key: "date", label: t("date"), render: (r) => isoDate(r.date) },
    { key: "head", label: t("category"), render: (r) => r.expenseHead },
    ...(isQuad
      ? [
          {
            key: "expenseName",
            label: "Expense name",
            wrap: true as const,
            render: (r: ExpenseRow) => r.expenseName || tCommon("dash"),
          },
        ]
      : []),
    {
      key: "desc",
      label: t("remarksNotes"),
      wrap: "wide",
      render: (r) => r.description || tCommon("dash"),
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