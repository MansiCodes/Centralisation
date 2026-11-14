import type { InsulationLengthUnit } from "@/lib/quad-signal-wip";
import type {
  CONDUCTOR_SALE_TYPES,
  PURCHASE_TYPES,
  QUAD_SIGNAL_SALE_TYPES,
  SALE_TYPES,
} from "./today-hub-catalog";

export type TodayModuleKey =
  | "purchaseFilled"
  | "saleFilled"
  | "stockFilled"
  | "productionFilled"
  | "pettyCashFilled";

export type TodayModuleStatus = {
  key: TodayModuleKey;
  label: string;
  filled: boolean;
  done?: number;
  total?: number;
};

export type ShiftKey = "DAY" | "NIGHT";

export type ShiftModulesMap = Record<ShiftKey, TodayModuleStatus[]>;

export type EntryKind =
  | "purchase"
  | "sale"
  | "stock"
  | "expense"
  | "contactList";

export type LineItem = {
  id: string;
  itemDescription: string;
  unit: string;
  quantity: string;
  rate: string;
  gstPercent: string;
  inMeter?: string;
  qtyMtr?: string;
  meterUnit?: string;
  openingReading?: string;
  closingReading?: string;
  debitQuantity?: string;
};

export type SaleTypeValue =
  | (typeof SALE_TYPES)[number]["value"]
  | (typeof CONDUCTOR_SALE_TYPES)[number]["value"]
  | (typeof QUAD_SIGNAL_SALE_TYPES)[number]["value"];

export type PurchaseTypeValue = (typeof PURCHASE_TYPES)[number]["value"];

export type TodayHubProps = {
  plantId: string;
  plantName: string;
  plantCode: string;
  date: string;
  shiftModules: ShiftModulesMap;
  canEnter: boolean;
  embedded?: boolean;
  overlayOnly?: boolean;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  userRole?: string;
  canAccessStock?: boolean;
};

export type StockInsulationExtra = {
  id: string;
  size: string;
  sizeOther: string;
  lengthValue: string;
  lengthUnit: InsulationLengthUnit;
  lengthUnitOther: string;
  layingProduced: string;
};

export type StockSingleQuadExtra = {
  id: string;
  size: string;
  sizeOther: string;
  singleQuadProd: string;
  layingProduced: string;
};

export type StockCallPutupItem = {
  qty: string;
  date: string;
  partyName: string;
};

export type StockDispatchPendingItem = {
  qty: string;
  partyName: string;
};

export type StockSaleItem = {
  invoiceNo: string;
  date: string;
  partyName: string;
  rate: string;
  quantity: string;
  gstPercent: string;
};

export type StockWipSalesLine = {
  id: string;
  billNumber: string | null;
  customerName: string;
  itemDescription: string;
  quantity: number;
  unit: string;
};