"use client";

import { useMemo } from "react";
import type { PlantPnlStatement } from "@/lib/pnl/types";
import {
  PnlStatement,
  PnlStatementSkeleton,
} from "@/components/pnl/PnlStatement";
import { useApiSwr } from "@/lib/client/apiSwr";

type PnlApiResponse = {
  pnl?: PlantPnlStatement;
  error?: string;
};

function pnlHasData(pnl: PlantPnlStatement | null | undefined) {
  if (!pnl) return false;
  return (
    pnl.salesRevenue > 0 ||
    pnl.purchases > 0 ||
    pnl.openingStock > 0 ||
    pnl.closingStock > 0 ||
    pnl.pettyCash > 0 ||
    pnl.electricity > 0 ||
    pnl.rent > 0 ||
    pnl.manpower > 0 ||
    pnl.grossProfit !== 0 ||
    pnl.netProfit !== 0
  );
}

export function PnlReportTab({
  plantId,
  plantCode,
  from,
  to,
}: {
  plantId: string;
  plantCode?: string;
  plantName?: string;
  from: string;
  to: string;
}) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return `/api/plants/${plantId}/pnl${qs ? `?${qs}` : ""}`;
  }, [plantId, from, to]);

  const { data, error, isLoading } = useApiSwr<PnlApiResponse>(url);
  const pnl = data?.pnl ?? null;
  const hasData = pnlHasData(pnl);

  return (
    <div>
      {error ? (
        <div className="alert alert--error">{error.message}</div>
      ) : null}
      {isLoading && !pnl ? (
        <PnlStatementSkeleton />
      ) : hasData && pnl ? (
        <PnlStatement
          plantCode={plantCode}
          trading={pnl.trading}
          indirect={pnl.indirect}
        />
      ) : (
        <p className="mp-muted" style={{ margin: "1rem 0" }}>
          No P&amp;L figures for this range.
        </p>
      )}
    </div>
  );
}
