import type { EntryApprovalKind } from "@/lib/entry-approval";

export const VALID_APPROVAL_TABS = new Set<EntryApprovalKind>([
  "purchase",
  "sale",
  "stock",
  "expense",
]);

export const APPROVAL_TAB_ORDER: EntryApprovalKind[] = [
  "purchase",
  "sale",
  "stock",
  "expense",
];