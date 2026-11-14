"use client";

import useSWR, { mutate, type SWRConfiguration } from "swr";

export async function apiJsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) {
    throw new Error(
      (json && typeof json === "object" && "error" in json && json.error) ||
        "Request failed",
    );
  }
  return json as T;
}

export function useApiSwr<T>(
  url: string | null,
  config?: SWRConfiguration<T, Error>,
) {
  return useSWR<T, Error>(url, apiJsonFetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
    ...config,
  });
}

/** Revalidate every cached GET whose key starts with prefix. */
export function invalidateApiPrefix(prefix: string) {
  return mutate(
    (key) => typeof key === "string" && key.startsWith(prefix),
    undefined,
    { revalidate: true },
  );
}

export function invalidatePlantApis(plantId: string) {
  return invalidateApiPrefix(`/api/plants/${plantId}`);
}

export function listenPlantEntrySaved(
  onPlant: (plantId: string | null) => void,
): () => void {
  function handler(e: Event) {
    const detail = (e as CustomEvent<{ plantId?: string }>)?.detail;
    onPlant(detail?.plantId ?? null);
  }
  window.addEventListener("cj:today-entry-saved", handler);
  return () => window.removeEventListener("cj:today-entry-saved", handler);
}
