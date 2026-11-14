import { extrasFromPoolContributions } from "@/components/today/hub/add-insulation-extra";
import { isSignallingCableName } from "@/lib/quad-signal-wip";
import {
  applyCallPutupFromMeta,
  applyDispatchFromMeta,
  applyLengthOptions,
  applySaleFromMeta,
} from "./apply-quad-wip-meta";
import { applyQtyMaps } from "./apply-quad-wip-qty-maps";
import type { ApplyQuadWipOpts, QuadWipContextData, QuadWipSetters } from "./quad-wip-context-types";
import { resetQuadWipFields, resetQuadWipFieldsOnError } from "./quad-wip-reset-fields";

export function applyQuadWipContextData(
  s: QuadWipSetters,
  data: QuadWipContextData,
  opts?: ApplyQuadWipOpts,
) {
  applyQtyMaps(s, data, opts);
  s.setStockOpeningEditable(Boolean(data.openingEditable));
  s.setStockWipSalesKm(0);
  s.setStockOrderPutupKm(0);
  s.setStockWipSalesLines(data.sales ?? []);
  applyLengthOptions(s, data.variant);
  const meta = data.stockMeta;
  s.setStockCallPutup(meta?.callPutup ?? "");
  s.setStockPutupDate(meta?.putupDate ?? "");
  s.setStockPartyName(meta?.partyName ?? "");
  s.setStockDispatchPending(meta?.dispatchPending ?? "");
  s.setStockDispatchParty(meta?.dispatchParty ?? "");
  applyCallPutupFromMeta(s, meta);
  applyDispatchFromMeta(s, meta);
  applySaleFromMeta(s, meta);
  const factor = meta?.powerLayingFactor;
  s.setStockPowerLayingFactor(
    factor != null && Number.isFinite(factor) && factor >= 0 && factor <= 99
      ? String(Math.round(factor))
      : "",
  );
  const cable = data.cable ?? "";
  if (!opts?.preserveInsulation) {
    if (isSignallingCableName(cable)) {
      const extras = extrasFromPoolContributions(
        "Signalling Cable",
        data.insulationContributions ?? [],
      );
      s.setStockInsulationExtras(extras);
      s.setStockInsulationExtrasOpen(extras.length > 0);
    } else {
      s.setStockInsulationExtras([]);
      s.setStockInsulationExtrasOpen(false);
    }
  }
  s.setStockWipContextLoading(false);
}

export { resetQuadWipFields, resetQuadWipFieldsOnError };
export type { ApplyQuadWipOpts, QuadWipContextData, QuadWipSetters };