import { getQuadFactorFromSize } from "@/lib/quad-signal-wip-master";
import { round4 } from "@/lib/quad-signal-wip-length";
import type {
  ProcessQtyMap,
  WipCalcInput,
  WipCalcResult,
  WipStageResult,
} from "@/lib/quad-signal-wip-types";
import { insulationConsumedFromLaying } from "./quad-signal-wip-laying";

function num(map: ProcessQtyMap, key: string): number {
  const v = map[key];
  if (v == null || v === ("" as unknown as number)) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function calculateQuadSignalWip(input: WipCalcInput & {
  singleQuadConsumedOverride?: number;
  sizeName?: string;
}): WipCalcResult {
  const {
    processes,
    opening,
    production,
    salesKm,
    coreCount,
    lengthFactor,
    insulationConsumedOverride,
    singleQuadConsumedOverride,
    sizeName = "",
  } = input;
  const warnings: string[] = [];
  const stages: WipStageResult[] = [];
  const byProcess: ProcessQtyMap = {};

  if (processes.length === 0) {
    return {
      stages: [],
      byProcess: {},
      insulationConsumed: 0,
      salesKm,
      finishedProcess: null,
      warnings: ["No process chain configured."],
      calcSnapshot: {
        coreCount,
        lengthFactor,
        layingProduced: 0,
        insulationConsumed: 0,
        salesKm,
      },
    };
  }

  const finishedProcess = processes[processes.length - 1]!;
  const layingIdx = processes.findIndex((p) => {
    const n = p.toLowerCase();
    return n === "laying" || n.startsWith("laying ");
  });
  const singleQuadIdx = processes.findIndex(
    (p) => p.toLowerCase() === "single quad",
  );
  const insulationIdx = processes.findIndex(
    (p) => p.toLowerCase() === "insulation",
  );

  const layingProduced =
    layingIdx >= 0 ? num(production, processes[layingIdx]!) : 0;
  const singleQuadProduced =
    singleQuadIdx >= 0 ? num(production, processes[singleQuadIdx]!) : 0;

  // Single Quad calculation
  const quadFactor = sizeName
    ? getQuadFactorFromSize(sizeName)
    : coreCount >= 4
      ? coreCount / 4
      : 6;

  const singleQuadConsumedFromPrimary =
    singleQuadIdx >= 0 && layingIdx >= 0
      ? round4(layingProduced * quadFactor)
      : 0;
  const singleQuadConsumed =
    singleQuadConsumedOverride != null &&
    Number.isFinite(singleQuadConsumedOverride) &&
    singleQuadConsumedOverride >= 0
      ? round4(singleQuadConsumedOverride)
      : singleQuadConsumedFromPrimary;

  // Insulation calculation
  const insulationConsumedFromPrimary =
    insulationIdx >= 0
      ? singleQuadIdx >= 0
        ? round4(singleQuadProduced * 4) // 1 Single Quad = 4 insulation wires
        : layingIdx >= 0
          ? insulationConsumedFromLaying({
              layingProduced,
              coreCount,
              lengthFactor,
            })
          : 0
      : 0;

  const insulationConsumed =
    insulationConsumedOverride != null &&
    Number.isFinite(insulationConsumedOverride) &&
    insulationConsumedOverride >= 0
      ? round4(insulationConsumedOverride)
      : insulationConsumedFromPrimary;

  for (let i = 0; i < processes.length; i++) {
    const process = processes[i]!;
    const open = num(opening, process);
    const prod = num(production, process);
    const isFinished = i === processes.length - 1;
    const isInsulation = insulationIdx === i;
    const isSingleQuad = singleQuadIdx === i;

    let outbound = 0;
    let outboundKind: WipStageResult["outboundKind"] = "none";

    if (isInsulation && (layingIdx > insulationIdx || singleQuadIdx > insulationIdx)) {
      outbound = insulationConsumed;
      outboundKind = "insulation_to_laying";
    } else if (isSingleQuad && layingIdx > singleQuadIdx) {
      outbound = singleQuadConsumed;
      outboundKind = "next_process";
    } else if (isFinished) {
      outbound = salesKm > 0 ? salesKm : 0;
      outboundKind = salesKm > 0 ? "sales" : "none";
    } else {
      const next = processes[i + 1]!;
      outbound = num(production, next);
      outboundKind = "next_process";
    }

    const available = open + prod;
    if (outbound > available + 1e-9) {
      warnings.push(
        `${process}: outbound ${outbound} exceeds available ${round4(available)}.`,
      );
    }

    const closing = round4(open + prod - outbound);
    stages.push({
      process,
      opening: open,
      production: prod,
      outbound,
      outboundKind,
      closing,
    });
    byProcess[process] = closing;
  }

  return {
    stages,
    byProcess,
    insulationConsumed,
    salesKm,
    finishedProcess,
    warnings,
    calcSnapshot: {
      coreCount,
      lengthFactor,
      layingProduced,
      insulationConsumed,
      salesKm,
    },
  };
}
