import type { SelectMenuItem } from "./select-menu-types";

export function firstWordFirstLetter(s: string) {
  const word = s
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9.]+/)
    .find(Boolean);
  return word?.charAt(0) ?? "";
}

export function optionStartsWith(opt: SelectMenuItem, q: string) {
  const key = q.charAt(0);
  if (!key) return true;
  return [opt.label, opt.searchText ?? ""].some(
    (s) => firstWordFirstLetter(s) === key,
  );
}