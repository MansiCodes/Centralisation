"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProductionEntryFields, type ProductionCoilItem } from "@/components/machine-production/ProductionEntryFields";
import { useProductionCableCatalog } from "@/components/machine-production/useProductionCableCatalog";
import { SlideOver } from "@/components/ui/SlideOver";
import { todayLocalISO } from "@/lib/client-forms";
import { submitProductionEntry } from "@/components/machine-production/production-entry-submit";
import type {
  MachineCard,
  SlotInfo,
} from "@/components/machine-production/production-entry-types";

export type { MachineCard, SlotInfo } from "@/components/machine-production/production-entry-types";

type Props = {
  open: boolean;
  machine: MachineCard | null;
  viewSlot: SlotInfo | null;
  processName: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ProductionEntryForm({
  open,
  machine,
  viewSlot,
  processName,
  onClose,
  onSaved,
}: Props) {
  const catalog = useProductionCableCatalog(open, machine, processName, viewSlot);
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [operators, setOperators] = useState("1");
  const [helpers, setHelpers] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [coils, setCoils] = useState<ProductionCoilItem[]>([
    { invoice: "", weight: "" },
  ]);
  const [operatorName, setOperatorName] = useState("");
  const [entryDate, setEntryDate] = useState("");

  useEffect(() => {
    if (!open || !machine?.id || !processName) return;
    setPlanned("");
    setActual("");
    setOperators("1");
    setHelpers("0");
    setRemarks("");
    setCoils([{ invoice: "", weight: "" }]);
    setOperatorName("");
    setEntryDate(viewSlot?.entryDate ? viewSlot.entryDate.split("T")[0] : todayLocalISO());
    setPhotoUrls([]);
  }, [open, machine?.id, processName, viewSlot]);

  const plannedNum = Number(planned) || 0;
  const actualNum = Number(actual) || 0;
  const ops = Math.max(0, Math.floor(Number(operators) || 0));
  const helps = Math.max(0, Math.floor(Number(helpers) || 0));
  const totalManpower = ops + helps;
  const efficiency =
    plannedNum > 0 ? Math.round((actualNum / plannedNum) * 10000) / 100 : 0;
  const filledCoils = coils.filter(
    (c) => c.invoice.trim() !== "" || c.weight.trim() !== "",
  );
  const totalCoils = filledCoils.length;
  const hasAnyWeight = coils.some((c) => c.weight.trim() !== "");
  const totalWeight = hasAnyWeight
    ? Math.round(
        coils.reduce((sum, c) => {
          const w = parseFloat(c.weight);
          return sum + (Number.isFinite(w) && w >= 0 ? w : 0);
        }, 0) * 10000,
      ) / 10000
    : null;

  const dateTimeLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }, [open]);

  const hasPriorEntries = (machine?.entryCount ?? 0) > 0;
  // Always allow another entry for the same slot, even after COMPLETED.
  const readOnly = false;
  const busy = readOnly || saving || catalog.catalogBusy;

  function onSubmit(e: FormEvent) {
    if (!machine || !viewSlot) return;
    void submitProductionEntry(e, {
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
      totalWeight: totalWeight ?? 0,
      entryDate,
      setSaving,
      onSaved,
      onClose,
    });
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={
        machine
          ? `${machine.name}${viewSlot ? ` · ${viewSlot.slotLabel}` : ""}`
          : "Production entry"
      }
    >
      {machine && viewSlot ? (
        <form className="mp-form" onSubmit={(e) => void onSubmit(e)}>
          <ProductionEntryFields
            machine={machine}
            processName={processName}
            catalog={catalog}
            onClose={onClose}
            fields={{
              planned,
              setPlanned,
              actual,
              setActual,
              coils,
              setCoils,
              totalCoils,
              totalWeight,
              operatorName,
              setOperatorName,
              operators,
              setOperators,
              helpers,
              setHelpers,
              remarks,
              setRemarks,
              photoUrls,
              setPhotoUrls,
              entryDate,
              setEntryDate,
              efficiency,
              totalManpower,
              hasPriorEntries,
              busy,
              saving,
              readOnly,
            }}
          />
        </form>
      ) : null}
    </SlideOver>
  );
}
