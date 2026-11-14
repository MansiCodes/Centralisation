import { parseDateOnly } from "@/lib/dates";

export function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function monthLabel(iso: string): string {
  const d = parseDateOnly(iso);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDay(iso: string): string {
  const d = parseDateOnly(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function pettyPhotoFields(row: {
  billPhotoUrl: string | null;
  billPhotoUrls: string[];
}) {
  return {
    billPhotoUrl: row.billPhotoUrl,
    billPhotoUrls: row.billPhotoUrls,
  };
}