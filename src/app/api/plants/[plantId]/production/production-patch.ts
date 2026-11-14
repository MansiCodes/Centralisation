import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireCanEnter,
  requirePlantAccess,
  requireSession,
  zodErrorResponse,
} from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { productionSchema } from "./production-schema";

type RouteContext = { params: Promise<{ plantId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const enterDenied = requireCanEnter(session.user.globalRole);
  if (enterDenied) return enterDenied;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = productionSchema
    .omit({ manpower: true })
    .partial()
    .extend({ id: z.string().min(1) })
    .safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const existing = await prisma.productionEntry.findFirst({
    where: { id: data.id, plantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Production entry not found" }, { status: 404 });
  }

  const dateStr = data.date ?? existing.date.toISOString().slice(0, 10);
  const production = await prisma.productionEntry.update({
    where: { id: existing.id },
    data: {
      date: data.date ? parseDateOnly(data.date) : undefined,
      shift: data.shift,
      productName: data.productName,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      isBackdated: isBackdated(dateStr),
    },
  });

  await writeAuditLog({
    entityType: "ProductionEntry",
    entityId: production.id,
    field: "update",
    oldValue: existing,
    newValue: production,
    actorId: session.user.id,
    plantId,
    isBackdated: production.isBackdated,
  });

  return NextResponse.json({ production });
}