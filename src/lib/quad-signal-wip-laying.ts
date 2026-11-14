import { round4 } from "@/lib/quad-signal-wip-length";

/** consumed = layingProduced × coreCount × lengthFactor */
export function insulationConsumedFromLaying(params: {
  layingProduced: number;
  coreCount: number;
  lengthFactor: number;
}): number {
  const laying = Number(params.layingProduced);
  const cores = Number(params.coreCount);
  const factor = Number(params.lengthFactor);
  if (
    !Number.isFinite(laying) ||
    !Number.isFinite(cores) ||
    !Number.isFinite(factor) ||
    laying < 0 ||
    cores <= 0 ||
    factor <= 0
  ) {
    return 0;
  }
  return round4(laying * cores * factor);
}