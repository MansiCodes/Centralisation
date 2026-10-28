import { NextRequest, NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { requireCanEnter, requirePlantAccess, requireSession } from "@/lib/api";
import { resolveCanonicalWritePlantId } from "@/lib/plant-merge";
import { handleBatchSale } from "./handle-batch-sale";
import { handleSingleSale } from "./handle-single-sale";
import type { RouteContext } from "./sale-schemas";

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const enterDenied = requireCanEnter(session.user.globalRole);
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
    Array.isArray((body as { items?: unknown }).items);

  if (isBatch) {
    return handleBatchSale(
      body, plantId, writePlantId,
      session.user.id, session.user.globalRole as GlobalRole,
    );
  }

  return handleSingleSale(
    body, plantId, writePlantId,
    session.user.id, session.user.globalRole as GlobalRole,
  );
}
