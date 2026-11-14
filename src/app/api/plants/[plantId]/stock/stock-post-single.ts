import { NextResponse } from "next/server";
import { zodErrorResponse, type SessionUser } from "@/lib/api";
import { safeWriteAuditLog } from "@/lib/audit";
import { entryApprovalCreateData } from "@/lib/entry-approval";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizeBillPhotoUrls } from "@/lib/cloudinary";
import { resolveReportPlantIds } from "@/lib/plant-merge";
import { applyQuadSignalOpeningLockToNotes } from "@/lib/quad-signal-opening";
import { canAlwaysEditQuadOpeningStock } from "@/lib/rbac";
import { resolveStockLineAmounts, stockEntryCreateData } from "./stock-amounts";
import { stockSingleSchema } from "./stock-schemas";
import { findStockInvoiceConflict } from "./stock-invoice-unique";
import { writeStockEntry } from "./stock-write-entry";

type StockSession = { user: SessionUser };

export async function postStockSingle(params: {
  body: unknown;
  plantId: string;
  session: StockSession;
  writePlantId: string;
}) {
  const { body, plantId, session, writePlantId } = params;
  const parsed = stockSingleSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const plantIds = await resolveReportPlantIds(plantId);
  const invoiceConflict = await findStockInvoiceConflict({
    plantIds,
    day,
    shift: data.shift,
    lines: [data],
  });
  if (invoiceConflict) {
    return NextResponse.json({ error: invoiceConflict }, { status: 409 });
  }
  const lockedNotes = await applyQuadSignalOpeningLockToNotes({
    plantIds,
    day,
    notes: data.notes,
    allowOpeningOverride: canAlwaysEditQuadOpeningStock(session.user.email),
  });
  const dataWithNotes = { ...data, notes: lockedNotes ?? data.notes };
  const photos = normalizeBillPhotoUrls(data.photoUrls, data.photoUrl);
  const amounts = await resolveStockLineAmounts(
    writePlantId,
    day,
    data.quantity,
    data.rate,
    data.value,
    data.itemName,
  );
  const approval = entryApprovalCreateData(session.user.globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: session.user.id } : {}),
  };

  const entry = await writeStockEntry(
    prisma,
    stockEntryCreateData(
      writePlantId,
      session.user.id,
      dataWithNotes,
      dataWithNotes,
      amounts,
      photos,
      approvalFields,
      backdated,
      day,
    ),
  );

  await safeWriteAuditLog({
    entityType: "StockEntry",
    entityId: entry.id,
    field: "create",
    newValue: {
      itemName: entry.itemName,
      quantity: Number(entry.quantity),
      rate: Number(entry.rate),
      closingValue: Number(entry.closingValue),
    },
    actorId: session.user.id,
    plantId,
    isBackdated: backdated,
  });

  await safeRefreshDailyStatus(plantId, day, data.shift, session.user.id);
  await maybeAwardCreditScore(session.user.id, plantId, day, data.shift);

  return NextResponse.json({ entry }, { status: 201 });
}