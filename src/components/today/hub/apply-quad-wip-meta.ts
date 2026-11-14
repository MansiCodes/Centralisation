import { EMPTY_STOCK_SALE_ITEM } from "@/components/today/hub/useTodayHubStockCallFields";
import type { StockSaleItem } from "@/components/today/today-hub-model";
import { liveDispatchLock } from "@/lib/stock-production-status/dispatch-history";
import type { QuadWipSetters } from "./quad-wip-context-types";

function sumPositiveQty(items: Array<{ qty: string }>): number {
  return items.reduce((sum, item) => {
    const n = Number(item.qty);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

export function applyCallPutupFromMeta(
  s: QuadWipSetters,
  meta: {
    callPutup: string;
    putupDate: string;
    partyName: string;
    callPutupItems?: Array<{ qty: number | string; date?: string; partyName?: string }>;
    callPutupCarriedItems?: Array<{ qty: number | string; date?: string; partyName?: string }>;
    callPutupOriginalKm?: number;
  } | null,
) {
  const rawPutups = meta?.callPutupItems;
  let items: Array<{ qty: string; date: string; partyName: string }> = [];
  if (Array.isArray(rawPutups) && rawPutups.length > 0) {
    items = rawPutups.map((p) => ({
      qty: p.qty != null ? String(p.qty) : "",
      date: p.date ?? "",
      partyName: p.partyName ?? "",
    }));
  } else if (rawPutups == null && (meta?.callPutup || meta?.putupDate || meta?.partyName)) {
    items = [{
      qty: meta.callPutup ?? "",
      date: meta.putupDate ?? "",
      partyName: meta.partyName ?? "",
    }];
  }
  const formKm = sumPositiveQty(items);
  const original = Number(meta?.callPutupOriginalKm);
  s.setStockCallPutupLoadedItems(
    (meta?.callPutupCarriedItems ?? []).map((p) => ({
      qty: p.qty != null ? String(p.qty) : "",
      date: p.date ?? "",
      partyName: p.partyName ?? "",
    })),
  );
  s.setStockCallPutupLoadedKm(
    Number.isFinite(original) && original > 0 ? Math.max(original, formKm) : formKm,
  );
  s.setStockCallPutupItems(
    items.length > 0 ? items : [{ qty: "", date: "", partyName: "" }],
  );
}

export function applyDispatchFromMeta(
  s: QuadWipSetters,
  meta: {
    dispatchPending: string;
    dispatchParty: string;
    dispatchPendingItems?: Array<{ qty: number | string; partyName?: string }>;
    dispatchSettledKm?: number;
    dispatchSettledItems?: Array<{ qty: number | string; partyName?: string }>;
  } | null,
) {
  const rawDispatches = meta?.dispatchPendingItems;
  let loadedItems: Array<{ qty: string; partyName: string }> = [];
  if (Array.isArray(rawDispatches) && rawDispatches.length > 0) {
    loadedItems = rawDispatches.map((d) => ({
      qty: d.qty != null ? String(d.qty) : "",
      partyName: d.partyName ?? "",
    }));
    s.setStockDispatchPendingItems(loadedItems);
  } else if (meta?.dispatchPending || meta?.dispatchParty) {
    loadedItems = [{
      qty: meta.dispatchPending ?? "",
      partyName: meta.dispatchParty ?? "",
    }];
    s.setStockDispatchPendingItems(loadedItems);
  } else {
    s.setStockDispatchPendingItems([{ qty: "", partyName: "" }]);
  }
  const formKm = loadedItems.reduce((sum, d) => {
    const q = Number(d.qty);
    return sum + (Number.isFinite(q) && q > 0 ? q : 0);
  }, 0);
  const locked = liveDispatchLock(
    loadedItems,
    loadedItems,
    Array.isArray(meta?.dispatchSettledItems) ? meta.dispatchSettledItems : [],
  );
  const settledItems = locked.settledItems.map((d) => ({
    qty: String(d.qty),
    partyName: d.dispatchParty,
  }));
  s.setStockDispatchLoadedKm(formKm);
  s.setStockDispatchLoadedItems(loadedItems);
  s.setStockDispatchSettledKm(locked.settledKm);
  s.setStockDispatchSettledItems(settledItems);
}

function saleHintFromMeta(row: {
  invoiceNo?: string;
  date?: string;
  partyName?: string;
  rate?: number | string;
  quantity?: number | string;
  gstPercent?: number | string;
}): StockSaleItem {
  return {
    invoiceNo: String(row.invoiceNo ?? "").trim(),
    date: String(row.date ?? "").trim(),
    partyName: String(row.partyName ?? "").trim(),
    rate: row.rate != null && String(row.rate).trim() !== "" ? String(row.rate) : "",
    quantity: row.quantity != null && String(row.quantity).trim() !== "" ? String(row.quantity) : "",
    gstPercent:
      row.gstPercent != null && String(row.gstPercent).trim() !== "" ? String(row.gstPercent) : "",
  };
}

function saleHintHasValue(row: StockSaleItem) {
  return Boolean(
    row.invoiceNo || row.date || row.partyName || row.rate || row.quantity || row.gstPercent,
  );
}

export function applySaleFromMeta(
  s: QuadWipSetters,
  meta: {
    saleItems?: Array<{
      invoiceNo?: string;
      date?: string;
      partyName?: string;
      rate?: number | string;
      quantity?: number | string;
      gstPercent?: number | string;
    }>;
  } | null,
) {
  const raw = meta?.saleItems;
  const hints =
    Array.isArray(raw) && raw.length > 0
      ? raw.map(saleHintFromMeta).filter(saleHintHasValue)
      : [];
  s.setStockSaleHints(hints);
  s.setStockSaleItems(
    hints.length > 0
      ? hints.map(() => ({ ...EMPTY_STOCK_SALE_ITEM }))
      : [{ ...EMPTY_STOCK_SALE_ITEM }],
  );
}

export function applyLengthOptions(
  s: QuadWipSetters,
  variant: {
    lengthFactor: number;
    drumLabel?: string;
    lengthOptions?: Array<{ label: string; lengthFactor: number }>;
  } | null,
) {
  if (!variant) {
    s.setStockLengthOptions([]);
    s.setStockLengthFactor(null);
    return;
  }
  const opts =
    variant.lengthOptions && variant.lengthOptions.length > 0
      ? variant.lengthOptions
      : [{ label: variant.drumLabel || "Default", lengthFactor: variant.lengthFactor }];
  s.setStockLengthOptions(opts);
  s.setStockLengthFactor((prev) => {
    if (prev != null && opts.some((o) => o.lengthFactor === prev)) return prev;
    return opts[0]?.lengthFactor ?? variant.lengthFactor;
  });
}