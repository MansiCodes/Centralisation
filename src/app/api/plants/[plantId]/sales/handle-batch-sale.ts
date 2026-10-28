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
import { saleBatchSchema } from "./sale-schemas";
import type { z } from "zod";

type BatchData = z.infer<typeof saleBatchSchema>;

/** Check if an exact-duplicate item (same description+qty+rate) already exists on the invoice. */
async function findSslBatchDuplicate(
  writePlantId: string,
  day: Date,
  billTrimmed: string,
  items: BatchData["items"],
) {
  return prisma.sale.findFirst({
    where: {
      plantId: writePlantId,
      date: day,
      billNumber: { equals: billTrimmed, mode: "insensitive" },
      OR: items.map((it) => ({
        AND: [
          { itemDescription: { equals: it.itemDescription.trim(), mode: "insensitive" as const } },
          { quantity: it.quantity },
          { rate: it.rate },
        ],
      })),
    },
    select: { id: true, itemDescription: true },
  });
}

/** Create one DB row per item for SSL plants (no dedup — each line is independent). */
async function createSslBatchItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  writePlantId: string,
  day: Date,
  data: BatchData,
  photos: ReturnType<typeof normalizeBillPhotoUrls>,
  approvalFields: Record<string, unknown>,
  backdated: boolean,
  enteredById: string,
) {
  const created = [];
  for (const item of data.items) {
    const salesValue = round2(item.quantity * item.rate);
    created.push(
      await tx.sale.create({
        data: saleCreateData({
          writePlantId, day, shift: data.shift, type: data.type,
          typeOther: data.typeOther, customerName: data.customerName,
          billNumber: data.billNumber, billDate: data.billDate, notes: data.notes,
          itemDescription: item.itemDescription, unit: item.unit,
          quantity: item.quantity, rate: item.rate, salesValue,
          inMeter: item.inMeter, qtyMtr: item.qtyMtr, meterUnit: item.meterUnit,
          photos, approvalFields, backdated, enteredById,
        }),
      }),
    );
  }
  return created;
}

/** Upsert items for non-SSL plants (match existing by bill+item, update or create). */
async function upsertNonSslBatchItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  writePlantId: string,
  day: Date,
  data: BatchData,
  plantIds: string[],
  photos: ReturnType<typeof normalizeBillPhotoUrls>,
  approvalFields: Record<string, unknown>,
  backdated: boolean,
  enteredById: string,
) {
  const created = [];
  for (const item of data.items) {
    const salesValue = round2(item.quantity * item.rate);
    const existing = await findMatchingSale({
      plantIds, date: day, billNumber: data.billNumber,
      type: data.type, quantity: item.quantity, rate: item.rate,
      itemDescription: item.itemDescription,
    });
    if (existing) {
      const nextBill = preferFullerInvoice(existing.billNumber, data.billNumber);
      created.push(
        await tx.sale.update({
          where: { id: existing.id },
          data: {
            date: day, shift: data.shift, type: data.type,
            typeOther: data.typeOther ?? null, customerName: data.customerName,
            billNumber: nextBill || data.billNumber,
            billDate: data.billDate ? parseDateOnly(data.billDate) : null,
            notes: data.notes ?? null, itemDescription: item.itemDescription,
            unit: item.unit, quantity: item.quantity, rate: item.rate, salesValue,
            inMeter: item.inMeter ?? null, qtyMtr: item.qtyMtr ?? null,
            meterUnit: item.meterUnit ?? null,
            billPhotoUrl: photos.billPhotoUrl, billPhotoUrls: photos.billPhotoUrls,
            isBackdated: backdated, ...approvalFields,
          },
        }),
      );
      continue;
    }
    created.push(
      await tx.sale.create({
        data: saleCreateData({
          writePlantId, day, shift: data.shift, type: data.type,
          typeOther: data.typeOther, customerName: data.customerName,
          billNumber: data.billNumber, billDate: data.billDate, notes: data.notes,
          itemDescription: item.itemDescription, unit: item.unit,
          quantity: item.quantity, rate: item.rate, salesValue,
          inMeter: item.inMeter, qtyMtr: item.qtyMtr, meterUnit: item.meterUnit,
          photos, enteredById, backdated, approvalFields,
        }),
      }),
    );
  }
  return created;
}

export async function handleBatchSale(
  body: unknown,
  plantId: string,
  writePlantId: string,
  actorId: string,
  globalRole: GlobalRole,
) {
  const parsed = saleBatchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const photos = normalizeBillPhotoUrls(data.billPhotoUrls, data.billPhotoUrl);
  const approval = entryApprovalCreateData(globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: actorId } : {}),
  };

  const plantIds = await resolveReportPlantIds(plantId);
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { code: true },
  });
  const isSsl = isSslPlant(plant?.code);

  if (isSsl && data.billNumber?.trim()) {
    const dup = await findSslBatchDuplicate(writePlantId, day, data.billNumber.trim(), data.items);
    if (dup) {
      return NextResponse.json(
        { error: `Item "${dup.itemDescription}" with the same quantity and rate already exists on invoice "${data.billNumber.trim()}" for ${data.date}. Remove the duplicate item and try again.` },
        { status: 400 },
      );
    }
  }

  const sales = await prisma.$transaction(async (tx) =>
    isSsl
      ? createSslBatchItems(tx, writePlantId, day, data, photos, approvalFields, backdated, actorId)
      : upsertNonSslBatchItems(tx, writePlantId, day, data, plantIds, photos, approvalFields, backdated, actorId),
  );

  await safeWriteAuditLog({
    entityType: "Sale",
    entityId: sales[0]!.id,
    field: "create",
    newValue: {
      customerName: data.customerName,
      billNumber: data.billNumber ?? null,
      shift: data.shift,
      itemCount: sales.length,
      items: sales.map((s) => s.itemDescription),
      salesValue: sales.reduce((sum, s) => sum + Number(s.salesValue), 0),
    },
    actorId,
    plantId,
    isBackdated: backdated,
  });

  await safeRefreshDailyStatus(plantId, day, data.shift, actorId);
  await maybeAwardCreditScore(actorId, plantId, day, data.shift);

  return NextResponse.json({ sales }, { status: 201 });
}
