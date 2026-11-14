"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ReportTab } from "@/components/pnl/types";
import { IconDownload } from "@/components/icons/AppIcons";
import { downloadExportBlob, exportPnlAsPdf } from "./pnl-export-pdf";

export function PnlExportButton({
  plantId,
  kind,
  from,
  to,
}: {
  plantId: string;
  kind: ReportTab;
  from: string;
  to: string;
}) {
  const t = useTranslations("pnl");
  const [exporting, setExporting] = useState(false);
  const isPnl = kind === "pnl";

  async function onExport() {
    setExporting(true);
    try {
      if (isPnl) {
        await exportPnlAsPdf(plantId, from, to);
        toast.success("P&L exported as PDF");
      } else {
        const params = new URLSearchParams({ kind });
        if (from.trim()) params.set("from", from.trim());
        if (to.trim()) params.set("to", to.trim());
        const url = `/api/plants/${plantId}/reports/export?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(json?.error ?? "Export failed");
        }
        const blob = await res.blob();
        downloadExportBlob(
          blob,
          res.headers.get("Content-Disposition") ?? "",
          `${kind}-export.xlsx`,
        );
        toast.success(t("exportExcel"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      className="pnl-export-btn pnl-export-btn--compact"
      onClick={() => void onExport()}
      disabled={exporting}
      title={isPnl ? "Export PDF" : t("exportExcel")}
    >
      <IconDownload size={14} />
      <span className="pnl-export-btn__label">
        {exporting ? "…" : isPnl ? "PDF" : t("exportExcel")}
      </span>
    </button>
  );
}