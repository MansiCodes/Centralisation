"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { measureSelectMenuPos, type SelectMenuPos } from "./select-menu-position";
import { optionStartsWith } from "./select-menu-filter";
import type { SelectMenuItem } from "./select-menu-types";

type UseSelectMenuArgs = {
  id?: string;
  value: string;
  options?: readonly string[];
  items?: readonly SelectMenuItem[];
  disabled?: boolean;
  searchable?: boolean;
  allowCustom?: boolean;
  onChange: (value: string) => void;
};

export function useSelectMenu({
  id,
  value,
  options,
  items,
  disabled = false,
  searchable = false,
  allowCustom = false,
  onChange,
}: UseSelectMenuArgs) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<SelectMenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const resolvedItems = useMemo<SelectMenuItem[]>(() => {
    if (items) return [...items];
    return (options ?? []).map((opt) => ({ value: opt, label: opt }));
  }, [items, options]);

  const canSearch = !allowCustom && (searchable || resolvedItems.length >= 6);
  const showSuggestions = allowCustom && resolvedItems.length > 0;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 150);
    return () => window.clearTimeout(t);
  }, [search]);

  const filteredItems = useMemo(() => {
    const q = allowCustom
      ? value.trim().toLowerCase()
      : debouncedSearch.trim().toLowerCase();
    if (allowCustom) {
      if (!q) return resolvedItems;
      return resolvedItems.filter((opt) => optionStartsWith(opt, q));
    }
    if (!canSearch) return resolvedItems;
    if (!q) return resolvedItems;
    return resolvedItems.filter((opt) => optionStartsWith(opt, q));
  }, [resolvedItems, canSearch, debouncedSearch, allowCustom, value]);

  const selectedLabel =
    resolvedItems.find((opt) => opt.value === value)?.label ?? "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useSelectMenuOpenEffects(open, canSearch, searchRef, setSearch);
  useSelectMenuPosition(open, canSearch, showSuggestions, rootRef, setPos);
  useSelectMenuDismiss(open, rootRef, listRef, setOpen);
  useSelectMenuScrollActive(open, value, listRef);

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (canSearch) {
      setSearch((prev) => (open ? prev + e.key : e.key));
      setOpen(true);
      return;
    }
    const hit = resolvedItems.find((opt) => optionStartsWith(opt, e.key.toLowerCase()));
    if (hit) onChange(hit.value);
  }

  return {
    fieldId,
    triggerId: `${fieldId}-trigger`,
    rootRef,
    listRef,
    searchRef,
    open,
    setOpen,
    pos,
    mounted,
    search,
    setSearch,
    filteredItems,
    selectedLabel,
    canSearch,
    showSuggestions,
    resolvedItems,
    onTriggerKey,
  };
}

function useSelectMenuOpenEffects(
  open: boolean,
  canSearch: boolean,
  searchRef: React.RefObject<HTMLInputElement | null>,
  setSearch: (v: string) => void,
) {
  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    if (!canSearch) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, canSearch, searchRef, setSearch]);
}

function useSelectMenuPosition(
  open: boolean,
  canSearch: boolean,
  showSuggestions: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
  setPos: (p: SelectMenuPos | null) => void,
) {
  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const el = rootRef.current;
      if (!el) return;
      setPos(measureSelectMenuPos(el, canSearch || showSuggestions));
    }
    updatePosition();
    function onReposition() {
      updatePosition();
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, canSearch, showSuggestions, rootRef, setPos]);
}

function useSelectMenuDismiss(
  open: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
  listRef: React.RefObject<HTMLDivElement | null>,
  setOpen: (v: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, rootRef, listRef, setOpen]);
}

function useSelectMenuScrollActive(
  open: boolean,
  value: string,
  listRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [open, value, listRef]);
}