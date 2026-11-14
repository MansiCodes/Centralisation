"use client";

import { LivePhotoUpload } from "@/components/machine-production/LivePhotoUpload";
import type { ProductionCableCatalog } from "@/components/machine-production/useProductionCableCatalog";
import type { MachineCard } from "@/components/machine-production/production-entry-types";
import { Button } from "@/components/ui/Button";
import { DecimalInput } from "@/components/ui/DecimalInput";
import { todayLocalISO } from "@/lib/client-forms";
import { ProductionEntryCableFields } from "./ProductionEntryCableFields";
import { ProductionEntryCoilFields } from "./ProductionEntryCoilFields";
import type {
  ProductionCoilItem,
  ProductionEntryFieldState,
} from "./production-entry-field-types";

export type { ProductionCoilItem, ProductionEntryFieldState };

type Props = {
  machine: MachineCard;
  processName: string | null;
  catalog: ProductionCableCatalog;
  fields: ProductionEntryFieldState;
  onClose: () => void;
};

export function ProductionEntryFields({
  machine,
  processName,
  catalog,
  fields: f,
  onClose,
}: Props) {
  return (
    <>
      {f.hasPriorEntries ? (
        <p className="mp-form__banner mp-form__banner--ok">
          {machine.entryCount} entr
          {machine.entryCount === 1 ? "y" : "ies"} already saved for this slot —
          submit to add another.
        </p>
      ) : null}

      <div className="mp-form__row">
        <label className="mp-field">
          <span>Machine</span>
          <input value={`${machine.name} (${machine.code})`} readOnly />
        </label>
        <label className="mp-field">
          <span>Current process</span>
          <input value={processName ?? "—"} readOnly />
        </label>
      </div>

      <ProductionEntryCableFields catalog={catalog} fields={f} />

      <div className="mp-form__row">
        <label className="mp-field">
          <span>Planned production</span>
          <DecimalInput value={f.planned} onChange={f.setPlanned} disabled={f.busy} />
        </label>
        <label className="mp-field">
          <span>Actual production</span>
          <DecimalInput value={f.actual} onChange={f.setActual} disabled={f.busy} />
        </label>
      </div>

      <ProductionEntryCoilFields fields={f} />

      <div className="mp-form__row">
        <label className="mp-field">
          <span>Operator name</span>
          <input
            type="text"
            value={f.operatorName}
            onChange={(e) => f.setOperatorName(e.target.value)}
            disabled={f.busy}
            placeholder="Enter operator name"
            required
          />
        </label>
        <label className="mp-field">
          <span>Efficiency %</span>
          <input value={f.efficiency.toFixed(2)} readOnly />
        </label>
      </div>

      <div className="mp-form__row">
        <label className="mp-field">
          <span>Operators</span>
          <input
            type="number"
            min={0}
            step={1}
            value={f.operators}
            onChange={(e) => f.setOperators(e.target.value)}
            disabled={f.busy}
          />
        </label>
        <label className="mp-field">
          <span>Helpers</span>
          <input
            type="number"
            min={0}
            step={1}
            value={f.helpers}
            onChange={(e) => f.setHelpers(e.target.value)}
            disabled={f.busy}
          />
        </label>
      </div>

      <div className="mp-form__row">
        <label className="mp-field">
          <span>Total manpower</span>
          <input value={String(f.totalManpower)} readOnly />
        </label>
        <label className="mp-field">
          <span>Date</span>
          <input
            type="date"
            required
            max={todayLocalISO()}
            value={f.entryDate}
            onChange={(e) => f.setEntryDate(e.target.value)}
            disabled={f.busy}
          />
        </label>
      </div>

      <label className="mp-field">
        <span>Remarks</span>
        <textarea
          rows={3}
          value={f.remarks}
          onChange={(e) => f.setRemarks(e.target.value)}
          disabled={f.busy}
        />
      </label>

      {!f.readOnly ? <LivePhotoUpload urls={f.photoUrls} onChange={f.setPhotoUrls} /> : null}

      {!f.readOnly ? (
        <div className="mp-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={f.busy}>
            {f.saving ? "Saving…" : "Submit"}
          </Button>
        </div>
      ) : null}
    </>
  );
}