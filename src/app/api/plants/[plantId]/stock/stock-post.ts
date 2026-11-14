import { NextRequest, NextResponse } from "next/server";
import {
  requireCanEnterStock,
  requirePlantAccess,
  requireSession,
  zodErrorResponse,
} from "@/lib/api";
import { safeWriteAuditLog } from "@/lib/audit";
import { entryApprovalCreateData } from "@/lib/entry-approval";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { normalizeBillPhotoUrls } from "@/lib/cloudinary";
import {
  resolveCanonicalWritePlantId,
  resolveReportPlantIds,
} from "@/lib/plant-merge";
import { applyQuadSignalOpeningLockToNotes } from "@/lib/quad-signal-opening";
import { canAlwaysEditQuadOpeningStock } from "@/lib/rbac";
import { resolveStockLineAmounts, stockEntryCreateData } from "./stock-amounts";
import { stockBatchSchema, stockSingleSchema, type RouteContext } from "./stock-schemas";
import { findStockInvoiceConflict } from "./stock-invoice-unique";
import { postStockBatch } from "./stock-post-batch";
import { postStockSingle } from "./stock-post-single";

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const enterDenied = requireCanEnterStock(session.user.globalRole);
  if (enterDenied) return enterDenied;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  const writePlantId = await resolveCanonicalWritePlantId(plantId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBatch =
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as { entries?: unknown }).entries);

  try {
    if (isBatch) {
      return await postStockBatch({
        body,
        plantId,
        session,
        writePlantId,
      });
    }
    return await postStockSingle({
      body,
      plantId,
      session,
      writePlantId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save stock entry";
    console.error("stock POST failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}