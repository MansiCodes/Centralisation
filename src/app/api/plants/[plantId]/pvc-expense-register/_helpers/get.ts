import { NextRequest, NextResponse } from "next/server";
import { requirePlantAccess, requireSession } from "@/lib/api";
import { dateRangeFromSearchParams } from "@/lib/api-date-range";
import { normalizePvcExpenseHead } from "@/lib/plant-catalogs";
import { plantIdFilter, resolveReportPlantIds } from "@/lib/plant-merge";
import { prisma } from "@/lib/db";
import { paginate } from "@/lib/ui/paginate";
import type { PvcExpenseRegisterRow } from "./pvc-expense-types";
import { startOfUtcMonth } from "./pvc-expense-format";
import { unifyElectricityRows } from "./unify-electricity-rows";
import { unifyPettyRows } from "./unify-petty-rows";
import { pvcFarMonthCount, unifyAssetRows } from "./unify-asset-rows";

type RouteContext = { params: Promise<{ plantId: string }> };

function monthRangeFromFilter(filter: ReturnType<typeof dateRangeFromSearchParams>["filter"]) {
  const fromDate =
    filter.date instanceof Date
      ? filter.date
      : filter.date && typeof filter.date === "object" && "gte" in filter.date
        ? (filter.date as { gte?: Date }).gte
        : undefined;
  const toDate =
    filter.date instanceof Date
      ? filter.date
      : filter.date && typeof filter.date === "object" && "lte" in filter.date
        ? (filter.date as { lte?: Date }).lte
        : undefined;
  return {
    fromDate,
    toDate,
    fromMonth: fromDate ? startOfUtcMonth(fromDate) : undefined,
    toMonth: toDate ? startOfUtcMonth(toDate) : undefined,
  };
}

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
  const pageSize = Number(sp.get("pageSize")) || 20;
  const category = sp.get("category")?.trim() || null;
  const { fromDate, toDate, fromMonth, toMonth } = monthRangeFromFilter(filter);

  const [electricityRows, pettyRows, assetRows] = await Promise.all([
    prisma.electricityRent.findMany({
      where: {
        ...pScope,
        ...((fromMonth || toMonth)
          ? { month: { ...(fromMonth ? { gte: fromMonth } : {}), ...(toMonth ? { lte: toMonth } : {}) } }
          : {}),
      },
      orderBy: { month: "asc" },
    }),
    prisma.pettyCashEntry.findMany({
      where: { ...pScope, ...filter },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.fixedAsset.findMany({ where: { ...pScope }, orderBy: [{ billDate: "desc" }, { createdAt: "desc" }] }),
  ]);

  const pvcFarMonths = pvcFarMonthCount(
    fromDate ?? new Date("2026-01-01"),
    toDate ?? new Date("2026-10-31"),
  );

  const unified: PvcExpenseRegisterRow[] = [
    ...unifyElectricityRows(electricityRows),
    ...unifyPettyRows(pettyRows, electricityRows),
    ...unifyAssetRows(assetRows, fromDate, toDate, pvcFarMonths),
  ];

  unified.sort((a, b) => {
    const byDate = b.sortDate.localeCompare(a.sortDate);
    if (byDate !== 0) return byDate;
    return a.expenseLabel.localeCompare(b.expenseLabel);
  });

  const filtered = category
    ? unified.filter((row) => {
        const label = normalizePvcExpenseHead(row.expenseLabel);
        const want = normalizePvcExpenseHead(category);
        return label === want;
      })
    : unified;

  const totals = filtered.reduce((acc, row) => {
    acc.amount += row.amount;
    return acc;
  }, { amount: 0 });

  const { slice, ...pageInfo } = paginate(filtered, page, pageSize);
  return NextResponse.json({ rows: slice, ...pageInfo, totals });
}