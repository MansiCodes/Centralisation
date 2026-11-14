"use client";

import { useMemo, useState } from "react";
import { PriceSheetShareModal } from "@/app/(app)/price-sheet/PriceSheetShareModal";
import { PriceSheetToolbar } from "@/app/(app)/price-sheet/PriceSheetToolbar";
import { PriceSheetTable } from "@/app/(app)/price-sheet/PriceSheetTable";
import { PriceSheetMobileList } from "@/app/(app)/price-sheet/PriceSheetMobileList";
import { PriceSheetPagination } from "@/app/(app)/price-sheet/PriceSheetPagination";
import { buildPageList, downloadRatesCsv } from "@/app/(app)/price-sheet/price-sheet-utils";
import { usePriceSheetRates } from "@/app/(app)/price-sheet/usePriceSheetRates";
import { usePriceSheetSelection } from "@/app/(app)/price-sheet/usePriceSheetSelection";
import "./price-sheet.css";
import "./price-sheet-share.css";

export default function PriceSheetPage() {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { rates, loading, syncing, error, isCompact, syncFromSheet } =
    usePriceSheetRates();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        String(row.sNo ?? "").includes(q) ||
        String(row.specification || "").toLowerCase().includes(q) ||
        String(row.specificationFull || "").toLowerCase().includes(q),
    );
  }, [rates, query]);

  const selection = usePriceSheetSelection(filtered);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageList = buildPageList(totalPages, safePage, isCompact);

  const exportCsv = () => downloadRatesCsv(filtered);

  const emptyMessage = rates.length
    ? "No cables matched your search."
    : error || "No rates loaded.";

  const skeletonRows = Math.max(6, Math.min(pageSize, 12));

  return (
    <div className="ps-root">
      <div className="ps-atmosphere" aria-hidden="true" />

      <div className="ps-app">
        <PriceSheetToolbar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          syncing={syncing}
          selectionMode={selection.selectionMode}
          shareButtonLabel={selection.shareButtonLabel}
          selectedCount={selection.selectedRows.length}
          onSync={() => void syncFromSheet({ showSkeleton: true })}
          onShare={selection.handleShareClick}
          onExport={exportCsv}
        />

        <main className="ps-main">
          <PriceSheetTable
            loading={loading}
            pageItems={pageItems}
            skeletonRows={skeletonRows}
            selectionMode={selection.selectionMode}
            selectedKeys={selection.selectedKeys}
            bulkSelectValue={selection.bulkSelectValue}
            tableColSpan={selection.tableColSpan}
            emptyMessage={emptyMessage}
            onSelectionMenuChange={selection.onSelectionMenuChange}
            onToggleRow={selection.toggleRow}
          />
          <PriceSheetMobileList
            loading={loading}
            pageItems={pageItems}
            selectionMode={selection.selectionMode}
            selectedKeys={selection.selectedKeys}
            bulkSelectValue={selection.bulkSelectValue}
            emptyMessage={emptyMessage}
            onSelectionMenuChange={selection.onSelectionMenuChange}
            onToggleRow={selection.toggleRow}
          />
        </main>

        <PriceSheetPagination
          pageSize={pageSize}
          pageList={pageList}
          safePage={safePage}
          totalPages={totalPages}
          loading={loading}
          filteredLength={filtered.length}
          isCompact={isCompact}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
        />
      </div>

      <PriceSheetShareModal
        open={selection.shareOpen}
        selectedRows={selection.selectedRows}
        onClose={() => selection.setShareOpen(false)}
        onShared={selection.handleShareComplete}
      />
    </div>
  );
}