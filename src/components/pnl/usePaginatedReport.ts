"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import {
  listenPlantEntrySaved,
  useApiSwr,
} from "@/lib/client/apiSwr";

export const DEFAULT_REPORT_PAGE_SIZE = 10;
export const REPORT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PaginatedResponse<T> = {
  rows?: T[];
  page?: number;
  total?: number;
  error?: string;
  [key: string]: unknown;
};

function reportUrl(baseUrl: string, page: number, pageSize: number) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}page=${page}&pageSize=${pageSize}`;
}

export function usePaginatedReport<T>(
  baseUrl: string,
  fallbackError: string,
  initialPageSize = DEFAULT_REPORT_PAGE_SIZE,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [baseUrl]);

  useEffect(() => {
    return listenPlantEntrySaved((plantId) => {
      if (plantId && !baseUrl.includes(plantId)) return;
      void mutate(
        (key) => typeof key === "string" && key.startsWith(baseUrl.split("?")[0]!),
        undefined,
        { revalidate: true },
      );
    });
  }, [baseUrl]);

  const url = enabled ? reportUrl(baseUrl, page, pageSize) : null;
  const { data, error, isLoading, isValidating } = useApiSwr<PaginatedResponse<T>>(
    url,
    {
      onSuccess: (json) => {
        if (json.page && json.page !== page) setPage(json.page);
      },
    },
  );

  function changePageSize(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  return {
    rows: data?.rows ?? [],
    page,
    pageSize,
    total: data?.total ?? 0,
    loading: enabled && isLoading && !data,
    refreshing: isValidating && Boolean(data),
    error: error ? error.message || fallbackError : null,
    response: data ?? null,
    reload: () => {
      if (url) void mutate(url);
    },
    setPage,
    setPageSize: changePageSize,
  };
}
