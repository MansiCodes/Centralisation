import { NextRequest, NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { requireCanEnter, requirePlantAccess, requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { isSslPlant } from "@/lib/plant-layout";
import { resolveCanonicalWritePlantId } from "@/lib/plant-merge";
import { handleBatchPurchase } from "./handle-batch-purchase";
import { handleSinglePurchase } from "./handle-single-purchase";
import type { RouteContext } from "./purchase-schemas";

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const enterDenied = requireCanEnter(session.user.globalRole);
  if (enterDenied) return enterDenied;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  const writePlantId = await resolveCanonicalWritePlantId(plantId);
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { code: true },
  });
  const isSsl = isSslPlant(plant?.code);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const isBatch =
      typeof body === "object" &&
      body !== null &&
      Array.isArray((body as { items?: unknown }).items);

    if (isBatch) {
      return handleBatchPurchase(
        body, plantId, writePlantId,
        session.user.id, session.user.globalRole as GlobalRole, isSsl,
      );
    }

    return handleSinglePurchase(
      body, plantId, writePlantId,
      session.user.id, session.user.globalRole as GlobalRole, isSsl,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save purchase entry";
    console.error("purchases POST failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
