import { NextRequest, NextResponse } from "next/server";
import { ManpowerRole } from "@prisma/client";
import {
  requireCanEnter,
  requirePlantAccess,
  requireSession,
  round2,
  zodErrorResponse,
} from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { refreshDailyStatus } from "@/lib/daily-status";
import { maybeAwardCreditScore } from "@/lib/credit-score";
import { isBackdated, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { resolveCanonicalWritePlantId } from "@/lib/plant-merge";
import { z } from "zod";
import { DEFAULT_RATES, productionSchema } from "./production-schema";

type RouteContext = { params: Promise<{ plantId: string }> };

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

  const parsed = productionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;
  const backdated = isBackdated(data.date);
  const day = parseDateOnly(data.date);
  const rateByRole = await loadRates(writePlantId);
  const roleHeadcounts = headcountsFromPayload(data.manpower);
  const { production, manpowerEntries } = await createProductionWithManpower({
    writePlantId,
    day,
    data,
    backdated,
    actorId: session.user.id,
    rateByRole,
    roleHeadcounts,
  });

  await writeAuditLog({
    entityType: "ProductionEntry",
    entityId: production.id,
    field: "create",
    newValue: {
      productName: production.productName,
      quantity: Number(production.quantity),
      unit: production.unit,
      shift: production.shift,
      manpower: {
        manager: data.manpower.manager,
        operator: data.manpower.operator,
        helper: data.manpower.helper,
        totalCost: manpowerEntries.reduce(
          (sum, entry) => sum + Number(entry.totalCost),
          0,
        ),
      },
    },
    actorId: session.user.id,
    plantId,
    isBackdated: backdated,
  });

  await refreshDailyStatus(plantId, day, data.shift, session.user.id);
  await maybeAwardCreditScore(session.user.id, plantId, day, data.shift);

  return NextResponse.json({ production, manpowerEntries }, { status: 201 });
}

async function loadRates(writePlantId: string) {
  const rateSettings = await prisma.manpowerRateSetting.findMany({
    where: { plantId: writePlantId },
  });
  return new Map(rateSettings.map((s) => [s.role, Number(s.ratePerDay)]));
}

function headcountsFromPayload(manpower: {
  manager: number;
  operator: number;
  helper: number;
}) {
  return [
    { role: ManpowerRole.MANAGER, headcount: manpower.manager },
    { role: ManpowerRole.OPERATOR, headcount: manpower.operator },
    { role: ManpowerRole.HELPER, headcount: manpower.helper },
  ].filter((r) => r.headcount > 0);
}

async function createProductionWithManpower(args: {
  writePlantId: string;
  day: Date;
  data: z.infer<typeof productionSchema>;
  backdated: boolean;
  actorId: string;
  rateByRole: Map<ManpowerRole, number>;
  roleHeadcounts: Array<{ role: ManpowerRole; headcount: number }>;
}) {
  const { writePlantId, day, data, backdated, actorId, rateByRole, roleHeadcounts } =
    args;
  return prisma.$transaction(async (tx) => {
    const production = await tx.productionEntry.create({
      data: {
        plantId: writePlantId,
        date: day,
        shift: data.shift,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        notes: data.notes ?? null,
        enteredById: actorId,
        isBackdated: backdated,
      },
    });

    const manpowerEntries = await Promise.all(
      roleHeadcounts.map(({ role, headcount }) => {
        const ratePerDay = rateByRole.get(role) ?? DEFAULT_RATES[role];
        const totalCost = round2(headcount * ratePerDay);
        return tx.manpowerEntry.create({
          data: {
            plantId: writePlantId,
            date: day,
            shift: data.shift,
            role,
            headcount,
            ratePerDay,
            totalCost,
            enteredById: actorId,
            isBackdated: backdated,
          },
        });
      }),
    );

    return { production, manpowerEntries };
  });
}