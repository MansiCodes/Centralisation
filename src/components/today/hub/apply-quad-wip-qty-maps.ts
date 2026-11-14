import { isPowerCableName } from "@/lib/power-cable";
import type {
  ApplyQuadWipOpts,
  QuadWipContextData,
  QuadWipSetters,
} from "./quad-wip-context-types";

function isInsulationKey(key: string) {
  return key.trim().toLowerCase() === "insulation";
}

function insulationQty(
  maps: Array<Record<string, number> | undefined | null>,
): string | null {
  for (const map of maps) {
    if (!map) continue;
    for (const [key, raw] of Object.entries(map)) {
      if (!isInsulationKey(key)) continue;
      const n = Number(raw);
      if (Number.isFinite(n)) return String(n);
    }
  }
  return null;
}

const PROCESS_ALIASES: Record<string, string> = {
  Outer: "Outer Sheath",
  outer: "Outer Sheath",
  "outer sheath": "Outer Sheath",
  Inner: "Inner Sheath",
  inner: "Inner Sheath",
  "inner sheath": "Inner Sheath",
  Armoring: "Armouring",
  armoring: "Armouring",
};

function toOpeningStrings(
  data: QuadWipContextData,
  isPower: boolean,
): Record<string, string> {
  const openingStrings: Record<string, string> = {};
  const putOpening = (map?: Record<string, number> | null) => {
    if (!map) return;
    for (const [key, raw] of Object.entries(map)) {
      if (!isPower && isInsulationKey(key)) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      openingStrings[key] = String(n);
      const canon = PROCESS_ALIASES[key] ?? PROCESS_ALIASES[key.trim().toLowerCase()];
      if (canon) openingStrings[canon] = String(n);
    }
  };
  putOpening(data.opening);
  if (data.sameDay) putOpening(data.stockMeta?.opening);
  return openingStrings;
}

function toProdMap(
  src: Record<string, number> | undefined,
  isPower: boolean,
): Record<string, string> {
  const productionStrings: Record<string, string> = {};
  for (const [key, raw] of Object.entries(src ?? {})) {
    if (!isPower && isInsulationKey(key)) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) continue;
    productionStrings[key] = String(n);
    const canon = PROCESS_ALIASES[key] ?? PROCESS_ALIASES[key.trim().toLowerCase()];
    if (canon && (isPower || !isInsulationKey(canon))) {
      productionStrings[canon] = String(n);
    }
  }
  return productionStrings;
}

export function applyQtyMaps(
  s: QuadWipSetters,
  data: QuadWipContextData,
  opts?: ApplyQuadWipOpts,
) {
  const preserveIns = Boolean(opts?.preserveInsulation);
  const isPower = isPowerCableName(data.cable ?? "");
  const savedOpen = data.stockMeta?.opening;
  const openingStrings = toOpeningStrings(data, isPower);
  const insOpen = insulationQty(data.sameDay ? [savedOpen, data.opening] : [data.opening]);
  s.setStockWipOpening((prev) => {
    const next = { ...openingStrings };
    if (preserveIns && prev.Insulation != null && prev.Insulation !== "") {
      next.Insulation = prev.Insulation;
    } else if (insOpen != null) {
      next.Insulation = insOpen;
    }
    return next;
  });
  s.setStockProcessHints(toProdMap(data.productionHints ?? data.production, isPower));
  s.setStockProcessQtys(data.sameDay ? toProdMap(data.production, isPower) : {});
}