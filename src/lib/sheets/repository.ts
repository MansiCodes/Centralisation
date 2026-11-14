import { sheetsCache } from "./cache";
import { CACHE_KEYS, type CableRate } from "./types";
import {
  fetchDailyRatesFromSheet,
  resetResolvedSheetName,
} from "./sheets-google-read";

let inFlightFetch: Promise<CableRate[]> | null = null;

async function loadAndCache(): Promise<CableRate[]> {
  if (inFlightFetch) return inFlightFetch;

  inFlightFetch = fetchDailyRatesFromSheet()
    .then((rates) => {
      sheetsCache.set(CACHE_KEYS.DAILY_RATES, rates);
      sheetsCache.set(CACHE_KEYS.LAST_REFRESH_AT, new Date().toISOString(), 0);
      return rates;
    })
    .finally(() => {
      inFlightFetch = null;
    });

  return inFlightFetch;
}

/**
 * Cache-aside repository over Google Sheets Master List rates.
 */
export async function getAllRates(): Promise<CableRate[]> {
  const cached = sheetsCache.get<CableRate[]>(CACHE_KEYS.DAILY_RATES);
  if (cached) return cached;
  return loadAndCache();
}

export async function refreshRatesCache(): Promise<{
  rates: CableRate[];
  lastRefreshTime: string | null;
  count: number;
}> {
  sheetsCache.del(CACHE_KEYS.DAILY_RATES);
  inFlightFetch = null;
  resetResolvedSheetName();

  const rates = await loadAndCache();
  return {
    rates,
    count: rates.length,
    lastRefreshTime:
      sheetsCache.get<string>(CACHE_KEYS.LAST_REFRESH_AT) ?? null,
  };
}

export function getLastRefreshTime(): string | null {
  return sheetsCache.get<string>(CACHE_KEYS.LAST_REFRESH_AT) ?? null;
}