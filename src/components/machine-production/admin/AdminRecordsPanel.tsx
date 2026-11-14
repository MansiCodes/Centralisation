"use client";

import type { Dispatch, SetStateAction } from "react";
import { TablePageLoadingSkeleton } from "@/components/loading/CoreLoadingSkeleton";
import { AdminRecordCard } from "@/components/machine-production/admin/admin-record-card";
import { Pagination } from "@/components/ui/Pagination";
import { addDaysYmd } from "@/lib/machine-production/slots";
import { formatDayMonthYear } from "@/lib/dates";
import type {
  EntryRow,
  MachineDayRow,
} from "@/components/machine-production/admin-dashboard-model";

type Props = {
  loading: boolean;
  recordsByDate: [string, MachineDayRow[]][];
  todayYmd: string;
  expandedMachineDays: Record<string, boolean>;
  setExpandedMachineDays: Dispatch<SetStateAction<Record<string, boolean>>>;
  entriesPage: number;
  entriesPageSize: number;
  entriesTotal: number;
  setEntriesPage: (page: number) => void;
  setEntriesPageSize: (size: number) => void;
  onSelect: (entry: EntryRow) => void;
  onEdit: (entry: EntryRow) => void;
  onDelete: (id: string) => void;
};

export function AdminRecordsPanel({
  loading,
  recordsByDate,
  todayYmd,
  expandedMachineDays,
  setExpandedMachineDays,
  entriesPage,
  entriesPageSize,
  entriesTotal,
  setEntriesPage,
  setEntriesPageSize,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <TablePageLoadingSkeleton
        rows={8}
        label="Loading production records"
        showChrome={false}
      />
    );
  }

  return (
    <>
      {recordsByDate.length === 0 ? (
        <p className="mp-muted mp-records-empty">
          No records for these filters.
        </p>
      ) : (
        <div className="mp-records-days">
          {recordsByDate.map(([date, rows]) => {
            const isToday = date === todayYmd;
            const isYesterday = date === addDaysYmd(todayYmd, -1);
            const dayLabel = isToday
              ? "Today"
              : isYesterday
                ? "Yesterday"
                : formatDayMonthYear(date);
            return (
              <section key={date} className="mp-records-day">
                <header className="mp-records-day__head">
                  <h2 className="mp-records-day__title">
                    {dayLabel}
                    <span className="mp-records-day__date">
                      {formatDayMonthYear(date)}
                    </span>
                  </h2>
                  <span className="mp-records-day__count">
                    {rows.length} machine
                    {rows.length === 1 ? "" : "s"}
                  </span>
                </header>
                <ol className="mp-records-grid">
                  {rows.map((row) => (
                    <AdminRecordCard
                      key={`${row.date}|${row.machineId}`}
                      row={row}
                      open={Boolean(
                        expandedMachineDays[`${row.date}|${row.machineId}`],
                      )}
                      onToggle={() => {
                        const cardKey = `${row.date}|${row.machineId}`;
                        setExpandedMachineDays((prev) => ({
                          ...prev,
                          [cardKey]: !prev[cardKey],
                        }));
                      }}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
      <Pagination
        page={entriesPage}
        pageSize={entriesPageSize}
        total={entriesTotal}
        onPageChange={setEntriesPage}
        onPageSizeChange={(nextSize) => {
          setEntriesPageSize(nextSize);
          setEntriesPage(1);
        }}
      />
    </>
  );
}
