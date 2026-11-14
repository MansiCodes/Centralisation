export function findCol(
  map: Map<string, number>,
  aliases: string[],
): number | undefined {
  for (const a of aliases) {
    const hit = map.get(a);
    if (hit != null) return hit;
  }
  for (const [h, idx] of map) {
    for (const a of aliases) {
      if (h === a || h.includes(a) || a.includes(h)) return idx;
    }
  }
  return undefined;
}

/** Exact Done/Supplied header only — not "dated" (contains "done"). */
export function findDoneCol(map: Map<string, number>): number | undefined {
  const exact = [
    "done",
    "done qty",
    "qty done",
    "supplied",
    "supplied qty",
    "qty supplied",
    "offered",
    "offered qty",
    "ready qty",
    "executed",
    "executed qty",
    "call putup",
    "call put up",
  ];
  for (const a of exact) {
    const hit = map.get(a);
    if (hit != null) return hit;
  }
  for (const [h, idx] of map) {
    if (h === "dated" || h === "date") continue;
    if (/\bdone\b/.test(h) || /\bsupplied\b/.test(h)) return idx;
  }
  return undefined;
}