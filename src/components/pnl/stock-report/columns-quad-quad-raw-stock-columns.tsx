import { formatINR } from "@/lib/format/inr";
import { BillPhotosCell } from "@/components/pnl/BillPhotosCell";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import { formatDayMonthYear } from "@/lib/dates";
import { PnlApprovalBadge } from "@/components/pnl/PnlApprovalBadge";
import {
  getQuadSignalCableProcesses,
  parseQuadSignalStockNotes,
} from "@/lib/plant-catalogs";
import { formatQty, isoDate } from "@/components/pnl/stock-report/format";
import type { StockRow } from "@/components/pnl/stock-report/types";

export function buildQuadRawStockColumns(
  page: number,
  pageSize: number,
): ReportColumn<StockRow>[] {
  return [
    {
      key: "s",
      label: "S.No",
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    {
      key: "date",
      label: "Date",
      align: "center",
      compact: true,
      render: (r) => isoDate(r.date),
    },
    {
      key: "item",
      label: "Item",
      wrap: true,
      render: (r) => r.itemName,
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
      compact: true,
      render: (r) => formatQty(r.quantity, 4),
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
      render: (r) =>
        r.rate != null && r.rate !== "" ? formatINR(Number(r.rate)) : "—",
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      render: (r) => formatINR(r.closingValue),
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
      label: "Image",
      compact: true,
      render: (r) => (
        <BillPhotosCell urls={r.photoUrls} fallbackUrl={r.photoUrl} />
      ),
    },
  ];
}
