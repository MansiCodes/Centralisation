import { useMemo } from "react";
import type { CentralDirectoryUser } from "@/lib/central/directory-types";
import { CENTRAL_PAGE_SIZE } from "./apps-launcher-types";

export function useUserPagination(users: CentralDirectoryUser[], page: number) {
  const pageCount = Math.max(1, Math.ceil(users.length / CENTRAL_PAGE_SIZE));

  const pageUsers = useMemo(() => {
    const start = (page - 1) * CENTRAL_PAGE_SIZE;
    return users.slice(start, start + CENTRAL_PAGE_SIZE);
  }, [users, page]);

  const pageButtons = useMemo(() => {
    const maxButtons = 5;
    if (pageCount <= maxButtons) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - 2);
    const end = Math.min(pageCount, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, pageCount]);

  return { pageCount, pageUsers, pageButtons };
}