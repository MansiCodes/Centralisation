import { ReportRowActions } from "@/components/pnl/ReportRowActions";
import type {
  EntryRow,
  MachineDayRow,
} from "@/components/machine-production/admin-dashboard-model";

export function AdminRecordCard({
  row,
  open,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
}: {
  row: MachineDayRow;
  open: boolean;
  onToggle: () => void;
  onSelect: (entry: EntryRow) => void;
  onEdit: (entry: EntryRow) => void;
  onDelete: (id: string) => void;
}) {
  const slots = row.slots ?? [];
  const ops = slots.reduce((s, e) => s + (e.operators || 0), 0);
  const helpers = slots.reduce((s, e) => s + (e.helpers || 0), 0);
  const manpower = slots.reduce((s, e) => s + (e.totalManpower || 0), 0);

  return (
    <li className={`mp-records-card${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="mp-records-card__toggle"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="mp-records-card__toggle-main">
          <h3 className="mp-records-card__title">
            <span className="mp-records-card__name">{row.machineName}</span>
            {row.machineCode ? (
              <span className="mp-records-card__code">{row.machineCode}</span>
            ) : null}
          </h3>
          {!open ? (
            <p className="mp-records-card__totals">
              <span className="mp-records-val">{row.entries}</span> slot
              {row.entries === 1 ? "" : "s"} · Planned{" "}
              <span className="mp-records-val">{row.plannedProduction}</span>{" "}
              · Actual{" "}
              <span className="mp-records-val">{row.actualProduction}</span>{" "}
              · Eff <span className="mp-records-val">{row.efficiencyPct}%</span>
            </p>
          ) : null}
        </span>
        <span
          className={`mp-expand-chevron${open ? " mp-expand-chevron--open" : ""}`}
          aria-hidden
        >
          ▸
        </span>
      </button>
      {open ? (
        <>
          <ul className="mp-records-card__slots">
            {slots.map((e) => (
              <li key={e.id} className="mp-records-slot">
                <button
                  type="button"
                  className="mp-records-slot__main"
                  onClick={() => onSelect(e)}
                >
                  <span className="mp-records-slot__when">
                    {e.shiftLabel} · {e.slotLabel}
                  </span>
                  <span className="mp-records-slot__line">
                    {e.operatorName?.trim() || "—"} · {e.currentProcess || "—"}
                  </span>
                  <span className="mp-records-slot__line mp-muted">
                    {e.cableType} · {e.cableSize}
                  </span>
                  <span className="mp-records-slot__metrics">
                    Planned{" "}
                    <span className="mp-records-val">{e.plannedProduction}</span>{" "}
                    · Actual{" "}
                    <span className="mp-records-val">{e.actualProduction}</span>{" "}
                    · Eff{" "}
                    <span className="mp-records-val">{e.efficiencyPct}%</span>
                  </span>
                  <span className="mp-records-slot__metrics">
                    Ops <span className="mp-records-val">{e.operators}</span> ·
                    Helpers <span className="mp-records-val">{e.helpers}</span>{" "}
                    · Manpower{" "}
                    <span className="mp-records-val">{e.totalManpower}</span>
                  </span>
                </button>
                <div className="mp-records-slot__actions">
                  <span
                    className={`mp-status mp-status--${
                      e.status === "COMPLETED"
                        ? "ok"
                        : e.status === "OVERDUE"
                          ? "overdue"
                          : "pending"
                    }`}
                  >
                    {e.status}
                  </span>
                  <ReportRowActions
                    onEdit={() => onEdit(e)}
                    onDelete={() => onDelete(e.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mp-records-card__footer">
            <span className="mp-records-card__footer-label">Total</span>
            <span>
              Slots <span className="mp-records-val">{row.entries}</span> ·
              Planned{" "}
              <span className="mp-records-val">{row.plannedProduction}</span> ·
              Actual{" "}
              <span className="mp-records-val">{row.actualProduction}</span> ·
              Eff <span className="mp-records-val">{row.efficiencyPct}%</span>
            </span>
            <span>
              Ops <span className="mp-records-val">{ops}</span> · Helpers{" "}
              <span className="mp-records-val">{helpers}</span> · Manpower{" "}
              <span className="mp-records-val">{manpower}</span>
            </span>
          </div>
        </>
      ) : null}
    </li>
  );
}