import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import {
  debitRupees,
  formatBillDate,
  formatQty,
  netRupeesAfterDebit,
  num,
} from "@/components/pnl/purchase-report/format";
import type { PurchaseRow } from "@/components/pnl/purchase-report/types";

export function buildCat6PurchaseColumns(
  page: number,
  pageSize: number,
): ReportColumn<PurchaseRow>[] {
  return [
    {
      key: "sno",
      label: "S.No",
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    {
      key: "gstin",
      label: "GSTIN/GST No",
      wrap: true,
      render: (r) => r.gstin?.trim() || "—",
    },
    {
      key: "vendor",
      label: "Vendor's Name",
      wrap: true,
      render: (r) => r.vendorName,
    },
    {
      key: "billNo",
      label: "Bill Number",
      render: (r) => r.billNumber?.trim() || "—",
    },
    {
      key: "billDate",
      label: "Bill Date",
      render: (r) => formatBillDate(r.billDate || r.date),
    },
    {
      key: "item",
      label: "Item Details",
      wrap: true,
      render: (r) => r.itemDescription,
    },
    {
      key: "qty",
      label: "Item QTY",
      align: "right",
      compact: true,
      render: (r) => formatQty(r.quantity),
    },
    {
      key: "debitQty",
      label: "Debit Qty",
      align: "right",
      compact: true,
      render: (r) =>
        num(r.debitQuantity ?? 0) > 0 ? formatQty(r.debitQuantity ?? 0) : "—",
    },
    {
      key: "unit",
      label: "Unit",
      compact: true,
      render: (r) => r.unit || "—",
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
      compact: true,
      render: (r) => formatQty(r.rate),
    },
    {
      key: "debitAmt",
      label: "Debit Amt",
      align: "right",
      render: (r) => {
        const debit = debitRupees(r.debitQuantity ?? 0, r.rate);
        return debit > 0 ? formatINR(-debit) : "—";
      },
    },
    {
      key: "gross",
      label: "Basic value",
      align: "right",
      render: (r) => formatINR(num(r.quantity) * num(r.rate)),
    },
    {
      key: "amt",
      label: "Net value (after debit)",
      align: "right",
      render: (r) =>
        formatINR(
          netRupeesAfterDebit(r.quantity, r.debitQuantity ?? 0, r.rate),
        ),
    },
    {
      key: "notes",
      label: "Notes",
      wrap: "wide",
      render: (r) => r.notes?.trim() || "—",
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
        <BillPhotosCell urls={r.billPhotoUrls} fallbackUrl={r.billPhotoUrl} />
      ),
    },
  ];
}
