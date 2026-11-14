"use client";

import { SelectMenuDropdown } from "./SelectMenuDropdown";
import type { SelectMenuItem } from "./select-menu-types";
import { useSelectMenu } from "./useSelectMenu";

export type { SelectMenuItem };

type SelectMenuProps = {
  id?: string;
  label?: string;
  value: string;
  options?: readonly string[];
  items?: readonly SelectMenuItem[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
  allowCustom?: boolean;
  searchPlaceholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SelectMenu({
  id,
  value,
  options,
  items,
  required,
  disabled = false,
  placeholder = "Select…",
  searchable = false,
  allowCustom = false,
  searchPlaceholder = "Search…",
  onChange,
  className,
}: SelectMenuProps) {
  const menu = useSelectMenu({
    id,
    value,
    options,
    items,
    disabled,
    searchable,
    allowCustom,
    onChange,
  });

  return (
    <div
      ref={menu.rootRef}
      className={`select-menu${menu.open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
    >
      {allowCustom ? (
        <SelectMenuComboTrigger
          fieldId={menu.fieldId}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          showSuggestions={menu.showSuggestions}
          onChange={onChange}
          setOpen={menu.setOpen}
        />
      ) : (
        <SelectMenuButtonTrigger
          fieldId={menu.fieldId}
          triggerId={menu.triggerId}
          required={required}
          disabled={disabled}
          open={menu.open}
          placeholder={placeholder}
          selectedLabel={menu.selectedLabel}
          value={value}
          setOpen={menu.setOpen}
          onTriggerKey={menu.onTriggerKey}
        />
      )}
      <SelectMenuDropdown
        mounted={menu.mounted}
        open={menu.open}
        pos={menu.pos}
        allowCustom={allowCustom}
        filteredItems={menu.filteredItems}
        listRef={menu.listRef}
        searchRef={menu.searchRef}
        fieldId={menu.fieldId}
        triggerId={menu.triggerId}
        canSearch={menu.canSearch}
        search={menu.search}
        setSearch={menu.setSearch}
        searchPlaceholder={searchPlaceholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        setOpen={menu.setOpen}
      />
    </div>
  );
}

function SelectMenuComboTrigger({
  fieldId,
  required,
  disabled,
  placeholder,
  value,
  showSuggestions,
  onChange,
  setOpen,
}: {
  fieldId: string;
  required?: boolean;
  disabled: boolean;
  placeholder: string;
  value: string;
  showSuggestions: boolean;
  onChange: (v: string) => void;
  setOpen: (fn: (prev: boolean) => boolean) => void;
}) {
  return (
    <div className="select-menu__trigger select-menu__trigger--combo">
      <input
        id={fieldId}
        className="select-menu__combo-input"
        required={required}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (showSuggestions) setOpen(() => true);
        }}
        onFocus={() => {
          if (showSuggestions) setOpen(() => true);
        }}
      />
      {showSuggestions ? (
        <button
          type="button"
          className="select-menu__chevron-btn"
          tabIndex={-1}
          aria-label="Previous names"
          onClick={() => {
            if (!disabled) setOpen((v) => !v);
          }}
        >
          ▾
        </button>
      ) : null}
    </div>
  );
}

function SelectMenuButtonTrigger({
  fieldId,
  triggerId,
  required,
  disabled,
  open,
  placeholder,
  selectedLabel,
  value,
  setOpen,
  onTriggerKey,
}: {
  fieldId: string;
  triggerId: string;
  required?: boolean;
  disabled: boolean;
  open: boolean;
  placeholder: string;
  selectedLabel: string;
  value: string;
  setOpen: (fn: (prev: boolean) => boolean) => void;
  onTriggerKey: React.ComponentProps<"button">["onKeyDown"];
}) {
  return (
    <>
      <input
        id={fieldId}
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={() => undefined}
        className="select-menu__native"
      />
      <button
        id={triggerId}
        type="button"
        className="select-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${fieldId}-listbox` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKey}
      >
        <span
          className={`select-menu__value${!selectedLabel ? " is-placeholder" : ""}`}
        >
          {selectedLabel || placeholder}
        </span>
        <span className="select-menu__chevron" aria-hidden>
          ▾
        </span>
      </button>
    </>
  );
}