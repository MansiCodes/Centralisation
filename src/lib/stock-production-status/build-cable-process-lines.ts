import {
  getQuadSignalCableProcesses,
  quadSignalClosingFromMeta,
  type QuadSignalStockMeta,
} from "@/lib/plant-catalogs";
import { getQuadFactorFromSize, isQuadCableName, isSignallingCableName } from "@/lib/quad-signal-wip";
import { isPowerCableName } from "@/lib/power-cable";
import {
  processQtyFromMeta,
  stageClosingFromMeta,
} from "@/lib/quad-signal-opening-match";
import {
  formClosingByProcess,
  sessionPutupKmFromItems,
} from "@/lib/quad-signal-form-stock";
import {
  isOuterProcess,
  outerClosingAfterPutup,
  outerProcessClosing,
  sessionOuterDeductKm,
  shortProcessName,
} from "./format";
import type { StockProcessLine } from "./types";

function singleQuadClosingFromMeta(
  meta: QuadSignalStockMeta,
  size: string,
  storedClosing: number,
): number {
  const opening = processQtyFromMeta(meta.opening, "Single Quad");
  const prod = processQtyFromMeta(meta.production, "Single Quad");
  const laying = processQtyFromMeta(meta.production, "Laying");
  const outbound = laying * getQuadFactorFromSize(size);
  if (opening === 0 && prod === 0 && laying === 0) return storedClosing;
  return Math.round((opening + prod - outbound) * 1000) / 1000;
}

function quadSignalProcessLines(
  meta: QuadSignalStockMeta,
  names: string[],
  size: string,
): StockProcessLine[] {
  const production = meta.production ?? {};
  const closing = quadSignalClosingFromMeta(meta);
  const putupKm = sessionPutupKmFromItems(
    (meta.callPutupItems ?? []).slice(
      Math.max(0, Math.floor(Number(meta.callPutupCarriedCount) || 0)),
    ),
  );
  const by = formClosingByProcess(names, meta.opening, production, putupKm);
  return names.map((name) => {
    const stored = processQtyFromMeta(closing, name);
    const closingQty =
      name.trim().toLowerCase() === "single quad"
        ? singleQuadClosingFromMeta(meta, size, stored)
        : (by[name] ?? stored);
    return {
      name,
      shortName: shortProcessName(name),
      closing: Math.round(closingQty * 1000) / 1000,
      production: processQtyFromMeta(production, name),
    };
  });
}

function powerInsulationClosing(
  meta: QuadSignalStockMeta,
  prod: number,
  stored: number,
): number {
  const factor = Number(meta.powerLayingFactor);
  const laying = processQtyFromMeta(meta.production, "Laying");
  if (Number.isFinite(factor) && factor > 0) {
    const open = processQtyFromMeta(meta.opening, "Insulation");
    return Math.round((open + prod - laying * factor) * 1000) / 1000;
  }
  return stored;
}

function defaultProcessLines(
  meta: QuadSignalStockMeta,
  cable: string,
  size: string,
  names: string[],
): StockProcessLine[] {
  const production = meta.production ?? {};
  const closing = quadSignalClosingFromMeta(meta);
  return names.map((name, i) => {
    const prod = processQtyFromMeta(production, name);
    const stored = processQtyFromMeta(closing, name);
    const nextName = names[i + 1];
    let closingQty = stored;
    if (name.trim().toLowerCase() === "single quad") {
      closingQty = singleQuadClosingFromMeta(meta, size, stored);
    } else if (isPowerCableName(cable) && name.trim().toLowerCase() === "insulation") {
      closingQty = powerInsulationClosing(meta, prod, stored);
    } else {
      closingQty = stageClosingFromMeta(meta, name, nextName) ?? stored;
    }
    return {
      name,
      shortName: shortProcessName(name),
      closing: Math.round(closingQty * 1000) / 1000,
      production: prod,
    };
  });
}

export function processLinesFromMeta(
  meta: QuadSignalStockMeta,
  cable: string,
  size: string,
): StockProcessLine[] {
  const procs = [...getQuadSignalCableProcesses(cable)];
  const production = meta.production ?? {};
  const closing = quadSignalClosingFromMeta(meta);
  let names =
    procs.length > 0
      ? procs
      : Array.from(new Set([...Object.keys(closing), ...Object.keys(production)]));
  if (isSignallingCableName(cable) || isQuadCableName(cable)) {
    names = names.filter((n) => n.trim().toLowerCase() !== "insulation");
  }
  if (isSignallingCableName(cable) || isQuadCableName(cable)) {
    return quadSignalProcessLines(meta, names, size);
  }
  return defaultProcessLines(meta, cable, size, names);
}

export function totalKmFromProcesses(
  processes: StockProcessLine[],
  totalPutupKm: number,
): number {
  const totalKm = processes.reduce((s, p) => {
    const n = p.name.trim().toLowerCase();
    if (n === "insulation" || n === "single quad") return s;
    if (isOuterProcess(p.name)) {
      return s + outerClosingAfterPutup(p.closing, totalPutupKm);
    }
    return s + p.closing;
  }, 0);
  return Math.round(totalKm * 1000) / 1000;
}

export function blockTotalKm(
  processes: StockProcessLine[],
  outerClosingIncludesPutup: boolean | undefined,
  callPutupItems: { qty: number }[] | undefined,
): number {
  return totalKmFromProcesses(
    processes,
    sessionOuterDeductKm(
      outerClosingIncludesPutup,
      callPutupItems,
      outerProcessClosing(processes),
    ),
  );
}