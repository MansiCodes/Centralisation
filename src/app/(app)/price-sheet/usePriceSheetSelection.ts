import { useMemo, useState } from "react";
import { rateRowKey } from "@/lib/price-sheet-share";
import type { CableRate } from "@/lib/sheets/types";

export function usePriceSheetSelection(filtered: CableRate[]) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkSelectValue, setBulkSelectValue] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const filteredKeys = useMemo(
    () => filtered.map((row) => rateRowKey(row)),
    [filtered],
  );

  const selectedRows = useMemo(
    () => filtered.filter((row) => selectedKeys.has(rateRowKey(row))),
    [filtered, selectedKeys],
  );

  function toggleRow(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }

  function handleShareClick() {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }
    if (selectedRows.length === 0) {
      exitSelectionMode();
      return;
    }
    setShareOpen(true);
  }

  function selectAllFiltered() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of filteredKeys) next.add(key);
      return next;
    });
  }

  function deselectAllFiltered() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of filteredKeys) next.delete(key);
      return next;
    });
  }

  function onSelectionMenuChange(value: string) {
    if (value === "Select All") selectAllFiltered();
    else if (value === "Deselect All") deselectAllFiltered();
    setBulkSelectValue("");
  }

  function handleShareComplete() {
    exitSelectionMode();
  }

  const shareButtonLabel =
    selectionMode && selectedRows.length > 0
      ? `Share (${selectedRows.length})`
      : "Share";
  const tableColSpan = selectionMode ? 9 : 8;

  return {
    selectedKeys,
    selectionMode,
    bulkSelectValue,
    shareOpen,
    setShareOpen,
    selectedRows,
    shareButtonLabel,
    tableColSpan,
    toggleRow,
    handleShareClick,
    onSelectionMenuChange,
    handleShareComplete,
  };
}