import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { zodErrorResponse } from "@/lib/api";
import { safeWriteAuditLog } from "@/lib/audit";
import { entryApprovalCreateData } from "@/lib/entry-approval";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { isSslPlant } from "@/lib/plant-layout";
import { normalizeBillPhotoUrls } from "@/lib/cloudinary";
import { purchaseCreateData } from "./purchase-create-data";
import { purchaseBatchSchema } from "./purchase-schemas";

/** Block duplicate invoice for SSL plants (whole invoice, not per-item). */
async function checkSslBatchDuplicate(
  writePlantId: string,
  day: Date,
  billTrimmed: string,
  date: string,
) {
  const dup = await prisma.purchase.findFirst({
    where: {
      plantId: writePlantId,
      date: day,
      billNumber: { equals: billTrimmed, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json(
      { error: `Purchase invoice "${billTrimmed}" already exists on ${date}. The same invoice number cannot be used for two separate Purchase invoices on the same date.` },
      { status: 400 },
    );
  }
  return null;
}

/** Create one DB row per item for SSL plants. */
async function createSslPurchaseItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  writePlantId: string,
  actorId: string,
  data: ReturnType<typeof purchaseBatchSchema.parse>,
  headerGst: number,
  photos: ReturnType<typeof normalizeBillPhotoUrls>,
  approvalFields: Record<string, unknown>,
  backdated: boolean,
  day: Date,
) {
  const created = [];
  for (const item of data.items) {
    created.push(
      await tx.purchase.create({
        data: purchaseCreateData(writePlantId, actorId, data, item, headerGst, photos, approvalFields, backdated, day),
      }),
    );
  }
  return created;
}

/** Upsert items for non-SSL plants (match by bill+item, update or create). */
async function upsertNonSslPurchaseItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  writePlantId: string,
  actorId: string,
  data: ReturnType<typeof purchaseBatchSchema.parse>,
  headerGst: number,
  photos: ReturnType<typeof normalizeBillPhotoUrls>,
  approvalFields: Record<string, unknown>,
  backdated: boolean,
  day: Date,
) {
  const created = [];
  const billRaw = data.billNumber?.trim() || "";
  for (const item of data.items) {
    const createData = purchaseCreateData(writePlantId, actorId, data, item, headerGst, photos, approvalFields, backdated, day);
    const existing = billRaw
      ? await tx.purchase.findFirst({
          where: {
            plantId: writePlantId,
            billNumber: { equals: billRaw, mode: "insensitive" },
            ...(item.itemDescription ? { itemDescription: { equals: item.itemDescription.trim(), mode: "insensitive" } } : {}),
          },
        })
      : null;
    created.push(
      existing
        ? await tx.purchase.update({ where: { id: existing.id }, data: createData })
        : await tx.purchase.create({ data: createData }),
    );
  }
  return created;
}

export async function handleBatchPurchase(
  body: unknown,
  plantId: string,
  writePlantId: string,
  actorId: string,
  globalRole: GlobalRole,
  isSsl: boolean,
) {
  const parsed = purchaseBatchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const headerGst = data.gstPercent ?? 0;
  const photos = normalizeBillPhotoUrls(data.billPhotoUrls, data.billPhotoUrl);

  if (isSsl && data.billNumber?.trim()) {
    const err = await checkSslBatchDuplicate(writePlantId, day, data.billNumber.trim(), data.date);
    if (err) return err;
  }

  const approval = entryApprovalCreateData(globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: actorId } : {}),
  };

  const purchases = await prisma.$transaction(async (tx) =>
    isSsl
      ? createSslPurchaseItems(tx, writePlantId, actorId, data, headerGst, photos, approvalFields, backdated, day)
      : upsertNonSslPurchaseItems(tx, writePlantId, actorId, data, headerGst, photos, approvalFields, backdated, day),
  );

  await safeWriteAuditLog({
    entityType: "Purchase",
    entityId: purchases[0]!.id,
    field: "create",
    newValue: {
      vendorName: data.vendorName, billNumber: data.billNumber ?? null,
      shift: data.shift, itemCount: purchases.length,
      items: purchases.map((p) => p.itemDescription),
      invoiceValue: purchases.reduce((sum, p) => sum + Number(p.invoiceValue), 0),
    },
    actorId, plantId, isBackdated: backdated,
  });

  await safeRefreshDailyStatus(plantId, day, data.shift, actorId);
  await maybeAwardCreditScore(actorId, plantId, day, data.shift);

  return NextResponse.json({ purchases }, { status: 201 });
}
