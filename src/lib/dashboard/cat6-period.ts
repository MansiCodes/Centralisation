import { prisma } from "@/lib/db";
import { isCat6Plant } from "@/lib/plant-layout";
import {
  getDashboardPeriodBounds,
  type DashboardPeriod,
  type PeriodBounds,
} from "@/lib/dashboard/period";

/** CAT6 has Excel registers, not a filled current month — use last month with rows. */
export function cat6MonthAnchorToday(
  period: DashboardPeriod,
  isCat6: boolean,
  windowCount: number,
  lastActivityYmd: string | null,
  today: string,
): string {
  if (!isCat6 || period !== "month" || windowCount > 0 || !lastActivityYmd) {
    return today;
  }
  if (lastActivityYmd >= today) return today;
  return lastActivityYmd;
}

export async function snapCat6EmptyMonthBounds(opts: {
  plants: Array<{ code: string }>;
  period: DashboardPeriod;
  bounds: PeriodBounds;
  today: string;
  reportPlantIds: string[];
}): Promise<PeriodBounds> {
  const isCat6 = opts.plants.some((p) => isCat6Plant(p.code));
  if (!isCat6 || opts.period !== "month") return opts.bounds;

  const where = {
    plantId: { in: opts.reportPlantIds },
    date: { gte: opts.bounds.periodStart, lte: opts.bounds.periodEnd },
  };
  const [sales, purchases] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.purchase.count({ where }),
  ]);
  const last = await latestRegisterYmd(opts.reportPlantIds);
  const anchor = cat6MonthAnchorToday(
    opts.period,
    true,
    sales + purchases,
    last,
    opts.today,
  );
  if (anchor === opts.today) return opts.bounds;
  return getDashboardPeriodBounds("month", anchor);
}

async function latestRegisterYmd(plantIds: string[]): Promise<string | null> {
  const where = { plantId: { in: plantIds } };
  const [sale, purchase, petty] = await Promise.all([
    prisma.sale.aggregate({ where, _max: { date: true } }),
    prisma.purchase.aggregate({ where, _max: { date: true } }),
    prisma.pettyCashEntry.aggregate({ where, _max: { date: true } }),
  ]);
  const dates = [sale._max.date, purchase._max.date, petty._max.date].filter(
    (d): d is Date => d != null,
  );
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())))
    .toISOString()
    .slice(0, 10);
}
