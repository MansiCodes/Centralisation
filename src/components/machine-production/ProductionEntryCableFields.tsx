"use client";

import type { ProductionCableCatalog } from "@/components/machine-production/useProductionCableCatalog";
import {
  OTHERS,
  SIZE_PLACEHOLDER,
  TYPE_PLACEHOLDER,
} from "@/components/machine-production/production-entry-types";
import { Button } from "@/components/ui/Button";
import { SelectMenu } from "@/components/ui/SelectMenu";
import type { ProductionEntryFieldState } from "./production-entry-field-types";

type Props = {
  catalog: ProductionCableCatalog;
  fields: Pick<ProductionEntryFieldState, "busy">;
};

export function ProductionEntryCableFields({ catalog: c, fields: f }: Props) {
  return (
    <div className="mp-form__row mp-form__row--top">
      <div className="mp-field">
        <span>Cable type</span>
        <SelectMenu
          value={c.cableType}
          options={c.typeOptions}
          placeholder={TYPE_PLACEHOLDER}
          onChange={(v) => {
            c.setCableType(v);
            c.setCableSize(SIZE_PLACEHOLDER);
            c.setOtherCableType("");
            c.setOtherCableSize("");
          }}
          disabled={f.busy || c.cableTypes.length === 0}
        />
        {c.cableType === OTHERS ? (
          <div className="mp-field__extra-row">
            <input
              className="mp-field__extra"
              value={c.otherCableType}
              onChange={(e) => c.setOtherCableType(e.target.value)}
              placeholder="Enter other cable type"
              disabled={f.busy}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={f.busy || !c.otherCableType.trim()}
              onClick={() => void c.addOtherType()}
            >
              Add to list
            </Button>
          </div>
        ) : null}
        {c.canRemoveType ? (
          <button
            type="button"
            className="mp-field__remove"
            disabled={f.busy}
            onClick={() => void c.removeSelectedType()}
          >
            Remove from this machine
          </button>
        ) : null}
      </div>

      <div className="mp-field">
        <span>Cable size</span>
        <SelectMenu
          value={c.cableSize}
          options={c.sizeOptions}
          placeholder={SIZE_PLACEHOLDER}
          onChange={(v) => {
            c.setCableSize(v);
            c.setOtherCableSize("");
          }}
          disabled={
            f.busy ||
            c.cableType === TYPE_PLACEHOLDER ||
            (c.cableType !== OTHERS && c.cableSizes.length === 0)
          }
        />
        {c.cableSize === OTHERS ? (
          <div className="mp-field__extra-row">
            <input
              className="mp-field__extra"
              value={c.otherCableSize}
              onChange={(e) => c.setOtherCableSize(e.target.value)}
              placeholder="Enter other cable size"
              disabled={f.busy}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={f.busy || !c.otherCableSize.trim()}
              onClick={() => void c.addOtherSize()}
            >
              Add to list
            </Button>
          </div>
        ) : null}
        {c.canRemoveSize ? (
          <button
            type="button"
            className="mp-field__remove"
            disabled={f.busy}
            onClick={() => void c.removeSelectedSize()}
          >
            Remove from this machine
          </button>
        ) : null}
      </div>
    </div>
  );
}