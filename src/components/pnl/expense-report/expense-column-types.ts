export type ExpenseColumnOpts = {
  cat6: boolean;
  pvc: boolean;
  upcast: boolean;
  isQuad?: boolean;
  page: number;
  pageSize: number;
  t: (key: string) => string;
  tCommon: (key: string) => string;
};