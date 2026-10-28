import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { zodErrorResponse } from "@/lib/api";
import { safeWriteAuditLog } from "@/lib/audit";
import { entryApprovalCreateData } from "@/lib/entry-approval";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizeBillPhotoUrls } from "@/lib/cloudinary";
import { purchaseCreateData } from "./purchase-create-data";
import { purchaseSingleSchema } from "./purchase-schemas";

export async function handleSinglePurchase(
  body: unknown,
  plantId: string,
  writePlantId: string,
  actorId: string,
  globalRole: GlobalRole,
  isSsl: boolean,
) {
  const parsed = purchaseSingleSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const photos = normalizeBillPhotoUrls(data.billPhotoUrls, data.billPhotoUrl);

  if (isSsl && data.billNumber?.trim()) {
    const billTrimmed = data.billNumber.trim();
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
        { error: `Purchase invoice "${billTrimmed}" already exists on ${data.date}. The same invoice number cannot be used for two separate Purchase invoices on the same date.` },
        { status: 400 },
      );
    }
  }

  const approval = entryApprovalCreateData(globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: actorId } : {}),
  };

  const itemData = {
    itemDescription: data.itemDescription,
    unit: data.unit,
    quantity: data.quantity,
    rate: data.rate,
    gstPercent: data.gstPercent,
    debitQuantity: data.debitQuantity ?? 0,
    openingReading: data.openingReading,
    closingReading: data.closingReading,
  };
  const createData = purchaseCreateData(
    writePlantId, actorId, data, itemData, data.gstPercent,
    photos, approvalFields, backdated, day,
  );

  const billRaw = data.billNumber?.trim() || "";
  const existing =
    billRaw && !isSsl
      ? await prisma.purchase.findFirst({
          where: {
            plantId: writePlantId,
            billNumber: { equals: billRaw, mode: "insensitive" },
            ...(data.itemDescription ? { itemDescription: { equals: data.itemDescription.trim(), mode: "insensitive" } } : {}),
          },
        })
      : null;

  const purchase = existing
    ? await prisma.purchase.update({ where: { id: existing.id }, data: createData })
    : await prisma.purchase.create({ data: createData });

  await safeWriteAuditLog({
    entityType: "Purchase",
    entityId: purchase.id,
    field: "create",
    newValue: {
      vendorName: purchase.vendorName, billNumber: purchase.billNumber,
      itemDescription: purchase.itemDescription, invoiceValue: Number(purchase.invoiceValue),
    },
    actorId, plantId, isBackdated: backdated,
  });

  await safeRefreshDailyStatus(plantId, day, data.shift, actorId);
  await maybeAwardCreditScore(actorId, plantId, day, data.shift);

  return NextResponse.json({ purchase }, { status: 201 });
}
