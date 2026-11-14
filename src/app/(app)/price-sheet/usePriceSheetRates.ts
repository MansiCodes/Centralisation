import { useCallback, useEffect, useRef, useState } from "react";
import type { CableRate } from "@/lib/sheets/types";
import { AUTO_SYNC_MS } from "@/app/(app)/price-sheet/price-sheet-utils";

export function usePriceSheetRates() {
  const [rates, setRates] = useState<CableRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const ratesCountRef = useRef(0);

  const fetchRates = useCallback(async () => {
    const response = await fetch("/api/rates");
    const payload = (await response.json()) as {
      success?: boolean;
      message?: string;
      data?: CableRate[];
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Failed to load rates");
    }

    const next = Array.isArray(payload.data) ? payload.data : [];
    ratesCountRef.current = next.length;
    setRates(next);
    setError(null);
  }, []);

  const syncFromSheet = useCallback(
    async ({ showSkeleton = false }: { showSkeleton?: boolean } = {}) => {
      setSyncing(true);
      if (showSkeleton) setLoading(true);

      try {
        const refreshRes = await fetch("/api/rates/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const refreshPayload = (await refreshRes.json()) as {
          success?: boolean;
          message?: string;
        };

        if (!refreshRes.ok || !refreshPayload.success) {
          throw new Error(refreshPayload.message || "Cache refresh failed");
        }

        await fetchRates();
      } catch (err) {
        if (showSkeleton && ratesCountRef.current === 0) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load rates. Check API / sheet sharing.",
          );
        }
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [fetchRates],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await fetchRates();
      } catch {
        if (!cancelled) {
          setError("Could not load rates. Check API / sheet sharing.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const timer = window.setInterval(() => {
      void syncFromSheet({ showSkeleton: false });
    }, AUTO_SYNC_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [fetchRates, syncFromSheet]);

  return {
    rates,
    loading,
    syncing,
    error,
    isCompact,
    fetchRates,
    syncFromSheet,
  };
}