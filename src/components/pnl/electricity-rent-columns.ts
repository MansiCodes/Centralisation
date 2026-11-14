import { formatINR } from "@/lib/format/inr";
import { formatMonthLabel } from "@/lib/dates";
import { type ReportColumn } from "@/components/pnl/ReportTable";
import {
  avgRate,
  coveredAreaLabel,
  formatReading,
  num,
  type ElectricityRentRow,
} from "@/components/pnl/electricity-rent-helpers";

export function buildElectricityRentColumns(
  page: number,
  pageSize: number,
): ReportColumn<ElectricityRentRow>[] {
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
      key: "month",
      label: "Months",
      width: "7rem",
      render: (r) => formatMonthLabel(r.month),
    },
    {
      key: "opening",
      label: "Opening Reading",
      align: "right",
      width: "9rem",
      render: (r) => formatReading(r.openingReading),
    },
    {
      key: "closing",
      label: "Closing Reading",
      align: "right",
      width: "9rem",
      render: (r) => formatReading(r.closingReading),
    },
    {
      key: "consumed",
      label: "Consumed Reading",
      align: "right",
      width: "9.5rem",
      render: (r) => formatReading(r.consumedUnits),
    },
    {
      key: "unit",
      label: "Unit",
      compact: true,
      width: "4.5rem",
      render: () => "kWh",
    },
    {
      key: "avg",
      label: "Avg rate",
      align: "right",
      compact: true,
      width: "7rem",
      render: (r) => {
        const rate = avgRate(r);
        return rate == null ? "—" : formatReading(rate);
      },
    },
    {
      key: "bill",
      label: "Amount of electricity bill",
      align: "right",
      width: "12rem",
      render: (r) => (num(r.billAmount) ? formatINR(r.billAmount) : "—"),
    },
    {
      key: "notes",
      label: "Notes / Remark",
      wrap: "wide",
      render: (r) => r.notes?.trim() || "—",
    },
  ];
}

export function buildFactoryRentColumns(
  page: number,
  pageSize: number,
): ReportColumn<ElectricityRentRow>[] {
  return [
    {
      key: "sno",
      label: "S.No",
      align: "center",
      compact: true,
      width: "4.5rem",
      render: (_r, index) =>
        String((page - 1) * pageSize + (index ?? 0) + 1),
    },
    {
      key: "month",
      label: "Months",
      width: "8rem",
      render: (r) => formatMonthLabel(r.month),
    },
    {
      key: "area",
      label: "Covered Area",
      align: "right",
      width: "10rem",
      render: (r) => coveredAreaLabel(r),
    },
    {
      key: "rate",
      label: "Rate",
      align: "right",
      width: "7rem",
      render: (r) => formatReading(r.rentRatePerSqft),
    },
    {
      key: "rent",
      label: "Rent Exp",
      align: "right",
      width: "10rem",
      render: (r) => (num(r.rentAmount) ? formatINR(r.rentAmount) : "—"),
    },
  ];
}

export function buildCombinedRentColumns(): ReportColumn<ElectricityRentRow>[] {
  return [
    {
      key: "month",
      label: "Months",
      render: (r) => formatMonthLabel(r.month),
    },
    {
      key: "bill",
      label: "Electricity Amount",
      align: "right",
      render: (r) => formatINR(r.billAmount),
    },
    {
      key: "rent",
      label: "Rent Amount",
      align: "right",
      render: (r) => formatINR(r.rentAmount),
    },
    {
      key: "notes",
      label: "Notes",
      wrap: "wide",
      render: (r) => r.notes?.trim() || "—",
    },
  ];
}