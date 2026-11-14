import type { TodayHubStockState } from "@/components/today/hub/useTodayHubStockState";

export type QuadWipSetters = Pick<
  TodayHubStockState,
  | "setStockWipOpening"
  | "setStockOpeningEditable"
  | "setStockWipContextLoading"
  | "setStockWipSalesKm"
  | "setStockOrderPutupKm"
  | "setStockWipSalesLines"
  | "setStockCallPutup"
  | "setStockPutupDate"
  | "setStockPartyName"
  | "setStockDispatchPending"
  | "setStockDispatchParty"
  | "setStockCallPutupItems"
  | "setStockCallPutupLoadedItems"
  | "setStockCallPutupLoadedKm"
  | "setStockDispatchPendingItems"
  | "setStockSaleItems"
  | "setStockSaleHints"
  | "setStockDispatchSettledKm"
  | "setStockDispatchSettledItems"
  | "setStockDispatchLoadedKm"
  | "setStockDispatchLoadedItems"
  | "setStockLengthOptions"
  | "setStockLengthFactor"
  | "setStockInsulationExtras"
  | "setStockInsulationExtrasOpen"
  | "setStockPowerLayingFactor"
  | "setStockProcessQtys"
  | "setStockProcessHints"
>;

export type QuadWipContextData = {
  opening: Record<string, number>;
  openingFromDate: string | null;
  openingEditable?: boolean;
  salesKm: number;
  sales: TodayHubStockState["stockWipSalesLines"];
  variant: {
    coreCount: number;
    lengthFactor: number;
    factorConfirmed: boolean;
    drumLabel?: string;
    factorAmbiguous?: boolean;
    lengthOptions?: Array<{ label: string; lengthFactor: number }>;
  } | null;
  stockMeta: {
    callPutup: string;
    putupDate: string;
    partyName: string;
    dispatchPending: string;
    dispatchParty: string;
    callPutupItems?: Array<{ qty: number | string; date?: string; partyName?: string }>;
    callPutupCarriedItems?: Array<{ qty: number | string; date?: string; partyName?: string }>;
    callPutupOriginalKm?: number;
    dispatchPendingItems?: Array<{ qty: number | string; partyName?: string }>;
    dispatchSettledKm?: number;
    dispatchSettledItems?: Array<{ qty: number | string; partyName?: string }>;
    outerClosingIncludesPutup?: boolean;
    saleItems?: Array<{
      invoiceNo?: string;
      date?: string;
      partyName?: string;
      rate?: number | string;
      quantity?: number | string;
      gstPercent?: number | string;
    }>;
    opening?: Record<string, number>;
    production?: Record<string, number>;
    powerLayingFactor?: number;
  } | null;
  cable?: string;
  size?: string;
  production?: Record<string, number>;
  productionHints?: Record<string, number>;
  sameDay?: boolean;
  insulationContributions?: Array<{
    size: string;
    layingProduced: number;
    lengthFactor: number;
    coreCount?: number;
    consumed?: number;
  }>;
  putupKm?: number;
};

export type ApplyQuadWipOpts = { preserveInsulation?: boolean };