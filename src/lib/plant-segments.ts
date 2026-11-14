import type { PlantSegment, PlantSegmentKind } from "./plant-segments-types";
import { PLANT_SEGMENTS } from "./plant-segments-catalog";

export type { PlantSegment, PlantSegmentItem, PlantSegmentKind } from "./plant-segments-types";
export { PLANT_SEGMENTS } from "./plant-segments-catalog";

const byCode = new Map(
  PLANT_SEGMENTS.map((s) => [s.code.toUpperCase(), s] as const),
);

byCode.set("SIGNALLING", byCode.get("QUAD")!);
byCode.set("QUADSIGNAL", byCode.get("QUAD")!);

export function getPlantSegment(code: string | null | undefined): PlantSegment | null {
  if (code == null || typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return byCode.get(normalized) ?? null;
}

export function getPlantDisplayName(
  code: string | null | undefined,
  fallbackName?: string | null,
): string {
  if (code != null && typeof code !== "string") {
    return typeof fallbackName === "string" ? fallbackName.trim() : "";
  }
  return getPlantSegment(code)?.name ?? fallbackName?.trim() ?? code?.trim() ?? "";
}

export function isLegacyMergedPlantCode(code: string | null | undefined): boolean {
  return code?.trim().toUpperCase() === "SIGNALLING";
}

export function getPlantRmSummary(code: string | null | undefined): string {
  return getPlantSegment(code)?.rmSummary ?? "";
}

export function listPlantSeeds(): Array<{ code: string; name: string }> {
  return [...PLANT_SEGMENTS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, name }) => ({ code, name }));
}

type FlatRow = {
  sortOrder: number;
  plantCode: string;
  plantName: string;
  kind: PlantSegmentKind;
  itemName: string;
  unit: string;
  note: string;
};

function pushSegItems(
  rows: FlatRow[],
  seg: PlantSegment,
  kind: PlantSegmentKind,
  items: PlantSegment["rawMaterials"],
) {
  for (const item of items) {
    rows.push({
      sortOrder: seg.sortOrder,
      plantCode: seg.code,
      plantName: seg.name,
      kind,
      itemName: item.name,
      unit: item.unit ?? "",
      note: item.note ?? "",
    });
  }
}

export function flattenPlantSegmentRows(): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const seg of [...PLANT_SEGMENTS].sort((a, b) => a.sortOrder - b.sortOrder)) {
    pushSegItems(rows, seg, "RM", seg.rawMaterials);
    pushSegItems(rows, seg, "FG", seg.finalProducts);
  }
  return rows;
}
