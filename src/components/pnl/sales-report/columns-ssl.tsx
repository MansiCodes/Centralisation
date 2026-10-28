import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import {
  formatBillDate,
  formatQty,
  goodsValue,
} from "@/components/pnl/sales-report/format";
import type { SaleRow } from "@/components/pnl/sales-report/types";

export function buildSslSalesColumns(
  page: number,
  pageSize: number,
): ReportColumn<SaleRow>[] {
  return [
    {
      key: "s",
      label: "S No.",
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    {
      key: "date",
      label: "Date",
      render: (r) => formatBillDate(r.billDate || r.date),
    },
    {
      key: "invoice",
      label: "Invoice no.",
      render: (r) => r.billNumber?.trim() || "—",
    },
    {
      key: "customer",
      label: "Customer",
      wrap: true,
      render: (r) => r.customerName?.trim() || "—",
    },
    {
      key: "product",
      label: "Items",
      wrap: "wide",
      render: (r) => {
        if (r.items && r.items.length > 1) {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
              {r.items.map((it, idx) => (
                <div key={idx} style={{ lineHeight: "1.3" }}>
                  <span style={{ fontWeight: 600 }}>{it.itemDescription}</span>{" "}
                  <span style={{ color: "#64748b" }}>
                    (Qty: {formatQty(it.quantity)}{it.unit ? ` ${it.unit}` : ""}{Number(it.rate) > 0 ? ` @ ₹${Number(it.rate).toLocaleString("en-IN")}` : ""})
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return r.itemDescription;
      },
    },
    {
      key: "qty",
      label: "Total Qty",
      align: "right",
      compact: true,
      render: (r) => formatQty(r.totalQuantity ?? r.quantity),
    },
    {
      key: "goods",
      label: "Total Amount",
      align: "right",
      render: (r) => formatINR(r.totalSalesValue ?? goodsValue(r)),
    },
    {
      key: "remarks",
      label: "Remarks",
      wrap: "wide",
      render: (r) => r.notes?.trim() || "—",
    },
    {
      key: "excelUploadedAt",
      label: "Excel upload",
      compact: true,
      render: (r) =>
        r.excelUploadedAt
          ? formatDayMonthYear(r.excelUploadedAt)
          : "—",
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

