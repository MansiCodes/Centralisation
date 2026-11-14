import type { ReportColumn } from "@/components/pnl/ReportTable";
import type { ExpenseRow } from "./types";
import { buildCat6ExpenseColumns } from "./columns-cat6";
import { buildPvcUpcastExpenseColumns } from "./columns-pvc-upcast";
import { buildStandardExpenseColumns } from "./columns-standard";
import type { ExpenseColumnOpts } from "./expense-column-types";

export type { ExpenseColumnOpts } from "./expense-column-types";

export function buildExpenseColumns(
  opts: ExpenseColumnOpts,
): ReportColumn<ExpenseRow>[] {
  const { cat6, pvc, upcast } = opts;
  if (cat6) return buildCat6ExpenseColumns(opts);
  if (pvc || upcast) return buildPvcUpcastExpenseColumns(opts);
  return buildStandardExpenseColumns(opts);
}