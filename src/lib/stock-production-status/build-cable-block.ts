import {
  quadSignalCableSizeDedupeKey,
  parseQuadSignalStockNotes,
  type QuadSignalStockMeta,
} from "@/lib/plant-catalogs";
import { toIstDateString } from "@/lib/dates";
import { collapseDispatchRows } from "./dispatch-history";
import { familyInsulationCandidate } from "./build-cable-insulation";
import {
  mergeOrderPutups,
  putupItemsFromMeta,
  type PutupRow,
} from "./build-cable-putup";
import { blockTotalKm, processLinesFromMeta } from "./build-cable-process-lines";
import type { CableStockStatusBlock, SharedInsulationStatus } from "./types";

type StockRow = {
  id: string;
  date: Date;
  itemName: string;
  notes?: string | null;
};

export function cableBlockFromRow(
  row: StockRow,
  meta: QuadSignalStockMeta,
  userNotes: string,
): {
  key: string;
  block: CableStockStatusBlock;
  sig: SharedInsulationStatus | null;
  quad: SharedInsulationStatus | null;
} | null {
  const cable = meta.cable!.trim();
  const size = meta.size!.trim();
  const entryDate = toIstDateString(row.date);
  const sig = familyInsulationCandidate(cable, meta, entryDate, "signalling");
  const qd = familyInsulationCandidate(cable, meta, entryDate, "quad");
  const callPutupItems = putupItemsFromMeta(meta);
  const block = buildBlock(meta, cable, size, entryDate, userNotes, callPutupItems);
  return {
    key: quadSignalCableSizeDedupeKey(cable, size),
    block,
    sig,
    quad: qd,
  };
}

function buildBlock(
  meta: QuadSignalStockMeta,
  cable: string,
  size: string,
  entryDate: string,
  userNotes: string,
  callPutupItems: PutupRow[],
): CableStockStatusBlock {
  const callPutup = String(meta.callPutup ?? "").trim();
  const putupDate = String(meta.putupDate ?? "").trim();
  const partyName = String(meta.partyName ?? "").trim();
  const dispatchParty = String(meta.dispatchParty ?? "").trim();
  const dispatchRaw = Number(meta.dispatchPending);
  const dispatchPending =
    Number.isFinite(dispatchRaw) && dispatchRaw > 0 ? dispatchRaw : 0;
  const totalPutupKm = callPutupItems.reduce((sum, item) => sum + item.qty, 0);
  const dispatchPendingItems = dispatchItems(meta, dispatchPending, dispatchParty);
  const totalDispatchPending = dispatchPendingItems.reduce((sum, item) => sum + item.qty, 0);
  const processes = processLinesFromMeta(meta, cable, size);
  const totalKm = blockTotalKm(
    processes,
    Boolean(meta.outerClosingIncludesPutup),
    callPutupItems,
  );

  return {
    key: `${cable} · ${size}`,
    cable,
    size,
    entryDate,
    processes,
    totalKm: Math.round(totalKm * 1000) / 1000,
    salesKm: Number(meta.salesKm) || 0,
    putupKm: Math.round(totalPutupKm * 1000) / 1000,
    callPutup,
    putupDate,
    partyName,
    dispatchParty,
    dispatchPending: Math.round(totalDispatchPending * 1000) / 1000,
    dispatchSettledKm: 0,
    dispatchSettledItems: [],
    userNotes: String(userNotes ?? "").trim(),
    callPutupItems,
    orderPutupItems: [...callPutupItems],
    outerClosingIncludesPutup: Boolean(meta.outerClosingIncludesPutup),
    dispatchPendingItems,
  };
}

function dispatchItems(
  meta: QuadSignalStockMeta,
  dispatchPending: number,
  dispatchParty: string,
) {
  const raw =
    Array.isArray(meta.dispatchPendingItems) && meta.dispatchPendingItems.length > 0
      ? meta.dispatchPendingItems
      : dispatchPending > 0 || dispatchParty
        ? [{ qty: dispatchPending, partyName: dispatchParty }]
        : [];
  return collapseDispatchRows(
    raw.map((item) => ({
      qty: item.qty,
      partyName: String(item.partyName ?? dispatchParty ?? "").trim(),
    })),
  );
}

export function finalizeCableBlocks(blocks: CableStockStatusBlock[]) {
  for (const block of blocks) {
    const sessionPutupKm = Math.round(
      (block.callPutupItems ?? []).reduce((sum, item) => sum + item.qty, 0) * 1000,
    ) / 1000;
    block.putupKm = sessionPutupKm;
    block.totalKm = blockTotalKm(
      block.processes,
      Boolean(block.outerClosingIncludesPutup),
      block.callPutupItems,
    );
  }
}