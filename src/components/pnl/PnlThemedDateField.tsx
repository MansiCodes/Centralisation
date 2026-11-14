"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconCalendar } from "@/components/icons/AppIcons";
import { formatDisplay, measureMenu } from "./pnl-date-picker-utils";
import { PnlDatePickerMenu } from "./PnlDatePickerMenu";

export function PnlThemedDateField({
  id,
  label,
  value,
  min,
  max,
  align = "start",
  hideLabel = false,
  required = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  align?: "start" | "end";
  hideLabel?: boolean;
  required?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  const [year, setYear] = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setYear(base.getFullYear());
    setMonth(base.getMonth());
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const node = rootRef.current;
      if (!node) return;
      setPos(measureMenu(node, align === "end"));
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, year, month]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className={hideLabel ? undefined : "pnl-date-filter__field"}>
      {hideLabel ? null : <label htmlFor={id}>{label}</label>}
      <div className={`pnl-date-picker${align === "end" ? " pnl-date-picker--end" : ""}`} ref={rootRef}>
        <button
          id={id}
          type="button"
          className="pnl-date-picker__trigger"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={value ? "" : "is-placeholder"}>
            {value ? formatDisplay(value) : "Select date"}
          </span>
          <IconCalendar size={16} />
        </button>
        {mounted && open && pos ? (
          <PnlDatePickerMenu
            label={label}
            value={value}
            min={min}
            max={max}
            required={required}
            pos={pos}
            year={year}
            month={month}
            setYear={setYear}
            setMonth={setMonth}
            onChange={onChange}
            onClose={() => setOpen(false)}
            menuRef={menuRef}
          />
        ) : null}
      </div>
    </div>
  );
}