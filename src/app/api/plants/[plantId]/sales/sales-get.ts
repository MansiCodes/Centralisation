import { NextRequest, NextResponse } from "next/server";
import { requirePlantAccess, requireSession, round2 } from "@/lib/api";
import { resolveEntryApprovalFlags } from "@/lib/entry-approval";
import { dateRangeFromSearchParams } from "@/lib/api-date-range";
import { prisma } from "@/lib/db";
import { isCat6Plant, isSslPlant } from "@/lib/plant-layout";
import { seesOwnEntriesOnly } from "@/lib/rbac";
import { paginate } from "@/lib/ui/paginate";
import { plantIdFilter, resolveReportPlantIds } from "@/lib/plant-merge";
import { getSaleCategory } from "@/lib/pnl/sales-category";
import type { RouteContext } from "./sale-schemas";

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { plantId } = await context.params;
  const denied = await requirePlantAccess(session.user.id, plantId);
  if (denied) return denied;

  const plantIds = await resolveReportPlantIds(plantId);
  const pScope = plantIdFilter(plantIds);

  const sp = request.nextUrl.searchParams;
  const { filter, error } = dateRangeFromSearchParams(sp);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const page = Number(sp.get("page")) || 1;
  const pageSize = Number(sp.get("pageSize")) || 10;
  const register = sp.get("register") === "1";

  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    select: { code: true },
  });
  const cat6 = isCat6Plant(plant?.code);
  const isPvc = plant?.code?.toUpperCase() === "PVC";
  const ownOnly = seesOwnEntriesOnly(session.user.globalRole);

  const sales = await prisma.sale.findMany({
    where: {
      ...pScope,
      ...(ownOnly ? { enteredById: session.user.id } : {}),
      ...filter,
      ...(cat6
        ? {
            OR: [
              // User-entered rows have `sourceKey = NULL`. In SQL, `NOT (cond)`
              // with NULL inside becomes NULL/false, so we must explicitly allow NULL.
              { sourceKey: null },
              {
                NOT: {
                  OR: [
                    { sourceKey: { endsWith: "sales-online:excel" } },
                    { sourceKey: { contains: "sales-pnl-extra:" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { enteredBy: { select: { globalRole: true } } },
  });

  const isSsl = isSslPlant(plant?.code);

  type SaleItemDetail = {
    id: string;
    itemDescription: string;
    quantity: number;
    unit: string;
    rate: number;
    salesValue: number;
    inMeter?: number | null;
    qtyMtr?: number | null;
    meterUnit?: string | null;
  };

  type GroupedSale = (typeof sales)[0] & {
    items?: SaleItemDetail[];
    itemIds?: string[];
    totalQuantity?: number;
    totalSalesValue?: number;
  };

  let rowsToPaginate: GroupedSale[] = sales;
  if (isSsl) {
    const map = new Map<string, GroupedSale>();
    for (const row of sales) {
      const dateKey = row.date.toISOString().slice(0, 10);
      const billKey = row.billNumber?.trim().toUpperCase() || "";
      const groupKey = billKey ? `${dateKey}|${billKey}` : `row|${row.id}`;
      const itemDetail: SaleItemDetail = {
        id: row.id,
        itemDescription: row.itemDescription,
        quantity: Number(row.quantity) || 0,
        unit: row.unit,
        rate: Number(row.rate) || 0,
        salesValue: Number(row.salesValue) || 0,
        inMeter: row.inMeter ? Number(row.inMeter) : null,
        qtyMtr: row.qtyMtr ? Number(row.qtyMtr) : null,
        meterUnit: row.meterUnit,
      };

      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          ...row,
          items: [itemDetail],
          itemIds: [row.id],
          totalQuantity: itemDetail.quantity,
          totalSalesValue: itemDetail.salesValue,
        });
      } else {
        existing.items!.push(itemDetail);
        existing.itemIds!.push(row.id);
        existing.totalQuantity = round2(
          (existing.totalQuantity || 0) + itemDetail.quantity,
        );
        existing.totalSalesValue = round2(
          (existing.totalSalesValue || 0) + itemDetail.salesValue,
        );
        if (row.billPhotoUrls && row.billPhotoUrls.length > 0) {
          existing.billPhotoUrls = Array.from(
            new Set([...existing.billPhotoUrls, ...row.billPhotoUrls]),
          );
        }
      }
    }

    rowsToPaginate = Array.from(map.values()).map((inv) => {
      if (inv.items && inv.items.length > 1) {
        return {
          ...inv,
          quantity: inv.totalQuantity as unknown as typeof inv.quantity,
          salesValue: inv.totalSalesValue as unknown as typeof inv.salesValue,
          itemDescription: inv.items
            .map((it) => `${it.itemDescription} (Qty: ${it.quantity})`)
            .join(", "),
        };
      }
      return inv;
    });
  }

  const { slice, ...pageInfo } = paginate(rowsToPaginate, page, pageSize);
  const totals = sales.reduce(
    (acc, row) => {
      const val = Number(row.salesValue) || 0;
      const qty = Number(row.quantity) || 0;
      acc.salesValue += val;
      acc.quantity += qty;
      acc.inMeter += Number(row.inMeter) || 0;
      acc.qtyMtr += Number(row.qtyMtr) || 0;

      const cat = getSaleCategory(row);
      if (cat === "FREIGHT") {
        acc.freightSales += val;
      } else if (cat === "INSPECTION") {
        acc.inspectionSales += val;
      } else if (cat === "INTEREST") {
        acc.interestSales += val;
      } else {
        acc.goodsSales += val;
        acc.goodsQuantity += qty;
      }
      return acc;
    },
    {
      salesValue: 0,
      quantity: 0,
      inMeter: 0,
      qtyMtr: 0,
      goodsSales: 0,
      goodsQuantity: 0,
      freightSales: 0,
      inspectionSales: 0,
      interestSales: 0,
      totalSales: 0,
    },
  );
  totals.totalSales = totals.salesValue;
  if (
    totals.goodsSales === 0 &&
    totals.freightSales === 0 &&
    totals.inspectionSales === 0 &&
    totals.interestSales === 0
  ) {
    totals.goodsSales = totals.salesValue;
    totals.goodsQuantity = totals.quantity;
  }

  const rowsWithStatus = slice.map((s) => ({
    ...s,
    ...resolveEntryApprovalFlags(s, s.enteredBy?.globalRole ?? null),
  }));

  return NextResponse.json({ rows: rowsWithStatus, ...pageInfo, totals });
}
