import { getUpcastMiscQueryHeads, type PvcExpenseSection } from "@/lib/plant-catalogs";
import { isElectricityExpenseHead } from "@/lib/electricity-readings";

export function buildExpenseReportUrl(params: {
  plantId: string;
  from: string;
  to: string;
  isPettyCategory: boolean;
  isUpcastMiscCategory: boolean;
  isUpcastPowerCategory: boolean;
  upcast: boolean;
  category: string;
  section: PvcExpenseSection;
}): string {
  const {
    plantId,
    from,
    to,
    isPettyCategory,
    isUpcastMiscCategory,
    isUpcastPowerCategory,
    upcast,
    category,
    section,
  } = params;
  if (isPettyCategory) {
    return (
      `/api/plants/${plantId}/petty-cash?entryType=PETTY_CASH` +
      `&from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}`
    );
  }
  if (isUpcastMiscCategory) {
    return (
      `/api/plants/${plantId}/petty-cash?` +
      `from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}` +
      `&expenseHeads=${encodeURIComponent(
        getUpcastMiscQueryHeads(section).join(","),
      )}`
    );
  }
  if (isUpcastPowerCategory) {
    return (
      `/api/plants/${plantId}/petty-cash?` +
      `from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}` +
      `&expenseHeads=${encodeURIComponent("Fuel & Power,Electricity")}`
    );
  }
  if (upcast) {
    return (
      `/api/plants/${plantId}/petty-cash?` +
      `from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}` +
      `&expenseHead=${encodeURIComponent(category)}`
    );
  }
  return (
    `/api/plants/${plantId}/petty-cash?entryType=EXPENSE` +
    `&from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&expenseHead=${encodeURIComponent(category)}`
  );
}