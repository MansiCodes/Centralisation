import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dateOnlyRegex, parseDateOnly } from "@/lib/dates";
import {
  canApproveEntries,
  getAccessiblePlantIds,
  hasGlobalPlantAccess,
} from "@/lib/rbac";
import { resolveSelectedPlantId } from "@/lib/selected-plant";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { ApprovalsDateFilter } from "@/components/dashboard/ApprovalsDateFilter";
import {
  EntryApprovalsPanel,
  type PendingEntryRow,
} from "@/components/dashboard/EntryApprovalsPanel";
import type { EntryApprovalKind } from "@/lib/entry-approval";
import {
  APPROVAL_TAB_ORDER,
  VALID_APPROVAL_TABS,
} from "./approvals-constants";
import {
  mapExpensesToPending,
  mapPurchasesToPending,
  mapSalesToPending,
  mapStocksToPending,
} from "./build-pending-entries";
import { loadPendingApprovalRows } from "./load-pending-approvals";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!canApproveEntries(session.user.globalRole)) {
    redirect("/");
  }

  const { from: fromStr, to: toStr, tab: tabParam } = await searchParams;
  const plantIds = await getAccessiblePlantIds(session.user.id);
  const selectedPlantId = await resolveSelectedPlantId(session.user.id, {
    hasGlobalPlantAccess: hasGlobalPlantAccess(session.user.globalRole),
  });
  const locale = (await getLocale()) as AppLocale;

  if (plantIds.length === 0) {
    return (
      <div className="approvals-page">
        <p className="page-sub">No plants are available to review.</p>
      </div>
    );
  }

  const scopedPlantIds =
    selectedPlantId && plantIds.includes(selectedPlantId)
      ? [selectedPlantId]
      : plantIds;

  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (fromStr && dateOnlyRegex.test(fromStr)) fromDate = parseDateOnly(fromStr);
  if (toStr && dateOnlyRegex.test(toStr)) toDate = parseDateOnly(toStr);

  const { purchases, sales, stocks, expenses } = await loadPendingApprovalRows(
    scopedPlantIds,
    fromDate,
    toDate,
  );

  const tabCounts: Record<EntryApprovalKind, number> = {
    purchase: purchases.length,
    sale: sales.length,
    stock: stocks.length,
    expense: expenses.length,
  };
  const initialTab = VALID_APPROVAL_TABS.has(tabParam as EntryApprovalKind)
    ? (tabParam as EntryApprovalKind)
    : (APPROVAL_TAB_ORDER.find((tab) => tabCounts[tab] > 0) ?? "purchase");

  const entries: PendingEntryRow[] = [
    ...mapPurchasesToPending(purchases),
    ...mapSalesToPending(sales),
    ...mapStocksToPending(stocks),
    ...mapExpensesToPending(expenses),
  ];

  return (
    <div className="approvals-page">
      <ApprovalsDateFilter from={fromStr ?? ""} to={toStr ?? ""} />

      <EntryApprovalsPanel
        entries={entries}
        initialTab={initialTab}
        locale={locale}
      />
    </div>
  );
}