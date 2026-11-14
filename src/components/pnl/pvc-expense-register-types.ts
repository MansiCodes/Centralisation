export type PvcExpenseRow = {
  id: string;
  expenseLabel: string;
  sortDate: string;
  periodLabel: string;
  description: string;
  details: string | null;
  amount: number;
  source: string;
  billPhotoUrl?: string | null;
  billPhotoUrls?: string[];
};

export type RowEntityInfo = {
  rawId: string;
  source: "pettyCash" | "fixedAsset" | "electricityRent";
  field?: "rent" | "bill";
};

export function getRowEntityInfo(row: PvcExpenseRow): RowEntityInfo | null {
  if (row.source === "pettyCash") {
    const match = /^(?:petty|labour|salary)-(.+)$/.exec(row.id);
    return match ? { rawId: match[1], source: "pettyCash" } : null;
  }
  if (row.source === "fixedAsset") {
    const match = /^far-(.+)$/.exec(row.id);
    return match ? { rawId: match[1], source: "fixedAsset" } : null;
  }
  if (row.source === "electricityRent") {
    const match = /^elec-(rent|bill)-(.+)$/.exec(row.id);
    return match
      ? {
          rawId: match[2],
          source: "electricityRent",
          field: match[1] as "rent" | "bill",
        }
      : null;
  }
  return null;
}