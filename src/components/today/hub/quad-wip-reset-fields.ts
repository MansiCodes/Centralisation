import { EMPTY_STOCK_SALE_ITEM } from "@/components/today/hub/useTodayHubStockCallFields";
import type { QuadWipSetters } from "./quad-wip-context-types";

export function resetQuadWipFields(s: QuadWipSetters) {
  s.setStockWipOpening({});
  s.setStockProcessQtys({});
  s.setStockProcessHints({});
  s.setStockOpeningEditable(false);
  s.setStockWipContextLoading(false);
  s.setStockWipSalesKm(0);
  s.setStockOrderPutupKm(0);
  s.setStockWipSalesLines([]);
  s.setStockCallPutup("");
  s.setStockPutupDate("");
  s.setStockPartyName("");
  s.setStockDispatchPending("");
  s.setStockDispatchParty("");
  s.setStockCallPutupItems([{ qty: "", date: "", partyName: "" }]);
  s.setStockCallPutupLoadedItems([]);
  s.setStockCallPutupLoadedKm(0);
  s.setStockDispatchPendingItems([{ qty: "", partyName: "" }]);
  s.setStockSaleItems([{ ...EMPTY_STOCK_SALE_ITEM }]);
  s.setStockSaleHints([]);
  s.setStockDispatchSettledKm(0);
  s.setStockDispatchSettledItems([]);
  s.setStockDispatchLoadedKm(0);
  s.setStockDispatchLoadedItems([]);
  s.setStockLengthOptions([]);
  s.setStockLengthFactor(null);
  s.setStockInsulationExtras([]);
  s.setStockInsulationExtrasOpen(false);
  s.setStockPowerLayingFactor("");
}

export function resetQuadWipFieldsOnError(s: QuadWipSetters) {
  s.setStockWipOpening({});
  s.setStockProcessQtys({});
  s.setStockProcessHints({});
  s.setStockOpeningEditable(false);
  s.setStockWipSalesKm(0);
  s.setStockOrderPutupKm(0);
  s.setStockWipSalesLines([]);
  s.setStockCallPutup("");
  s.setStockPutupDate("");
  s.setStockPartyName("");
  s.setStockDispatchPending("");
  s.setStockDispatchParty("");
  s.setStockCallPutupItems([{ qty: "", date: "", partyName: "" }]);
  s.setStockCallPutupLoadedItems([]);
  s.setStockCallPutupLoadedKm(0);
  s.setStockDispatchPendingItems([{ qty: "", partyName: "" }]);
  s.setStockSaleItems([{ ...EMPTY_STOCK_SALE_ITEM }]);
  s.setStockSaleHints([]);
  s.setStockDispatchSettledKm(0);
  s.setStockDispatchSettledItems([]);
  s.setStockDispatchLoadedKm(0);
  s.setStockDispatchLoadedItems([]);
  s.setStockInsulationExtras([]);
  s.setStockInsulationExtrasOpen(false);
  s.setStockPowerLayingFactor("");
  s.setStockWipContextLoading(false);
}