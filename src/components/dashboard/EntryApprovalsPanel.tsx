"use client";

import { useEffect, useMemo, useState } from "react";
import { EntryApproveRejectGroup } from "@/components/dashboard/EntryApproveRejectGroup";
import { Pagination } from "@/components/ui/Pagination";
import { localeToBcp47, type AppLocale } from "@/i18n/config";
import type { EntryApprovalKind } from "@/lib/entry-approval-types";
import "@/components/ui/date-filter.css";

export type PendingEntryRow = {
  id: string;
  kind: EntryApprovalKind;
  plantId: string;
  date: string;
  shift: string;
  plantName: string;
  enteredByName: string | null;
  label: string;
  detail: string;
  remark?: string | null;
  amount: number;
};

const TABS: { key: EntryApprovalKind; label: string }[] = [
  { key: "purchase", label: "Purchase" },
  { key: "sale", label: "Sales" },
  { key: "stock", label: "Stock" },
  { key: "expense", label: "Expense" },
];

const APPROVALS_PAGE_SIZE = 10;

function formatDay(dateStr: string, locale: AppLocale): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString(localeToBcp47(locale), {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function ApprovalsTabs({
  tab,
  counts,
  onChange,
}: {
  tab: EntryApprovalKind;
  counts: { key: EntryApprovalKind; label: string; count: number }[];
  onChange: (key: EntryApprovalKind) => void;
}) {
  return (
    <div className="approvals-tabs" role="tablist" aria-label="Approval types">
      {counts.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          className={`approvals-tab${tab === t.key ? " is-active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count > 0 ? ` (${t.count})` : ""}
        </button>
      ))}
    </div>
  );
}

function ApprovalsRow({
  row,
  locale,
}: {
  row: PendingEntryRow;
  locale: AppLocale;
}) {
  return (
    <tr>
      <td>{formatDay(row.date, locale)}</td>
      <td className="approvals-table__shift">{row.shift.toLowerCase()}</td>
      <td>{row.plantName}</td>
      <td>{row.enteredByName ?? "—"}</td>
      <td>
        <div className="approvals-table__label">{row.label}</div>
        {row.detail ? (
          <div className="approvals-table__detail">{row.detail}</div>
        ) : null}
        {row.remark?.trim() ? (
          <div className="approvals-table__remark">
            Note: {row.remark.trim()}
          </div>
        ) : null}
      </td>
      <td>{formatINR(row.amount)}</td>
      <td className="approvals-table__actions">
        <EntryApproveRejectGroup entryId={row.id} kind={row.kind} />
      </td>
    </tr>
  );
}

export function EntryApprovalsPanel({
  entries,
  initialTab = "purchase",
  locale,
}: {
  entries: PendingEntryRow[];
  initialTab?: EntryApprovalKind;
  locale: AppLocale;
}) {
  const [tab, setTab] = useState<EntryApprovalKind>(initialTab);
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => entries.filter((e) => e.kind === tab),
    [entries, tab],
  );
  const counts = TABS.map((t) => ({
    ...t,
    count: entries.filter((e) => e.kind === t.key).length,
  }));
  const totalPages = Math.max(1, Math.ceil(filtered.length / APPROVALS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * APPROVALS_PAGE_SIZE,
    safePage * APPROVALS_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [tab]);

  return (
    <section className="mis-panel approvals-panel">
      <h2 className="approvals-panel__title">Approvals</h2>
      <ApprovalsTabs
        tab={tab}
        counts={counts}
        onChange={(key) => {
          setTab(key);
          setPage(1);
        }}
      />

      {filtered.length === 0 ? (
        <p className="approvals-empty">No pending {tab} entries.</p>
      ) : (
        <div className="approvals-table-wrap">
          <table className="approvals-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Plant</th>
                <th>Entered by</th>
                <th>Details</th>
                <th>Amount</th>
                <th className="approvals-table__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <ApprovalsRow key={row.id} row={row} locale={locale} />
              ))}
            </tbody>
          </table>
          <Pagination
            page={safePage}
            pageSize={APPROVALS_PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}
