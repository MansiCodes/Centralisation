"use client";

import { IconAudit } from "@/components/icons/AppIcons";
import { Pagination } from "@/components/ui/Pagination";
import {
  auditActionLabel,
  auditEntityLabel,
  formatAuditChange,
  type AuditRow,
} from "./types";

type AuditTableProps = {
  rows: AuditRow[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
};

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="audit-empty">
      <div className="audit-empty__icon" aria-hidden>
        <IconAudit size={28} />
      </div>
      <h3>{hasFilters ? "No matching audit entries" : "No audit trail yet"}</h3>
      <p>
        {hasFilters
          ? "Try another date range, user, or clear filters."
          : "Changes to purchases, sales, users and more will show up here."}
      </p>
      {hasFilters ? (
        <button type="button" className="audit-empty__btn" onClick={onClearFilters}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export function AuditTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  hasFilters,
  onClearFilters,
}: AuditTableProps) {
  if (total === 0) {
    return (
      <section className="audit-table-card">
        <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
      </section>
    );
  }

  return (
    <section className="audit-table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Field</th>
              <th>Backdated</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id}>
                <td className="audit-when">{log.createdAt}</td>
                <td>
                  <div className="audit-actor">
                    <span className="audit-actor__name">{log.actorName}</span>
                    {log.actorEmail && log.actorEmail !== log.actorName ? (
                      <span className="audit-actor__email">{log.actorEmail}</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <span className="audit-pill">
                    {auditEntityLabel(log.entityType)}
                  </span>
                </td>
                <td>{auditActionLabel(log.field)}</td>
                <td>
                  <span
                    className={`audit-pill ${
                      log.isBackdated ? "audit-pill--warn" : "audit-pill--ok"
                    }`}
                  >
                    {log.isBackdated ? "Yes" : "No"}
                  </span>
                </td>
                <td className="audit-change">
                  {formatAuditChange(log.oldValue, log.newValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="audit-table-card__footer">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}