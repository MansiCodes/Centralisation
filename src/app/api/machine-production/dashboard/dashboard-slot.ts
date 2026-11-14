import { MachineProductionShift } from "@prisma/client";
import {
  addDaysYmd,
  buildSlotContext,
  type ShiftFilter,
  resolveCurrentSlot,
  slotsForShift,
} from "@/lib/machine-production/slots";

export function parseShiftFilter(raw: string | null): ShiftFilter {
  if (raw === "DAY" || raw === "NIGHT" || raw === "ALL") return raw;
  return "ALL";
}

export function viewSlotForFilter(
  shiftFilter: ShiftFilter,
  current: ReturnType<typeof resolveCurrentSlot>,
) {
  if (shiftFilter === "ALL" || shiftFilter === current.shift) {
    return current;
  }

  const focusShift = shiftFilter as MachineProductionShift;
  let entryDate = current.entryDate;

  if (
    focusShift === "DAY" &&
    current.shift === "NIGHT" &&
    current.slotStartHour !== 21
  ) {
    entryDate = addDaysYmd(current.entryDate, 1);
  }

  if (focusShift === "NIGHT" && current.shift === "DAY") {
    entryDate = current.entryDate;
  }

  return buildSlotContext(
    focusShift,
    entryDate,
    slotsForShift(focusShift)[0]!,
  );
}

export function slotContext(activeSlot: ReturnType<typeof resolveCurrentSlot>) {
  return {
    shift: activeSlot.shift,
    entryDate: activeSlot.entryDate,
    slotStartHour: activeSlot.slotStartHour,
    slotLabel: activeSlot.slotLabel,
    deadlineIso: activeSlot.deadlineIso,
    deadlineLabel: activeSlot.deadlineLabel,
  };
}

type EntryRow = {
  machineId: string;
  currentProcess: string | null;
  actualProduction: unknown;
  submittedAt: Date;
  id: string;
  efficiencyPct: unknown;
};

export type SlotAgg = {
  latest: EntryRow;
  entryCount: number;
  totalActual: number;
};

export function aggregateForProcess(
  entries: EntryRow[],
  processName: string | null,
) {
  const map = new Map<string, SlotAgg>();
  for (const e of entries) {
    if (processName && e.currentProcess !== processName) continue;
    const cur = map.get(e.machineId);
    if (!cur) {
      map.set(e.machineId, {
        latest: e,
        entryCount: 1,
        totalActual: Number(e.actualProduction),
      });
    } else {
      cur.entryCount += 1;
      cur.totalActual += Number(e.actualProduction);
    }
  }
  return map;
}