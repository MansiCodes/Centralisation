export const INSULATION_KEY = "Insulation";

const PROCESS_KEY_ALIASES: Record<string, string[]> = {
  insulation: ["Insulation"],
  laying: ["Laying"],
  inner: ["Inner Sheath", "Inner"],
  "inner sheath": ["Inner Sheath", "Inner"],
  outer: ["Outer Sheath", "Outer"],
  "outer sheath": ["Outer Sheath", "Outer"],
  armouring: ["Armouring", "Armoring"],
  armoring: ["Armouring", "Armoring"],
  intermediate: ["Intermediate", "Intermediate Sheath"],
  "intermediate sheath": ["Intermediate", "Intermediate Sheath"],
};

export function qtyOnMap(map: Record<string, number> | undefined, proc: string): number {
  if (!map) return 0;
  const aliases = [proc, ...(PROCESS_KEY_ALIASES[proc.trim().toLowerCase()] ?? [])];
  const seen = new Set<string>();
  for (const name of aliases) {
    const want = name.trim().toLowerCase();
    if (!want || seen.has(want)) continue;
    seen.add(want);
    for (const [key, raw] of Object.entries(map)) {
      if (key.trim().toLowerCase() !== want) continue;
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export function processQtyFromMeta(
  map: Record<string, number> | undefined,
  proc: string,
): number {
  return qtyOnMap(map, proc);
}