import {
  frozenCallPutupKm,
  mergeNoteCallPutups,
  type NoteCallPutup,
} from "@/components/today/hub/process-row-out-label";
import { parseQuadSignalStockNotes } from "@/lib/plant-catalogs";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { isPowerCableName } from "@/lib/power-cable";
import {
  callPutupsFromNotes,
  outerClosingTookPutup,
  stripInsulationQty,
} from "./quad-wip-context-helpers";

type StockNotesRow = { notes: string | null };

export async function resolveQuadWipCallPutups(params: {
  pScope: Prisma.StockEntryWhereInput;
  day: Date;
  itemName: string;
  cable: string;
  existingStock: StockNotesRow | null;
  todayStocks: StockNotesRow[];
  latestStock: StockNotesRow | null;
  existingMeta: ReturnType<typeof parseQuadSignalStockNotes>["meta"];
}) {
  const {
    pScope,
    day,
    itemName,
    cable,
    existingStock,
    todayStocks,
    latestStock,
    existingMeta,
  } = params;
  const putupsAlreadyClosed = Boolean(
    existingMeta?.kind === "cable" && existingMeta.outerClosingIncludesPutup,
  );
  const latestPutups = callPutupsFromNotes(latestStock?.notes);

  let callPutupItems: NoteCallPutup[] = [];
  let callPutupCarriedItems: NoteCallPutup[] = [];
  const carriedCount =
    existingMeta?.kind === "cable"
      ? Math.max(0, Math.floor(Number(existingMeta.callPutupCarriedCount) || 0))
      : 0;
  if (existingStock && carriedCount > 0) {
    callPutupCarriedItems = latestPutups.slice(0, carriedCount);
    callPutupItems = latestPutups.slice(carriedCount);
  } else if (existingStock) {
    const todayItems = mergeNoteCallPutups(
      todayStocks.flatMap((row) => callPutupsFromNotes(row.notes)),
    );
    callPutupItems = todayItems.length > 0 ? todayItems : latestPutups;
    if (
      callPutupItems.length > 0 &&
      putupsAlreadyClosed &&
      existingMeta?.kind === "cable" &&
      !outerClosingTookPutup(existingMeta)
    ) {
      callPutupCarriedItems = callPutupItems;
      callPutupItems = [];
    }
    if (callPutupItems.length === 0) {
      const prevStock = await prisma.stockEntry.findFirst({
        where: { ...pScope, itemName, date: { lt: day } },
        orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
        select: { notes: true },
      });
      const { meta: prevMeta } = parseQuadSignalStockNotes(prevStock?.notes);
      const prevPutups = callPutupsFromNotes(prevStock?.notes);
      if (prevMeta?.kind === "cable" && prevMeta.outerClosingIncludesPutup) {
        callPutupCarriedItems = prevPutups;
      } else {
        callPutupItems = prevPutups;
      }
    }
  } else if (putupsAlreadyClosed) {
    callPutupCarriedItems = latestPutups;
  } else {
    callPutupItems = latestPutups;
  }
  const loadPutups = callPutupItems.length > 0;
  const callPutupOriginalKm = loadPutups
    ? frozenCallPutupKm(
        existingMeta?.kind === "cable" ? existingMeta.callPutupOriginalKm : 0,
        callPutupItems,
      )
    : 0;

  const stockMeta =
    existingMeta?.kind === "cable"
      ? {
          callPutup: loadPutups
            ? callPutupItems[0]?.qty != null
              ? String(callPutupItems[0].qty)
              : existingMeta.callPutup ?? ""
            : "",
          putupDate: loadPutups
            ? callPutupItems[0]?.date ?? existingMeta.putupDate ?? ""
            : "",
          partyName: loadPutups
            ? callPutupItems[0]?.partyName ?? existingMeta.partyName ?? ""
            : "",
          dispatchPending:
            existingMeta.dispatchPending != null
              ? String(existingMeta.dispatchPending)
              : "",
          dispatchParty: existingMeta.dispatchParty ?? "",
          callPutupItems,
          callPutupCarriedItems,
          callPutupOriginalKm,
          dispatchPendingItems: existingMeta.dispatchPendingItems ?? [],
          dispatchSettledKm: existingMeta.dispatchSettledKm ?? 0,
          dispatchSettledItems: existingMeta.dispatchSettledItems ?? [],
          outerClosingIncludesPutup: Boolean(existingMeta.outerClosingIncludesPutup),
          saleItems: existingMeta.saleItems ?? [],
          opening: isPowerCableName(cable)
            ? (existingMeta.opening ?? {})
            : stripInsulationQty(existingMeta.opening ?? {}),
          production: isPowerCableName(cable)
            ? (existingMeta.production ?? {})
            : stripInsulationQty(existingMeta.production ?? {}),
          powerLayingFactor: existingMeta.powerLayingFactor,
        }
      : null;

  return { stockMeta, loadPutups, callPutupItems, callPutupCarriedItems };
}