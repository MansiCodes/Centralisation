import type { StockCategory } from "@prisma/client";
import { round4 } from "@/lib/pnl/excel-import/cells";
import {
  encodeQuadSignalStockNotes,
  getQuadSignalCableProcesses,
  parseQuadSignalStockNotes,
  quadSignalClosingFromMeta,
} from "@/lib/plant-catalogs";
import {
  calculateQuadSignalWip,
  drumLabelToLengthFactor,
  parseDrumLengthOptions,
  resolveQuadSignalVariant,
} from "@/lib/quad-signal-wip";
import { stageClosingFromMeta } from "@/lib/quad-signal-opening-match";
import type { ParsedPnlWorkbook } from "@/lib/pnl/excel-import/parse";
import type { PersistCtx } from "@/lib/pnl/excel-import/persist-types";

type StockRow = ParsedPnlWorkbook["stock"][number];

export async function resolveQuadCablePersistFields(
  ctx: Pick<PersistCtx, "prisma" | "pScope">,
  row: StockRow,
  day: Date,
): Promise<{
  quantity: number;
  notes: string;
  category: StockCategory;
} | { skipReason: string }> {
  if (!row.qsCable || !row.qsSize) {
    return { skipReason: "Cable stock requires Item (cable) and Size" };
  }
  const processes = [...getQuadSignalCableProcesses(row.qsCable)];
  const production: Record<string, number> = {};
  const src = row.qsProduction ?? {};
  const aliasGroups: string[][] = [
    ["Conductor"],
    ["Insulation"],
    ["Single Quad"],
    ["Laying"],
    ["Inner Sheath", "Inner"],
    ["Screening"],
    ["Intermediate"],
    ["DST"],
    ["Outer Sheath", "Outer"],
    ["Armouring", "Armoring"],
  ];
  for (const p of processes) {
    const group =
      aliasGroups.find((g) => g.includes(p)) ??
      aliasGroups.find((g) =>
        g.some((x) => x.toLowerCase() === p.toLowerCase()),
      );
    let v = src[p];
    if (v == null && group) {
      for (const alt of group) {
        if (src[alt] != null) {
          v = src[alt];
          break;
        }
      }
    }
    production[p] = v ?? 0;
  }

  const prior = await ctx.prisma.stockEntry.findMany({
    where: {
      ...ctx.pScope,
      date: { lt: day },
      category: "FG",
      OR: [{ itemName: row.itemName }, { notes: { startsWith: "QSSTOCK:" } }],
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 250,
    select: { itemName: true, notes: true },
  });
  let opening: Record<string, number> = {};
  for (const p of prior) {
    const { meta } = parseQuadSignalStockNotes(p.notes);
    const same =
      p.itemName === row.itemName ||
      (meta?.kind === "cable" &&
        meta.cable === row.qsCable &&
        meta.size === row.qsSize);
    if (!same || meta?.kind !== "cable") continue;
    const closing = quadSignalClosingFromMeta(meta);
    let touched = false;
    const nextOpening = { ...closing };
    for (let i = 0; i < processes.length; i++) {
      const proc = processes[i]!;
      const fresh = stageClosingFromMeta(meta, proc, processes[i + 1]);
      if (fresh == null) continue;
      nextOpening[proc] = fresh;
      touched = true;
    }
    if (!touched) continue;
    opening = nextOpening;
    break;
  }

  const variant = resolveQuadSignalVariant(row.qsSize);
  let lengthFactor = variant?.lengthFactor ?? 1;
  let drumLabel = row.qsDrumLabel?.trim() || variant?.drumLabel || "";
  if (row.qsDrumLabel?.trim()) {
    const opts = parseDrumLengthOptions(row.qsDrumLabel);
    const hit = opts.find(
      (o) =>
        o.label.toLowerCase() === row.qsDrumLabel!.trim().toLowerCase() ||
        String(o.lengthFactor) === row.qsDrumLabel!.trim(),
    );
    if (hit) {
      lengthFactor = hit.lengthFactor;
      drumLabel = hit.label;
    } else {
      lengthFactor = drumLabelToLengthFactor(row.qsDrumLabel).lengthFactor;
      drumLabel = row.qsDrumLabel.trim();
    }
  }

  const salesKm = row.qsSalesKm ?? 0;
  const wip = calculateQuadSignalWip({
    processes,
    opening,
    production,
    salesKm,
    coreCount: variant?.coreCount ?? 1,
    lengthFactor,
  });
  let quantity = round4(row.quantity);
  if (wip.finishedProcess != null) {
    quantity = round4(wip.byProcess[wip.finishedProcess] ?? quantity);
  }
  const notes = encodeQuadSignalStockNotes(
    {
      v: 2,
      kind: "cable",
      cable: row.qsCable,
      size: row.qsSize,
      production,
      opening,
      closing: wip.byProcess,
      processes: wip.byProcess,
      salesKm,
      ...(row.qsCallPutup?.trim() ? { callPutup: row.qsCallPutup.trim() } : {}),
      ...(row.qsPutupDate?.trim() ? { putupDate: row.qsPutupDate.trim() } : {}),
      ...(row.qsPartyName?.trim() ? { partyName: row.qsPartyName.trim() } : {}),
      ...(row.qsDispatchPending != null
        ? { dispatchPending: row.qsDispatchPending }
        : {}),
      ...(row.qsDispatchParty?.trim()
        ? { dispatchParty: row.qsDispatchParty.trim() }
        : {}),
      calcSnapshot: {
        ...wip.calcSnapshot,
        drumLabel: drumLabel || undefined,
      },
    },
    row.notes?.trim() || `Closing stock as on ${row.date}`,
  );
  return { quantity, notes, category: "FG" as StockCategory };
}

export async function resolveQuadStockRow(
  ctx: PersistCtx,
  row: StockRow,
  day: Date,
  quantity: number,
): Promise<
  | null
  | { quantity: number; notes: string; category: StockCategory }
  | { skip: true }
> {
  if (row.qsKind === "raw") {
    return {
      quantity,
      notes: encodeQuadSignalStockNotes(
        { v: 1, kind: "raw" },
        row.notes?.trim() || `Closing stock as on ${row.date}`,
      ),
      category: "RM" as StockCategory,
    };
  }
  if (row.qsKind !== "cable") return null;
  const resolved = await resolveQuadCablePersistFields(
    { prisma: ctx.prisma, pScope: ctx.pScope },
    row,
    day,
  );
  if ("skipReason" in resolved) {
    ctx.summary.skipped.push({
      sheet: "Stock",
      row: row.row,
      reason: resolved.skipReason,
    });
    return { skip: true };
  }
  return resolved;
}