export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toISO(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function formatDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const month = MONTHS_SHORT[Number(m) - 1];
  const day = Number(d);
  if (!month || !Number.isFinite(day) || day < 1) return iso;
  return `${day} ${month} ${y}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

const MENU_WIDTH = 260;
const MENU_HEIGHT = 320;
const EDGE = 16;
const GAP = 8;

export function measureMenu(trigger: HTMLElement, alignEnd: boolean) {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(MENU_WIDTH, window.innerWidth - EDGE * 2);
  let left = alignEnd ? rect.right - width : rect.left;
  left = Math.min(left, window.innerWidth - EDGE - width);
  left = Math.max(EDGE, left);
  const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
  const spaceAbove = rect.top - GAP - EDGE;
  const openUp = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;
  const top = openUp
    ? Math.max(EDGE, rect.top - GAP - Math.min(MENU_HEIGHT, spaceAbove))
    : rect.bottom + GAP;
  return { top, left, width };
}