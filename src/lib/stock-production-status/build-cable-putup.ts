import type { QuadSignalStockMeta } from "@/lib/plant-catalogs";
import { parsePutupKm } from "./format";

export type PutupRow = {
  qty: number;
  callPutup: string;
  putupDate: string;
  partyName: string;
};

function normalizePutupDate(date: string): string {
  const s = String(date ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1]!;
  return s.toLowerCase().replace(/[^0-9]/g, "");
}

function putupPartyKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function putupMergeKey(item: PutupRow): string {
  const party = putupPartyKey(item.partyName);
  const date = normalizePutupDate(item.putupDate);
  const qty = String(Math.round(item.qty * 1000) / 1000);
  if (party && date) return `${party}|${date}|${qty}`;
  if (party) return `${party}|${qty}`;
  return `|${date}|${qty}`;
}

function isSamePutup(a: PutupRow, b: PutupRow): boolean {
  const pa = putupPartyKey(a.partyName);
  const pb = putupPartyKey(b.partyName);
  if (!pa || !pb) return false;
  if (pa !== pb && !pa.includes(pb) && !pb.includes(pa)) return false;
  if (Math.round(a.qty * 1000) !== Math.round(b.qty * 1000)) return false;
  const da = normalizePutupDate(a.putupDate);
  const db = normalizePutupDate(b.putupDate);
  return !da || !db || da === db;
}

export function mergeOrderPutups(into: PutupRow[], extras: PutupRow[]): PutupRow[] {
  const seen = new Set(into.map(putupMergeKey));
  const next = [...into];
  for (const item of extras) {
    const key = putupMergeKey(item);
    if (key && seen.has(key)) continue;
    if (next.some((row) => isSamePutup(row, item))) continue;
    if (key) seen.add(key);
    next.push(item);
  }
  return next;
}

export function putupItemsFromMeta(meta: QuadSignalStockMeta): PutupRow[] {
  const legacyPutupKm = parsePutupKm(meta.callPutup);
  const callPutup = String(meta.callPutup ?? "").trim();
  const putupDate = String(meta.putupDate ?? "").trim();
  const partyName = String(meta.partyName ?? "").trim();
  const rawPutupItems =
    Array.isArray(meta.callPutupItems) && meta.callPutupItems.length > 0
      ? meta.callPutupItems
      : legacyPutupKm > 0 || callPutup || partyName
        ? [{ qty: legacyPutupKm > 0 ? legacyPutupKm : callPutup, date: putupDate, partyName }]
        : [];
  return rawPutupItems
    .map((item) => {
      const q = Number(item.qty);
      const qty = Number.isFinite(q) && q > 0 ? q : 0;
      const callPutupStr = String(item.qty ?? "").trim();
      const pDate = String(item.date ?? putupDate ?? "").trim();
      const pName = String(item.partyName ?? partyName ?? "").trim();
      return {
        qty,
        callPutup: callPutupStr ? `${callPutupStr}km` : "",
        putupDate: pDate,
        partyName: pName,
      };
    })
    .filter((item) => item.qty > 0);
}