import { getQuadFactorFromSize } from "@/lib/quad-signal-wip-master";
import { round4 } from "@/lib/quad-signal-wip-length";
import type {
  ProcessQtyMap,
  SharedInsulationSizeContribution,
  WipCalcInput,
  WipCalcResult,
  WipStageResult,
} from "@/lib/quad-signal-wip-types";

function num(map: ProcessQtyMap, key: string): number {
  const v = map[key];
  if (v == null || v === ("" as unknown as number)) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export { insulationConsumedFromLaying } from "./quad-signal-wip-laying";
import { insulationConsumedFromLaying } from "./quad-signal-wip-laying";

/**
 * Signalling Cable: Insulation is one common pool across sizes.
 * Deduction = Σ (laying_s × cores_s × factor_s) — same formula as single-size WIP.
 */
export function calculateSharedSignallingInsulation(params: {
  opening: number;
  production: number;
  sizes: Array<{
    size: string;
    layingProduced: number;
    coreCount: number;
    lengthFactor: number;
  }>;
}): {
  opening: number;
  production: number;
  consumed: number;
  closing: number;
  contributions: SharedInsulationSizeContribution[];
  warnings: string[];
} {
  const opening = Math.max(0, Number(params.opening) || 0);
  const production = Math.max(0, Number(params.production) || 0);
  const contributions: SharedInsulationSizeContribution[] = params.sizes.map(
    (s) => {
      const consumed = insulationConsumedFromLaying({
        layingProduced: s.layingProduced,
        coreCount: s.coreCount,
        lengthFactor: s.lengthFactor,
      });
      return {
        size: s.size,
        layingProduced: Number(s.layingProduced) || 0,
        coreCount: s.coreCount,
        lengthFactor: s.lengthFactor,
        consumed,
      };
    },
  );
  const consumed = round4(
    contributions.reduce((sum, c) => sum + c.consumed, 0),
  );
  const available = opening + production;
  const warnings: string[] = [];
  if (consumed > available + 1e-9) {
    warnings.push(
      `Insulation: outbound ${consumed} exceeds available ${round4(available)}.`,
    );
  }
  return {
    opening,
    production,
    consumed,
    closing: round4(opening + production - consumed),
    contributions,
    warnings,
  };
}

/**
 * Ordered process chain WIP.
 * Intermediate: close = open + prod − nextProd
 * Insulation→Laying / Single Quad: consumed = laying × cores × lengthFactor or single quad × 4
 * Final stage: close = open + prod − salesKm
 */
export { calculateQuadSignalWip } from "./quad-signal-wip-chain";
