import { resolveSlotStatus, type SlotStatus } from "@/lib/machine-production/slots";
import type { SlotAgg } from "./dashboard-slot";
import { aggregateForProcess, slotContext } from "./dashboard-slot";

type ProcessWithMachines = {
  id: string;
  name: string;
  machines: Array<{
    machineId: string;
    machine: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      isActive: boolean;
    };
  }>;
};

type SlotCtx = {
  current: ReturnType<typeof import("@/lib/machine-production/slots").resolveCurrentSlot>;
  activeSlot: SlotCtx["current"];
  shiftFilter: import("@/lib/machine-production/slots").ShiftFilter;
  now: Date;
};

export function buildMachinesResponse(
  process: ProcessWithMachines,
  byMachine: Map<string, SlotAgg>,
  { current, activeSlot, shiftFilter, now }: SlotCtx,
) {
  const statusFor = (machineId: string): SlotStatus =>
    resolveSlotStatus({
      submitted: byMachine.has(machineId),
      deadlineIso: activeSlot.deadlineIso,
      now,
    });

  const cards = process.machines
    .filter((link) => link.machine.isActive)
    .map((link) => {
      const m = link.machine;
      const agg = byMachine.get(m.id);
      const entry = agg?.latest;
      return {
        id: m.id,
        name: m.name,
        code: m.code,
        description: m.description,
        status: statusFor(m.id),
        entryId: entry?.id ?? null,
        entryCount: agg?.entryCount ?? 0,
        actualProduction: entry ? Number(entry.actualProduction) : null,
        totalActualProduction: agg ? agg.totalActual : null,
        efficiencyPct: entry ? Number(entry.efficiencyPct) : null,
        submittedAt: entry?.submittedAt.toISOString() ?? null,
      };
    });

  return {
    ok: true,
    level: "machines" as const,
    shiftFilter,
    currentSlot: slotContext(current),
    viewSlot: slotContext(activeSlot),
    process: { id: process.id, name: process.name },
    counts: {
      total: cards.length,
      completed: cards.filter((c) => c.status === "COMPLETED").length,
      pending: cards.filter((c) => c.status === "PENDING").length,
      overdue: cards.filter((c) => c.status === "OVERDUE").length,
    },
    machines: cards,
  };
}

export function buildProcessesResponse(
  processes: ProcessWithMachines[],
  entries: Parameters<typeof aggregateForProcess>[0],
  statusFor: (processName: string, machineId: string) => SlotStatus,
  { current, activeSlot, shiftFilter, now }: SlotCtx,
) {
  const processCards = processes.map((p) => {
    const active = p.machines.filter((l) => l.machine.isActive);
    const statuses = active.map((l) => statusFor(p.name, l.machineId));
    const completed = statuses.filter((s) => s === "COMPLETED").length;
    const overdue = statuses.filter((s) => s === "OVERDUE").length;
    const pending = statuses.filter((s) => s === "PENDING").length;

    const status: SlotStatus =
      active.length > 0 && completed === active.length
        ? "COMPLETED"
        : overdue > 0
          ? "OVERDUE"
          : "PENDING";

    return {
      id: p.id,
      name: p.name,
      machineCount: active.length,
      completed,
      pending,
      overdue,
      status,
    };
  });

  const allStatuses = processes.flatMap((p) => {
    const byMachine = aggregateForProcess(entries, p.name);
    return p.machines
      .filter((l) => l.machine.isActive)
      .map((l) =>
        resolveSlotStatus({
          submitted: byMachine.has(l.machineId),
          deadlineIso: activeSlot.deadlineIso,
          now,
        }),
      );
  });

  return {
    ok: true,
    level: "processes" as const,
    shiftFilter,
    currentSlot: slotContext(current),
    viewSlot: slotContext(activeSlot),
    counts: {
      total: allStatuses.length,
      completed: allStatuses.filter((s) => s === "COMPLETED").length,
      pending: allStatuses.filter((s) => s === "PENDING").length,
      overdue: allStatuses.filter((s) => s === "OVERDUE").length,
    },
    processes: processCards,
  };
}