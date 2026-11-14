import { NextRequest, NextResponse } from "next/server";
import {
  requireMachineProductionAccess,
  requireSession,
} from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  resolveCurrentSlot,
  resolveSlotStatus,
  type SlotStatus,
} from "@/lib/machine-production/slots";
import {
  aggregateForProcess,
  parseShiftFilter,
  slotContext,
  viewSlotForFilter,
} from "./dashboard-slot";
import { buildMachinesResponse, buildProcessesResponse } from "./dashboard-response";

/**
 * Two-level board. Without `processId` it returns one card per process with
 * that process's progress for the active slot; with `processId` it returns the
 * machine cards belonging to that process.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if ("error" in session) return session.error;

    const denied = requireMachineProductionAccess(session.user);
    if (denied) return denied;

    const shiftFilter = parseShiftFilter(
      request.nextUrl.searchParams.get("shift"),
    );
    const processId = request.nextUrl.searchParams.get("processId")?.trim() || null;
    const now = new Date();
    const current = resolveCurrentSlot(now);
    const activeSlot = viewSlotForFilter(shiftFilter, current);

    const slotWhere = {
      entryDate: new Date(`${activeSlot.entryDate}T00:00:00.000Z`),
      shift: activeSlot.shift,
      slotStartHour: activeSlot.slotStartHour,
    };

    const processes = await prisma.productionProcess.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        machines: {
          orderBy: [{ sortOrder: "asc" }],
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const machineIds = [
      ...new Set(
        processes.flatMap((p) =>
          p.machines.filter((l) => l.machine.isActive).map((l) => l.machineId),
        ),
      ),
    ];

    const entries = await prisma.machineProductionEntry.findMany({
      where: { ...slotWhere, machineId: { in: machineIds } },
      select: {
        id: true,
        machineId: true,
        submittedAt: true,
        actualProduction: true,
        efficiencyPct: true,
        currentProcess: true,
      },
      orderBy: { submittedAt: "desc" },
    });

  const slotCtx = { current, activeSlot, shiftFilter, now };

    if (processId) {
      const process = processes.find((p) => p.id === processId);
      if (!process) {
        return NextResponse.json(
          { error: "Process not found or inactive" },
          { status: 404 },
        );
      }
      const byMachine = aggregateForProcess(entries, process.name);
      return NextResponse.json(
        buildMachinesResponse(process, byMachine, slotCtx),
      );
    }

    const statusFor = (
      processName: string,
      machineId: string,
    ): SlotStatus => {
      const byMachine = aggregateForProcess(entries, processName);
      return resolveSlotStatus({
        submitted: byMachine.has(machineId),
        deadlineIso: activeSlot.deadlineIso,
        now,
      });
    };

    return NextResponse.json(
      buildProcessesResponse(processes, entries, statusFor, slotCtx),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load machine production dashboard";
    console.error("Machine production dashboard GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}