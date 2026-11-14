export type ProductionCoilItem = {
  invoice: string;
  weight: string;
};

export type ProductionEntryFieldState = {
  planned: string;
  setPlanned: (v: string) => void;
  actual: string;
  setActual: (v: string) => void;
  coils: ProductionCoilItem[];
  setCoils: (fn: (prev: ProductionCoilItem[]) => ProductionCoilItem[]) => void;
  totalCoils: number;
  totalWeight: number | null;
  operatorName: string;
  setOperatorName: (v: string) => void;
  operators: string;
  setOperators: (v: string) => void;
  helpers: string;
  setHelpers: (v: string) => void;
  remarks: string;
  setRemarks: (v: string) => void;
  photoUrls: string[];
  setPhotoUrls: (urls: string[]) => void;
  entryDate: string;
  setEntryDate: (v: string) => void;
  efficiency: number;
  totalManpower: number;
  hasPriorEntries: boolean;
  busy: boolean;
  saving: boolean;
  readOnly: boolean;
};