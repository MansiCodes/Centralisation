import { NextRequest, NextResponse } from "next/server";
import {
  requireCanEnter,
  requireDeleteConfirmation,
  requirePlantAccess,
  requireSession,
} from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { refreshDailyStatus } from "@/lib/daily-status";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ plantId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
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
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.productionEntry.findFirst({
    where: { id, plantId },
    select: { id: true, date: true, shift: true, enteredById: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Production entry not found" }, { status: 404 });
  }

  await prisma.productionEntry.delete({ where: { id } });
  await writeAuditLog({
    entityType: "ProductionEntry",
    entityId: id,
    field: "delete",
    oldValue: { id },
    actorId: session.user.id,
    plantId,
  });
  await refreshDailyStatus(plantId, existing.date, existing.shift);

  return NextResponse.json({ ok: true });
}