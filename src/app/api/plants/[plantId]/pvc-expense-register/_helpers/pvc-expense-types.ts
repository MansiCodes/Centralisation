export type PvcExpenseRegisterRow = {
  id: string;
  expenseLabel: string;
  sortDate: string;
  periodLabel: string;
  description: string;
  details: string | null;
  amount: number;
  source: "electricityRent" | "pettyCash" | "fixedAsset";
  billPhotoUrl?: string | null;
  billPhotoUrls?: string[];
};