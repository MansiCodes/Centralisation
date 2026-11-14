import { EntryEditDrawer } from "@/components/pnl/EntryEditDrawer";
import {
  electricityUnitsKwh,
} from "@/lib/electricity-readings";
import { buildExpenseEditFields } from "./edit";
import { saveExpenseEdit } from "./expense-edit-save";

type CrudLike = {
  editing: unknown;
  values: Record<string, string>;
  saving: boolean;
  error: string | null;
  photoUrls: string[];
  setField: (name: string, value: string) => void;
  patchValues: (next: Record<string, string>) => void;
  setPhotoUrls: (urls: string[]) => void;
  closeEdit: () => void;
  save: (payload: Record<string, unknown>) => void;
};

export function ExpenseEditDrawer({
  crud,
  plantId,
  editingElectricity,
  isPettyCategory,
  fields,
}: {
  crud: CrudLike;
  plantId: string;
  editingElectricity: boolean;
  isPettyCategory: boolean;
  fields: ReturnType<typeof buildExpenseEditFields>;
}) {
  return (
    <EntryEditDrawer
      open={Boolean(crud.editing)}
      title={editingElectricity ? "Edit electricity" : "Edit expense"}
      fields={fields}
      values={crud.values}
      saving={crud.saving}
      error={crud.error}
      onChange={(name, value) => {
        if (
          editingElectricity &&
          (name === "openingReading" ||
            name === "closingReading" ||
            name === "rate")
        ) {
          const next = { ...crud.values, [name]: value };
          const units = electricityUnitsKwh(
            next.openingReading,
            next.closingReading,
          );
          const rate = Number(next.rate) || 0;
          const amount =
            units != null && rate > 0
              ? String(Math.round(units * rate * 100) / 100)
              : next.amount;
          crud.patchValues({
            [name]: value,
            amount,
          });
          return;
        }
        crud.setField(name, value);
      }}
      onClose={crud.closeEdit}
      upload={{
        urls: crud.photoUrls,
        onChange: crud.setPhotoUrls,
        label: "Upload bill/document (optional)",
      }}
      onSave={() => saveExpenseEdit(crud, plantId, isPettyCategory)}
    />
  );
}