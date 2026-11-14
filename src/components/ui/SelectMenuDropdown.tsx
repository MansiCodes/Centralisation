"use client";

import { createPortal } from "react-dom";
import type { RefObject } from "react";
import type { SelectMenuPos } from "./select-menu-position";
import type { SelectMenuItem } from "./select-menu-types";

type Props = {
  mounted: boolean;
  open: boolean;
  pos: SelectMenuPos | null;
  allowCustom: boolean;
  filteredItems: SelectMenuItem[];
  listRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  fieldId: string;
  triggerId: string;
  canSearch: boolean;
  search: string;
  setSearch: (v: string) => void;
  searchPlaceholder: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
};

export function SelectMenuDropdown(props: Props) {
  const {
    mounted,
    open,
    pos,
    allowCustom,
    filteredItems,
    listRef,
    searchRef,
    fieldId,
    triggerId,
    canSearch,
    search,
    setSearch,
    searchPlaceholder,
    placeholder,
    value,
    onChange,
    setOpen,
  } = props;

  if (!mounted || !open || !pos || (allowCustom && filteredItems.length === 0)) {
    return null;
  }

  return createPortal(
    <div
      ref={listRef}
      className={`select-menu__list${canSearch ? " select-menu__list--searchable" : ""}`}
      role="listbox"
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
      {canSearch ? (
        <div className="select-menu__search">
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
      {filteredItems.length === 0 ? (
        <p className="select-menu__empty">No matches</p>
      ) : (
        filteredItems.map((opt) => (
          <SelectMenuOption
            key={opt.value === "" ? "__blank__" : opt.value}
            opt={opt}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            setOpen={setOpen}
          />
        ))
      )}
    </div>,
    document.body,
  );
}

function SelectMenuOption({
  opt,
  value,
  placeholder,
  onChange,
  setOpen,
}: {
  opt: SelectMenuItem;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  setOpen: (v: boolean) => void;
}) {
  const selected = opt.value === value;
  const label = opt.label === "" && opt.value === "" ? placeholder : opt.label;
  return (
    <div role="option" aria-selected={selected}>
      <button
        type="button"
        className={`select-menu__option${selected ? " is-selected" : ""}`}
        onClick={() => {
          onChange(opt.value);
          setOpen(false);
        }}
      >
        {label}
      </button>
    </div>
  );
}