"use client";

import { createPortal } from "react-dom";
import type { MachineOption } from "./MachineMultiSelect";

export type MenuPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

export function MachineMultiSelectMenu(props: {
  fieldId: string;
  triggerId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  searchRef: React.RefObject<HTMLInputElement | null>;
  pos: MenuPos;
  search: string;
  setSearch: (v: string) => void;
  searchPlaceholder: string;
  filteredMachines: MachineOption[];
  machines: MachineOption[];
  value: string[];
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  const {
    fieldId,
    triggerId,
    listRef,
    searchRef,
    pos,
    search,
    setSearch,
    searchPlaceholder,
    filteredMachines,
    machines,
    value,
    disabled,
    onToggle,
  } = props;

  return createPortal(
    <div
      ref={listRef}
      className="select-menu__list mp-machine-multi__list"
      role="listbox"
      aria-multiselectable="true"
      id={`${fieldId}-listbox`}
      aria-labelledby={triggerId}
      style={{
        position: "fixed",
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        top: pos.openUp ? undefined : pos.top,
        bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
        zIndex: 200,
      }}
    >
      <div className="mp-machine-multi__search">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      {filteredMachines.length === 0 ? (
        <p className="mp-machine-multi__empty mp-muted">
          {machines.length === 0
            ? "No machines yet — add them on the Machines tab first."
            : "No machines match your search."}
        </p>
      ) : (
        filteredMachines.map((machine) => {
          const selected = value.includes(machine.id);
          return (
            <label
              key={machine.id}
              className={`mp-machine-multi__option${selected ? " is-selected" : ""}`}
              role="option"
              aria-selected={selected}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={() => onToggle(machine.id)}
              />
              <span>
                {machine.name}
                <span className="mp-muted"> · {machine.code}</span>
                {!machine.isActive ? (
                  <span className="mp-muted"> (inactive)</span>
                ) : null}
              </span>
            </label>
          );
        })
      )}
    </div>,
    document.body,
  );
}