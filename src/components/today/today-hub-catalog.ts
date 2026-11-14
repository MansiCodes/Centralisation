export const MODULE_ICONS: Record<
  import("./today-hub-types").TodayModuleKey,
  { path: string; tone: "teal" }
> = {
  purchaseFilled: {
    tone: "teal",
    path: "M3 5h2l1.6 9.6a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6M9 20a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 9 20Zm8 0a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 17 20Z",
  },
  saleFilled: {
    tone: "teal",
    path: "M3 17l6-6 4 4 8-8M15 7h6v6",
  },
  stockFilled: {
    tone: "teal",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12",
  },
  productionFilled: {
    tone: "teal",
    path: "M3 21V10l6-4v4l6-4v15M15 21V12l6 3v6M3 21h18",
  },
  pettyCashFilled: {
    tone: "teal",
    path: "M3 7h18v11H3V7Zm0 0 2-3h14l2 3M15 12.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  },
};

export const MODULE_KIND: Partial<
  Record<import("./today-hub-types").TodayModuleKey, import("./today-hub-types").EntryKind>
> = {
  purchaseFilled: "purchase",
  saleFilled: "sale",
  stockFilled: "stock",
  pettyCashFilled: "expense",
};

export const KIND_TO_MODULE: Partial<
  Record<import("./today-hub-types").EntryKind, import("./today-hub-types").TodayModuleKey>
> = {
  purchase: "purchaseFilled",
  sale: "saleFilled",
  stock: "stockFilled",
  expense: "pettyCashFilled",
};

export const ENTRY_KINDS: import("./today-hub-types").EntryKind[] = [
  "purchase",
  "sale",
  "stock",
  "expense",
  "contactList",
];

export const ENTRY_KIND_LABEL_KEY: Record<
  import("./today-hub-types").EntryKind,
  string
> = {
  purchase: "purchase",
  sale: "sales",
  stock: "stock",
  expense: "expense",
  contactList: "contactList",
};

export const CUSTOMERS = [
  "Noto Fire",
  "Wirelux",
  "Samriddhii Automation Haridwar",
  "Samriddhi Automation Noida",
  "Railway PO ATC",
  "Hamsa India",
  "Peak Star Networking",
  "Glow Right",
  "Ayansh Infocom",
  "Qlo Networks",
  "Anu Exterprises",
  "Digamber Telecom",
  "Naitik Infotex",
  "Bharat Cable Industries",
  "Goa Shipping Yard",
  "Reliable securities",
  "Chrome Infra",
  "Epsillon Cable",
] as const;

export const SALE_TYPES = [
  { value: "FINISHED_GOOD", label: "Finished Good" },
  { value: "ALUMINIUM_SCRAP", label: "Aluminium Scrap" },
  { value: "COPPER_SCRAP", label: "Copper Scrap" },
  { value: "OTHERS", label: "Others" },
] as const;

export const QUAD_SIGNAL_SALE_TYPES = [
  { value: "FINISHED_GOOD", label: "Finished Good" },
  { value: "ALUMINIUM_SCRAP", label: "Aluminium Scrap" },
  { value: "COPPER_SCRAP", label: "Copper Scrap" },
  { value: "FREIGHT_ON_SALE", label: "Freight on Sale" },
  { value: "INSPECTION_CHARGE", label: "INSPECTION AND SERVICE CHARGE" },
  { value: "INTEREST_INCOME", label: "Interest Income on LC Charges" },
  { value: "OTHERS", label: "Others" },
] as const;

export const CONDUCTOR_SALE_TYPES = [
  { value: "COPPER_SCRAP", label: "Copper" },
  { value: "ALUMINIUM_SCRAP", label: "Aluminum" },
  { value: "OTHERS", label: "Other" },
] as const;

export const PURCHASE_TYPES = [
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "ASSET", label: "Asset" },
  { value: "CAPITAL_GOOD", label: "Capital Good" },
  { value: "RAW_MATERIAL", label: "Raw materials" },
  { value: "OTHERS", label: "Others" },
] as const;

export const PRODUCTS = [
  { name: "RDSO Black", unit: "KGS" },
  { name: "RDSO Grey", unit: "KGS" },
] as const;

export const PRODUCT_NAMES = PRODUCTS.map((p) => p.name);