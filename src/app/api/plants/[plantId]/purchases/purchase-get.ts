import { NextRequest, NextResponse } from "next/server";
import { requirePlantAccess, requireSession, round2 } from "@/lib/api";
import { resolveEntryApprovalFlags } from "@/lib/entry-approval";
import { dateRangeFromSearchParams } from "@/lib/api-date-range";
import { prisma } from "@/lib/db";
import { isCat6Plant, isSslPlant } from "@/lib/plant-layout";
import { isAtclPurchase } from "@/lib/plant-catalogs";
import { seesOwnEntriesOnly } from "@/lib/rbac";
import { paginate } from "@/lib/ui/paginate";
import { plantIdFilter, resolveReportPlantIds } from "@/lib/plant-merge";
import type { RouteContext } from "./purchase-schemas";

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
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
    const excludeAtc = sp.get("excludeAtc") === "1";
    const excludeAtcl = sp.get("excludeAtcl") === "1";
    const atclOnly = sp.get("atclOnly") === "1";

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: { code: true },
    });
    const cat6 = isCat6Plant(plant?.code);
    const isSsl = isSslPlant(plant?.code);
    const unloadingRate = 70;
    const ownOnly = seesOwnEntriesOnly(session.user.globalRole);

    let purchases = await prisma.purchase.findMany({
      where: {
        ...pScope,
        ...(ownOnly ? { enteredById: session.user.id } : {}),
        ...filter,
        ...(cat6 && excludeAtc
          ? {
              OR: [
                { sourceKey: null },
                { NOT: { sourceKey: { contains: "purchase-atc" } } },
              ],
            }
          : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { enteredBy: { select: { globalRole: true } } },
    });

    if (excludeAtcl || atclOnly) {
      purchases = purchases.filter((row) =>
        atclOnly ? isAtclPurchase(row) : !isAtclPurchase(row),
      );
    }

    type PurchaseItemDetail = {
      id: string;
      itemDescription: string;
      quantity: number;
      debitQuantity: number;
      unit: string;
      rate: number;
      basicValue: number;
      gstPercent: number;
      gstAmount: number;
      invoiceValue: number;
    };

    type GroupedPurchase = (typeof purchases)[0] & {
      items?: PurchaseItemDetail[];
      itemIds?: string[];
      totalQuantity?: number;
      totalBasicValue?: number;
      totalGstAmount?: number;
      totalInvoiceValue?: number;
    };

    let rowsToPaginate: GroupedPurchase[] = purchases;
    if (isSsl) {
      const map = new Map<string, GroupedPurchase>();
      for (const row of purchases) {
        const dateKey = row.date.toISOString().slice(0, 10);
        const billKey = row.billNumber?.trim().toUpperCase() || "";
        const groupKey = billKey ? `${dateKey}|${billKey}` : `row|${row.id}`;
        const itemDetail: PurchaseItemDetail = {
          id: row.id,
          itemDescription: row.itemDescription,
          quantity: Number(row.quantity) || 0,
          debitQuantity: Number(row.debitQuantity) || 0,
          unit: row.unit,
          rate: Number(row.rate) || 0,
          basicValue: Number(row.basicValue) || 0,
          gstPercent: Number(row.gstPercent) || 0,
          gstAmount: Number(row.gstAmount) || 0,
          invoiceValue: Number(row.invoiceValue) || 0,
        };

        const existing = map.get(groupKey);
        if (!existing) {
          map.set(groupKey, {
            ...row,
            items: [itemDetail],
            itemIds: [row.id],
            totalQuantity: itemDetail.quantity,
            totalBasicValue: itemDetail.basicValue,
            totalGstAmount: itemDetail.gstAmount,
            totalInvoiceValue: itemDetail.invoiceValue,
          });
        } else {
          existing.items!.push(itemDetail);
          existing.itemIds!.push(row.id);
          existing.totalQuantity = round2(
            (existing.totalQuantity || 0) + itemDetail.quantity,
          );
          existing.totalBasicValue = round2(
            (existing.totalBasicValue || 0) + itemDetail.basicValue,
          );
          existing.totalGstAmount = round2(
            (existing.totalGstAmount || 0) + itemDetail.gstAmount,
          );
          existing.totalInvoiceValue = round2(
            (existing.totalInvoiceValue || 0) + itemDetail.invoiceValue,
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
            basicValue: inv.totalBasicValue as unknown as typeof inv.basicValue,
            gstAmount: inv.totalGstAmount as unknown as typeof inv.gstAmount,
            invoiceValue: inv.totalInvoiceValue as unknown as typeof inv.invoiceValue,
            itemDescription: inv.items
              .map((it) => `${it.itemDescription} (Qty: ${it.quantity})`)
              .join(", "),
          };
        }
        return inv;
      });
    }

    const { slice, ...pageInfo } = paginate(rowsToPaginate, page, pageSize);
    const totals = purchases.reduce(
      (acc, row) => {
        acc.quantity += Number(row.quantity) || 0;
        acc.basicValue += Number(row.basicValue) || 0;
        acc.gstAmount += Number(row.gstAmount) || 0;
        acc.invoiceValue += Number(row.invoiceValue) || 0;
        return acc;
      },
      { quantity: 0, basicValue: 0, gstAmount: 0, invoiceValue: 0 },
    );
    const unloadingExpense = round2((totals.quantity / 1000) * unloadingRate);

    const rowsWithStatus = slice.map((p) => ({
      ...p,
      ...resolveEntryApprovalFlags(p, p.enteredBy?.globalRole ?? null),
    }));

    return NextResponse.json({
      rows: rowsWithStatus,
      ...pageInfo,
      totals: { ...totals, unloadingExpense, unloadingRate },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load purchases";
    console.error("purchases GET failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
