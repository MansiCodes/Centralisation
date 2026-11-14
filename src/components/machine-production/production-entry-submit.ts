import type { FormEvent } from "react";
import { toast } from "sonner";
import { postJson } from "@/lib/client-forms";
import type { ProductionCoilItem } from "@/components/machine-production/ProductionEntryFields";
import type { MachineCard, SlotInfo } from "@/components/machine-production/production-entry-types";
import {
  OTHERS,
  SIZE_PLACEHOLDER,
  TYPE_PLACEHOLDER,
} from "@/components/machine-production/production-entry-types";

type Catalog = {
  cableType: string;
  cableSize: string;
  otherCableType: string;
  otherCableSize: string;
  cableTypes: string[];
  cableSizes: string[];
};

export async function submitProductionEntry(
  e: FormEvent,
  params: {
    machine: MachineCard;
    viewSlot: SlotInfo;
    processName: string | null;
    readOnly: boolean;
    catalog: Catalog;
    planned: string;
    actual: string;
    filledCoils: ProductionCoilItem[];
    operatorName: string;
    ops: number;
    helps: number;
    remarks: string;
    photoUrls: string[];
    totalWeight: number;
    entryDate: string;
    setSaving: (v: boolean) => void;
    onSaved: () => void;
    onClose: () => void;
  },
) {
  e.preventDefault();
  const {
    machine,
    viewSlot,
    processName,
    readOnly,
    catalog,
    planned,
    actual,
    filledCoils,
    operatorName,
    ops,
    helps,
    remarks,
    photoUrls,
    totalWeight,
    entryDate,
    setSaving,
    onSaved,
    onClose,
  } = params;
  if (!machine || !viewSlot || readOnly) return;
  if (!processName) {
    toast.error("Open a process first, then pick a machine inside it");
    return;
  }

  let finalType = catalog.cableType;
  let finalSize = catalog.cableSize;

  if (!catalog.cableType || catalog.cableType === TYPE_PLACEHOLDER) {
    toast.error("Select a cable type");
    return;
  }
  if (catalog.cableType === OTHERS) {
    finalType = catalog.otherCableType.trim();
    if (!finalType) {
      toast.error("Enter the other cable type");
      return;
    }
  } else if (!catalog.cableTypes.includes(catalog.cableType)) {
    toast.error("Select a cable type");
    return;
  }

  if (!catalog.cableSize || catalog.cableSize === SIZE_PLACEHOLDER) {
    toast.error("Select a cable size");
    return;
  }
  if (catalog.cableSize === OTHERS) {
    finalSize = catalog.otherCableSize.trim();
    if (!finalSize) {
      toast.error("Enter the other cable size");
      return;
    }
  } else if (catalog.cableType === OTHERS) {
    finalSize =
      catalog.cableSize === OTHERS
        ? catalog.otherCableSize.trim()
        : catalog.cableSize;
    if (!finalSize) {
      toast.error("Select or enter a cable size");
      return;
    }
  } else if (!catalog.cableSizes.includes(catalog.cableSize)) {
    toast.error("Select a cable size");
    return;
  }

  const plannedNum = Number(planned) || 0;
  const actualNum = Number(actual) || 0;
  if (plannedNum < 0 || actualNum < 0) {
    toast.error("Production values must be zero or more");
    return;
  }
  if (!operatorName.trim()) {
    toast.error("Enter operator name");
    return;
  }

  const coilDescriptions = filledCoils
    .map((c, i) => {
      const inv = c.invoice.trim();
      const wt = c.weight.trim();
      if (inv && wt) return `${inv} (${wt} kg)`;
      if (inv) return inv;
      return wt ? `Coil ${i + 1} (${wt} kg)` : "";
    })
    .filter(Boolean);

  setSaving(true);
  const res = await postJson<{ ok: boolean; error?: string }>(
    "/api/machine-production/entries",
    {
      machineId: machine.id,
      entryDate,
      shift: viewSlot.shift,
      slotStartHour: viewSlot.slotStartHour,
      currentProcess: processName,
      cableType: finalType,
      cableSize: finalSize,
      plannedProduction: plannedNum,
      actualProduction: actualNum,
      operators: ops,
      helpers: helps,
      operatorName: operatorName.trim(),
      remarks: remarks.trim() || null,
      coilNo: coilDescriptions.join(", ") || null,
      weight: totalWeight,
      photoUrls,
    },
  );
  setSaving(false);

  if (!res.ok) {
    toast.error(res.error);
    return;
  }
  toast.success("Production entry saved");
  onSaved();
  onClose();
}