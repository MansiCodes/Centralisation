"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useApiSwr } from "@/lib/client/apiSwr";
import type { StockOrderBySize } from "@/lib/stock/order-excel-types";

type OrdersApi = {
  byKey?: Record<string, StockOrderBySize>;
  fileName?: string;
  error?: string;
};

export function useStockOrders(plantId: string) {
  const ordersFileRef = useRef<HTMLInputElement>(null);
  const [ordersByKey, setOrdersByKey] = useState<
    Record<string, StockOrderBySize> | null
  >(null);
  const [ordersFileName, setOrdersFileName] = useState<string | null>(null);
  const [ordersUploading, setOrdersUploading] = useState(false);
  const [ordersHydrated, setOrdersHydrated] = useState(false);
  const ordersStorageKey = `stock-orders-excel:v4:${plantId}`;
  const ordersUrl = `/api/plants/${plantId}/stock/orders-excel`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ordersStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          byKey?: Record<string, StockOrderBySize>;
          fileName?: string | null;
        };
        if (parsed.byKey && typeof parsed.byKey === "object") {
          setOrdersByKey(parsed.byKey);
          setOrdersFileName(parsed.fileName ?? null);
        }
      }
    } catch {
      // ignore bad cache
    }
    setOrdersHydrated(true);
  }, [ordersStorageKey]);

  const { data: remoteOrders } = useApiSwr<OrdersApi>(
    ordersHydrated ? ordersUrl : null,
  );

  useEffect(() => {
    if (!remoteOrders?.byKey) return;
    if (Object.keys(remoteOrders.byKey).length > 0) {
      setOrdersByKey(remoteOrders.byKey);
      if (remoteOrders.fileName) setOrdersFileName(remoteOrders.fileName);
    }
  }, [remoteOrders]);

  useEffect(() => {
    if (!ordersHydrated) return;
    try {
      if (!ordersByKey) {
        window.localStorage.removeItem(ordersStorageKey);
        return;
      }
      window.localStorage.setItem(
        ordersStorageKey,
        JSON.stringify({ byKey: ordersByKey, fileName: ordersFileName }),
      );
    } catch {
      // quota / private mode
    }
  }, [ordersByKey, ordersFileName, ordersHydrated, ordersStorageKey]);

  async function onOrdersExcelSelected(file: File | null) {
    if (!file) return;
    setOrdersUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(ordersUrl, { method: "POST", body });
      const json = (await res.json()) as OrdersApi & {
        matchedRows?: number;
        unmatchedSizes?: string[];
      };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setOrdersByKey(json.byKey ?? {});
      setOrdersFileName(json.fileName ?? file.name);
      void mutate(ordersUrl, json, { revalidate: false });
      const unmatched = json.unmatchedSizes?.length ?? 0;
      toast.success(
        unmatched > 0
          ? `Matched ${json.matchedRows ?? 0} row(s); ${unmatched} size(s) not mapped`
          : `Matched ${json.matchedRows ?? 0} order row(s)`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setOrdersUploading(false);
      if (ordersFileRef.current) ordersFileRef.current.value = "";
    }
  }

  function clearOrders() {
    setOrdersByKey(null);
    setOrdersFileName(null);
    void mutate(ordersUrl, { byKey: {} }, { revalidate: false });
    fetch(ordersUrl, { method: "DELETE" }).catch(() => {});
  }

  return {
    ordersFileRef,
    ordersByKey,
    ordersFileName,
    ordersUploading,
    onOrdersExcelSelected,
    clearOrders,
    hasOrders: Boolean(ordersByKey && Object.keys(ordersByKey).length > 0),
  };
}
