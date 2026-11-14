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
import { stockBatchSchema } from "./stock-schemas";
import { findStockInvoiceConflict } from "./stock-invoice-unique";
import { writeStockEntry } from "./stock-write-entry";

type StockSession = { user: SessionUser };

export async function postStockBatch(params: {
  body: unknown;
  plantId: string;
  session: StockSession;
  writePlantId: string;
}) {
  const { body, plantId, session, writePlantId } = params;
  const parsed = stockBatchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const photos = normalizeBillPhotoUrls(data.photoUrls, data.photoUrl);
  const approval = entryApprovalCreateData(session.user.globalRole, data.date);
  const approvalFields = {
    ...approval,
    ...(approval.approvedByHead ? { approvedByHeadId: session.user.id } : {}),
  };

  const plantIds = await resolveReportPlantIds(plantId);
  const invoiceConflict = await findStockInvoiceConflict({
    plantIds,
    day,
    shift: data.shift,
    lines: data.entries,
  });
  if (invoiceConflict) {
    return NextResponse.json({ error: invoiceConflict }, { status: 409 });
  }
  const allowOpeningOverride = canAlwaysEditQuadOpeningStock(session.user.email);
  const resolved = await Promise.all(
    data.entries.map(async (line) => {
      const lockedNotes = await applyQuadSignalOpeningLockToNotes({
        plantIds,
        day,
        notes: line.notes,
        allowOpeningOverride,
      });
      return {
        line: { ...line, notes: lockedNotes ?? line.notes },
        amounts: await resolveStockLineAmounts(
          writePlantId,
          day,
          line.quantity,
          line.rate,
          line.value,
          line.itemName,
        ),
      };
    }),
  );

  const created = await prisma.$transaction(async (tx) => {
    const entries = [];
    for (const { line, amounts } of resolved) {
      entries.push(
        await writeStockEntry(
          tx,
          stockEntryCreateData(
            writePlantId,
            session.user.id,
            data,
            line,
            amounts,
            photos,
            approvalFields,
            backdated,
            day,
          ),
        ),
      );
    }
    return entries;
  });

  await safeWriteAuditLog({
    entityType: "StockEntry",
    entityId: created[0]!.id,
    field: "create",
    newValue: {
      itemCount: created.length,
      items: created.map((entry) => entry.itemName),
      closingValue: created.reduce(
        (sum, entry) => sum + Number(entry.closingValue),
        0,
      ),
    },
    actorId: session.user.id,
    plantId,
    isBackdated: backdated,
  });

  await safeRefreshDailyStatus(plantId, day, data.shift, session.user.id);
  await maybeAwardCreditScore(session.user.id, plantId, day, data.shift);

  return NextResponse.json({ entries: created }, { status: 201 });
}