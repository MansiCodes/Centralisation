import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatINR } from "@/lib/format/inr";
import type { ReportColumn } from "@/components/pnl/ReportTable";
import { pvcExpensePnlLine, pvcExpenseSection } from "@/lib/plant-catalogs";
import type { PvcExpenseRow } from "./pvc-expense-register-types";

export function usePvcExpenseRegisterColumns(page: number, pageSize: number) {
  const t = useTranslations("pnl");
  return useMemo((): ReportColumn<PvcExpenseRow>[] => {
    return [
      {
        key: "sno",
        label: "S No.",
        align: "center",
        compact: true,
        width: "4.5rem",
        render: (_r, index) =>
          String((page - 1) * pageSize + (index ?? 0) + 1),
      },
      {
        key: "section",
        label: "Section",
        width: "7rem",
        render: (r) =>
          pvcExpenseSection(r.expenseLabel) === "direct"
            ? "Direct"
            : "Indirect",
      },
      {
        key: "pnl",
        label: "P&L Line",
        wrap: true,
        width: "11rem",
        render: (r) => pvcExpensePnlLine(r.expenseLabel),
      },
      {
        key: "period",
        label: "Month / Date",
        width: "8rem",
        render: (r) => r.periodLabel,
      },
      {
        key: "desc",
        label: t("remarksNotes"),
        wrap: "wide",
        render: (r) => r.description,
      },
      {
        key: "details",
        label: "Details",
        wrap: "wide",
        render: (r) => r.details?.trim() || "—",
      },
      {
        key: "amount",
        label: t("amount"),
        align: "right",
        width: "11rem",
        render: (r) => formatINR(r.amount),
      },
    ];
  }, [page, pageSize, t]);
}