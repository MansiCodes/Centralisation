"use client";

import { DecimalInput } from "@/components/ui/DecimalInput";
import type { ProductionEntryFieldState } from "./production-entry-field-types";

type Props = {
  fields: Pick<
    ProductionEntryFieldState,
  "coils" | "setCoils" | "totalCoils" | "totalWeight" | "busy"
  >;
};

export function ProductionEntryCoilFields({ fields: f }: Props) {
  return (
    <div className="mp-field">
      <span className="mp-field__head">
        Coil invoice no. & weight
        <span className="mp-field__head-note">
          Total coils: {f.totalCoils}
          {f.totalWeight != null ? ` · ${f.totalWeight} kg` : ""}
        </span>
        <button
          type="button"
          className="mp-field__add"
          disabled={f.busy}
          onClick={() =>
            f.setCoils((prev) => [...prev, { invoice: "", weight: "" }])
          }
          title="Add coil"
        >
          +
        </button>
      </span>
      <div className="mp-coil-list">
        {f.coils.map((coil, idx) => (
          <div key={`coil-box-${idx}`} className="mp-coil-box">
            <div className="mp-coil-box__head">
              <span className="mp-coil-box__badge">Coil #{idx + 1}</span>
              {f.coils.length > 1 || coil.invoice.trim() || coil.weight.trim() ? (
                <button
                  type="button"
                  className="mp-coil-box__remove"
                  disabled={f.busy}
                  onClick={() =>
                    f.setCoils((prev) => {
                      const next = prev.filter((_, j) => j !== idx);
                      return next.length > 0 ? next : [{ invoice: "", weight: "" }];
                    })
                  }
                  title="Remove coil"
                >
                  ✕
                </button>
              ) : null}
            </div>
            <div className="mp-coil-box__row">
              <label className="mp-field">
                <span className="mp-coil-box__sublabel">Coil invoice no.</span>
                <input
                  type="text"
                  value={coil.invoice}
                  onChange={(e) => {
                    const val = e.target.value;
                    f.setCoils((prev) =>
                      prev.map((c, j) => (j === idx ? { ...c, invoice: val } : c)),
                    );
                  }}
                  disabled={f.busy}
                  placeholder="Enter coil invoice no."
                />
              </label>
              <label className="mp-field">
                <span className="mp-coil-box__sublabel">Weight (kg)</span>
                <DecimalInput
                  value={coil.weight}
                  onChange={(val) => {
                    f.setCoils((prev) =>
                      prev.map((c, j) => (j === idx ? { ...c, weight: val } : c)),
                    );
                  }}
                  disabled={f.busy}
                  placeholder="Enter weight"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}