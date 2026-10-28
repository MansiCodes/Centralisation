import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { round2, zodErrorResponse } from "@/lib/api";
import { safeWriteAuditLog } from "@/lib/audit";
import { entryApprovalCreateData } from "@/lib/entry-approval";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizeBillPhotoUrls } from "@/lib/cloudinary";
import { resolveReportPlantIds } from "@/lib/plant-merge";
import { isSslPlant } from "@/lib/plant-layout";
import { preferFullerInvoice } from "@/lib/pnl/excel-import/dedupe";
import { findMatchingSale } from "./find-matching-sale";
import { saleCreateData } from "./sale-create-data";
import { saleSingleSchema } from "./sale-schemas";

/** Check for an exact-duplicate item on the same SSL invoice. */
async function findSslSingleDuplicate(
  writePlantId: string,
  day: Date,
  billTrimmed: string,
  itemDescription: string,
  quantity: number,
  rate: number,
) {
  return prisma.sale.findFirst({
    where: {
      plantId: writePlantId,
      date: day,
      billNumber: { equals: billTrimmed, mode: "insensitive" },
      itemDescription: { equals: itemDescription.trim(), mode: "insensitive" },
      quantity,
      rate,
    },
    select: { id: true, itemDescription: true },
  });
}

/** Update an existing sale match (non-SSL upsert path). */
async function updateExistingSale(
  existingId: string,
  day: Date,
  photos: ReturnType<typeof normalizeBillPhotoUrls>,
  approvalFields: Record<string, unknown>,
  backdated: boolean,
  existingBillNumber: string | null | undefined,
  data: ReturnType<typeof saleSingleSchema.parse>,
  salesValue: number,
) {
  const nextBill = preferFullerInvoice(existingBillNumber, data.billNumber);
  return prisma.sale.update({
    where: { id: existingId },
    data: {
      date: day, shift: data.shift, type: data.type,
      typeOther: data.typeOther ?? null, customerName: data.customerName,
      billNumber: nextBill || data.billNumber,
      billDate: data.billDate ? parseDateOnly(data.billDate) : null,
      notes: data.notes ?? null, itemDescription: data.itemDescription,
      unit: data.unit, quantity: data.quantity, rate: data.rate, salesValue,
      inMeter: data.inMeter ?? null, qtyMtr: data.qtyMtr ?? null,
      meterUnit: data.meterUnit ?? null,
      billPhotoUrl: photos.billPhotoUrl, billPhotoUrls: photos.billPhotoUrls,
      isBackdated: backdated, ...approvalFields,
    },
  });
}

export async function handleSingleSale(
  body: unknown,
  plantId: string,
  writePlantId: string,
  actorId: string,
  globalRole: GlobalRole,
) {
  const parsed = saleSingleSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const salesValue = round2(data.quantity * data.rate);
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const photos = normalizeBillPhotoUrls(data.billPhotoUrls, data.billPhotoUrl);
  const plantIds = await resolveReportPlantIds(plantId);
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { code: true },
  });
  const isSsl = isSslPlant(plant?.code);

  if (isSsl && data.billNumber?.trim()) {
    const dup = await findSslSingleDuplicate(
      writePlantId, day, data.billNumber.trim(),
      data.itemDescription, data.quantity, data.rate,
    );
    if (dup) {
      return NextResponse.json(
        { error: `Item "${dup.itemDescription}" with the same quantity and rate already exists on invoice "${data.billNumber.trim()}" for ${data.date}. Remove the duplicate item and try again.` },
        { status: 400 },
      );
    }
  }

  const approval = entryApprovalCreateData(globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: actorId } : {}),
  };

  const existing = await findMatchingSale({
    plantIds, date: day, billNumber: data.billNumber,
    type: data.type, quantity: data.quantity, rate: data.rate,
    itemDescription: data.itemDescription,
  });

  if (existing) {
    const sale = await updateExistingSale(
      existing.id, day, photos, approvalFields, backdated,
      existing.billNumber, data, salesValue,
    );
    await safeWriteAuditLog({
      entityType: "Sale", entityId: sale.id, field: "update",
      newValue: { customerName: sale.customerName, billNumber: sale.billNumber,
        itemDescription: sale.itemDescription, salesValue: Number(sale.salesValue) },
      actorId, plantId, isBackdated: backdated,
    });
    await safeRefreshDailyStatus(plantId, day, data.shift, actorId);
    await maybeAwardCreditScore(actorId, plantId, day, data.shift);
    return NextResponse.json({ sale, updated: true }, { status: 200 });
  }

  const sale = await prisma.sale.create({
    data: saleCreateData({
      writePlantId, day, shift: data.shift, type: data.type,
      typeOther: data.typeOther, customerName: data.customerName,
      billNumber: data.billNumber, billDate: data.billDate, notes: data.notes,
      itemDescription: data.itemDescription, unit: data.unit,
      quantity: data.quantity, rate: data.rate, salesValue,
      inMeter: data.inMeter, qtyMtr: data.qtyMtr, meterUnit: data.meterUnit,
      photos, enteredById: actorId, backdated, approvalFields,
    }),
  });

  await safeWriteAuditLog({
    entityType: "Sale", entityId: sale.id, field: "create",
    newValue: sale, actorId, plantId, isBackdated: backdated,
  });
  await safeRefreshDailyStatus(plantId, parseDateOnly(data.date), data.shift, actorId);
  await maybeAwardCreditScore(actorId, plantId, parseDateOnly(data.date), data.shift);

  return NextResponse.json({ sale }, { status: 201 });
}
