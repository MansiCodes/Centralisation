"use client";

import { createPortal } from "react-dom";
import {
  MONTHS,
  shiftMonth,
  toISO,
  WEEKDAYS,
} from "./pnl-date-picker-utils";

export function PnlDatePickerMenu(props: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  required?: boolean;
  pos: { top: number; left: number; width: number };
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  onChange: (next: string) => void;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    label,
    value,
    min,
    max,
    required,
    pos,
    year,
    month,
    setYear,
    setMonth,
    onChange,
    onClose,
    menuRef,
  } = props;

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayIso = toISO(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  const todayDisabled = Boolean((min && todayIso < min) || (max && todayIso > max));

  return createPortal(
    <div
      className="pnl-date-picker__menu pnl-date-picker__menu--portal"
      role="dialog"
      aria-label={label}
      ref={menuRef}
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="pnl-date-picker__nav">
        <button
          type="button"
          className="pnl-date-picker__nav-btn"
          aria-label="Previous month"
          onClick={() => {
            const next = shiftMonth(year, month, -1);
            setYear(next.year);
            setMonth(next.month);
          }}
        >
          ‹
        </button>
        <p className="pnl-date-picker__month">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          className="pnl-date-picker__nav-btn"
          aria-label="Next month"
          onClick={() => {
            const next = shiftMonth(year, month, 1);
            setYear(next.year);
            setMonth(next.month);
          }}
        >
          ›
        </button>
      </div>
      <div className="pnl-date-picker__week">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="pnl-date-picker__grid">
        {cells.map((day, i) => {
          if (day == null) return <span key={`e-${i}`} />;
          const iso = toISO(year, month, day);
          const disabled = Boolean((min && iso < min) || (max && iso > max));
          const selected = iso === value;
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              className={`pnl-date-picker__day${selected ? " is-selected" : ""}${isToday && !selected ? " is-today" : ""}`}
              onClick={() => {
                onChange(iso);
                onClose();
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="pnl-date-picker__footer">
        {required ? (
          <span />
        ) : (
          <button
            type="button"
            className="pnl-date-picker__footer-btn"
            onClick={() => {
              onChange("");
              onClose();
            }}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="pnl-date-picker__footer-btn pnl-date-picker__footer-btn--today"
          disabled={todayDisabled}
          onClick={() => {
            onChange(todayIso);
            onClose();
          }}
        >
          Today
        </button>
      </div>
    </div>,
    document.body,
  );
}