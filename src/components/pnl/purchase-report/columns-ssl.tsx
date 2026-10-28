import { formatINR } from "@/lib/format/inr";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { formatDayMonthYear } from "@/lib/dates";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import {
  formatBillDate,
  formatQty,
  num,
} from "@/components/pnl/purchase-report/format";
import type { PurchaseRow } from "@/components/pnl/purchase-report/types";

export function buildSslPurchaseColumns(
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
      key: "billDate",
      label: "Date",
      render: (r) => formatBillDate(r.billDate || r.date),
    },
    {
      key: "billNo",
      label: "Invoice no. / Challan no.",
      render: (r) => r.billNumber?.trim() || "—",
    },
    {
      key: "vendor",
      label: "Supplier name",
      wrap: true,
      render: (r) => r.vendorName,
    },
    {
      key: "description",
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
                    (Qty: {formatQty(it.quantity)}{it.unit ? ` ${it.unit}` : ""}{Number(it.rate) > 0 ? ` @ ₹${Number(it.rate).toLocaleString("en-IN")}` : ""}{Number(it.gstPercent) > 0 ? ` +${it.gstPercent}% GST` : ""})
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
      key: "basic",
      label: "Basic value",
      align: "right",
      render: (r) =>
        formatINR(r.totalBasicValue ?? num(r.quantity) * num(r.rate)),
    },
    {
      key: "gst",
      label: "GST",
      align: "right",
      headerAlign: "center",
      render: (r) => formatINR(r.totalGstAmount ?? r.gstAmount),
    },
    {
      key: "invoice",
      label: "Total Amount",
      align: "right",
      render: (r) => formatINR(r.totalInvoiceValue ?? r.invoiceValue),
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

