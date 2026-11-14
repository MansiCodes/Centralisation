"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ReportTable } from "@/components/pnl/ReportTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedReport } from "@/components/pnl/usePaginatedReport";
import {
  buildCombinedRentColumns,
  buildElectricityRentColumns,
  buildFactoryRentColumns,
} from "@/components/pnl/electricity-rent-columns";
import type { ElectricityRentRow } from "@/components/pnl/electricity-rent-helpers";

export function ElectricityRentReport({
  plantId,
  plantCode,
  from,
  to,
  section = "combined",
}: {
  plantId: string;
  plantCode?: string;
  from: string;
  to: string;
  section?: "electricity" | "factoryRent" | "combined";
}) {
  const t = useTranslations("pnl");
  const isPvc = plantCode?.toUpperCase() === "PVC";
  const isFactoryRent = section === "factoryRent";
  const rangeFrom = isFactoryRent ? "2026-01-01" : from;
  const rangeTo = isFactoryRent ? "2027-03-31" : to;
  const baseUrl = `/api/plants/${plantId}/electricity-rent?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}${isFactoryRent ? "&register=1" : ""}`;

  const { rows, page, pageSize, total, loading, error, setPage, setPageSize } =
    usePaginatedReport<ElectricityRentRow>(
      baseUrl,
      t("networkError"),
      isPvc || isFactoryRent ? 20 : 10,
    );

  const electricityColumns = useMemo(
    () => buildElectricityRentColumns(page, pageSize),
    [page, pageSize],
  );
  const rentColumns = useMemo(
    () => buildFactoryRentColumns(page, pageSize),
    [page, pageSize],
  );
  const combinedColumns = useMemo(() => buildCombinedRentColumns(), []);

  const title =
    section === "factoryRent"
      ? "Factory Rent"
      : section === "electricity"
        ? "Electricity"
        : "Rent & Electricity";

  const columns =
    section === "factoryRent"
      ? rentColumns
      : section === "electricity"
        ? electricityColumns
        : combinedColumns;

  return (
    <section className="pnl-report-panel">
      <h3
        className={`pnl-report-panel__title${
          section === "factoryRent" ? " pnl-report-panel__title--plain" : ""
        }`}
      >
        {title}
      </h3>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <ReportTable
        columns={columns}
        rows={rows}
        loading={loading}
        variant="register"
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </section>
  );
}