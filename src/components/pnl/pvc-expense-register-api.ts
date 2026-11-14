import { deleteJson, patchJson } from "@/lib/client-forms";
import { getRowEntityInfo, type PvcExpenseRow } from "./pvc-expense-register-types";

export function buildExpenseDeleteUrl(
  plantId: string,
  info: NonNullable<ReturnType<typeof getRowEntityInfo>>,
): string {
  if (info.source === "pettyCash") {
    return `/api/plants/${plantId}/petty-cash?id=${encodeURIComponent(info.rawId)}&confirm=true`;
  }
  if (info.source === "fixedAsset") {
    return `/api/plants/${plantId}/fixed-assets?id=${encodeURIComponent(info.rawId)}`;
  }
  return `/api/plants/${plantId}/electricity-rent?id=${encodeURIComponent(info.rawId)}&field=${info.field}`;
}

export async function patchPvcExpenseRow(
  plantId: string,
  row: PvcExpenseRow,
  editValues: Record<string, string>,
  photoUrls: string[],
) {
  const info = getRowEntityInfo(row);
  if (!info) return { ok: false as const, error: "Invalid row" };

  if (info.source === "pettyCash") {
    return patchJson(`/api/plants/${plantId}/petty-cash`, {
      id: info.rawId,
      date: editValues.date,
      expenseHead: editValues.expenseHead,
      description: editValues.description || null,
      amount: Number(editValues.amount),
      billPhotoUrls: photoUrls,
    });
  }
  if (info.source === "fixedAsset") {
    return patchJson(`/api/plants/${plantId}/fixed-assets`, {
      id: info.rawId,
      date: editValues.date,
      description: editValues.description || null,
      amount: Number(editValues.amount),
    });
  }
  return patchJson(`/api/plants/${plantId}/electricity-rent`, {
    id: info.rawId,
    field: info.field,
    amount: Number(editValues.amount),
    description: editValues.description || null,
  });
}

export async function deletePvcExpenseRow(plantId: string, row: PvcExpenseRow) {
  const info = getRowEntityInfo(row);
  if (!info) return { ok: false as const, error: "Invalid row" };
  const url = buildExpenseDeleteUrl(plantId, info);
  return deleteJson(url, { confirm: true });
}