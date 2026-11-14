import { todayDateString } from "@/lib/dates";

/** Marks that the user chose P&L from the /apps chooser today (IST). */
export const CENTRAL_APP_COOKIE = "cj.central-app";

export function pnlAppCookieValue(day = todayDateString()): string {
  return `pnl:${day}`;
}

export function isPnlChosenToday(raw: string | undefined | null, day = todayDateString()): boolean {
  return String(raw || "") === pnlAppCookieValue(day);
}
