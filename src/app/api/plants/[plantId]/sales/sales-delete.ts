import { NextRequest, NextResponse } from "next/server";
import {
  requireCanEnter,
  requireDeleteConfirmation,
  requirePlantAccess,
  requireSession,
} from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { safeRefreshDailyStatus } from "@/lib/daily-status";
import { maybeRevokeCreditScore } from "@/lib/credit-score";
import { prisma } from "@/lib/db";
import { isSslPlant } from "@/lib/plant-layout";
import type { RouteContext } from "./sale-schemas";

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const enterDenied = requireCanEnter(session.user.globalRole);
  if (enterDenied) return enterDenied;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  const unconfirmed = await requireDeleteConfirmation(request);
  if (unconfirmed) return unconfirmed;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { code: true },
  });
  const isSsl = isSslPlant(plant?.code);

  const existing = await prisma.sale.findFirst({
    where: { id, plantId },
    select: { id: true, date: true, shift: true, enteredById: true, billNumber: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (isSsl && existing.billNumber?.trim()) {
    await prisma.sale.deleteMany({
      where: {
        plantId,
        date: existing.date,
        billNumber: { equals: existing.billNumber.trim(), mode: "insensitive" },
      },
    });
  } else {
    await prisma.sale.delete({ where: { id } });
  }

  await writeAuditLog({
    entityType: "Sale",
    entityId: id,
    field: "delete",
    oldValue: { id },
    actorId: session.user.id,
    plantId,
  });
  await maybeRevokeCreditScore(existing.enteredById, plantId, existing.date, existing.shift);
  await safeRefreshDailyStatus(plantId, existing.date, existing.shift);

  return NextResponse.json({ ok: true });
}
