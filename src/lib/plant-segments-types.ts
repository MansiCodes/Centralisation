/**
 * Step-1 business-segment map: plants ↔ raw materials ↔ final product types.
 * DB `code` stays stable for existing data; `name` is the display label.
 *
 * Draft lists for new plants (Upcast / SL SSL / Quad + Signal / Rope light) are
 * industry-typical starters — refine before locking BOMs (Step 2).
 */

export type PlantSegmentKind = "RM" | "FG";

export type PlantSegmentItem = {
  name: string;
  kind: PlantSegmentKind;
  /** Optional unit hint for stock / BOM later */
  unit?: string;
  note?: string;
};

export type PlantSegment = {
  code: string;
  name: string;
  /** Short label shown under the plant name when opening / choosing */
  rmSummary: string;
  sortOrder: number;
  rawMaterials: PlantSegmentItem[];
  finalProducts: PlantSegmentItem[];
};
