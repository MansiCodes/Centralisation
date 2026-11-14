import { NextRequest, NextResponse } from "next/server";
import { requirePlantAccess, requireSession } from "@/lib/api";
import { dateRangeFromSearchParams } from "@/lib/api-date-range";
import { prisma } from "@/lib/db";
import { plantIdFilter, resolveReportPlantIds } from "@/lib/plant-merge";
import { paginate } from "@/lib/ui/paginate";

type RouteContext = { params: Promise<{ plantId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  const plantIds = await resolveReportPlantIds(plantId);
  const pScope = plantIdFilter(plantIds);
  const sp = request.nextUrl.searchParams;
  const { filter, error } = dateRangeFromSearchParams(sp);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const page = Number(sp.get("page")) || 1;
  const pageSize = Number(sp.get("pageSize")) || 10;
  const entries = await prisma.productionEntry.findMany({
    where: { ...pScope, ...filter },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const { slice, ...pageInfo } = paginate(entries, page, pageSize);
  const totals = entries.reduce(
    (acc, row) => {
      acc.quantity += Number(row.quantity) || 0;
      return acc;
    },
    { quantity: 0 },
  );

  return NextResponse.json({ rows: slice, ...pageInfo, totals });
}