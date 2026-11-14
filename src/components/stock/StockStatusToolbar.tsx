"use client";

import { useState, type RefObject } from "react";
import { IconUpload } from "@/components/icons/AppIcons";
import { PnlThemedDateField } from "@/components/pnl/PnlThemedDateField";
import { StockOrdersClearDialog } from "./StockOrdersClearDialog";

export { useStockOrders } from "./useStockOrders";
export { CalendarIcon } from "./StockStatusCalendarIcon";

export function StockStatusToolbar({
  tab,
  date,
  today,
  ordersFileRef,
  ordersFileName,
  ordersUploading,
  onSetTab,
  onSetDate,
  onOrdersExcelSelected,
  onClearOrders,
}: {
  tab: "cable" | "raw";
  date: string;
  today: string;
  /** @deprecated kept for callers */
  isToday?: boolean;
  dateInputRef?: RefObject<HTMLInputElement | null>;
  ordersFileRef: RefObject<HTMLInputElement | null>;
  ordersFileName: string | null;
  ordersUploading: boolean;
  onSetTab: (tab: "cable" | "raw") => void;
  onSetDate: (date: string) => void;
  onOpenCalendar?: () => void;
  onOrdersExcelSelected: (file: File | null) => void;
  onClearOrders: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="stock-status-toolbar">
      <div className="stock-status-toolbar__top-row">
        <div className="stock-status-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "cable"}
            className={`stock-status-tabs__btn${tab === "cable" ? " is-active" : ""}`}
            onClick={() => onSetTab("cable")}
          >
            Cable
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "raw"}
            className={`stock-status-tabs__btn${tab === "raw" ? " is-active" : ""}`}
            onClick={() => onSetTab("raw")}
          >
            Raw Materials
          </button>
        </div>

        <div className="stock-status-toolbar__actions">
          <div
            className="stock-status-toolbar__date"
            title="Shows the latest stock filled for this date. If a size was filled on an earlier day and not filled again, that earlier fill still shows."
          >
            <PnlThemedDateField
              id="stock-date"
              label="Stock as of date"
              hideLabel
              value={date}
              max={today}
              align="end"
              onChange={onSetDate}
            />
          </div>

          {tab === "cable" ? (
            <div className="stock-orders-upload">
              <input
                ref={ordersFileRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(e) => void onOrdersExcelSelected(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="stock-orders-upload__btn"
                disabled={ordersUploading}
                onClick={() => ordersFileRef.current?.click()}
                aria-label={ordersUploading ? "Reading Excel" : "Upload Excel"}
                title={ordersFileName || "Upload Excel"}
              >
                <IconUpload size={15} />
                <span className="stock-orders-upload__label">
                  {ordersUploading ? "…" : "Upload"}
                </span>
              </button>
              {ordersFileName ? (
                <button
                  type="button"
                  className="stock-orders-upload__clear"
                  onClick={() => setConfirmClear(true)}
                  title={ordersFileName}
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <StockOrdersClearDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          onClearOrders();
        }}
      />
    </div>
  );
}
