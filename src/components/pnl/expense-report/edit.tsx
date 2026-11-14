export { ExpenseEditDrawer } from "./expense-edit-drawer";

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

export function buildExpenseEditFields(opts: {
  cat6: boolean;
  editingElectricity: boolean;
  isPettyCategory: boolean;
  isQuad?: boolean;
  t: (key: string) => string;
}) {
  const { cat6, editingElectricity, isPettyCategory, isQuad, t } = opts;
  const base: Array<{
    name: string;
    label: string;
    type?: "text" | "number" | "date" | "month" | "textarea";
    required?: boolean;
    readOnly?: boolean;
  }> = [];

  if (editingElectricity) {
    return [
      {
        name: "expenseHead",
        label: t("category"),
        required: true,
        readOnly: true,
      },
      {
        name: "month",
        label: "Month",
        type: "month" as const,
        required: true,
      },
      {
        name: "openingReading",
        label: "Opening reading",
        type: "number" as const,
      },
      {
        name: "closingReading",
        label: "Closing reading",
        type: "number" as const,
      },
      {
        name: "rate",
        label: "Rate (₹/unit)",
        type: "number" as const,
      },
      {
        name: "amount",
        label: "Electricity bill Amt",
        type: "number" as const,
        readOnly: true,
      },
      {
        name: "description",
        label: t("remarksNotes"),
        type: "textarea" as const,
      },
    ];
  }

  base.push(
    {
      name: "date",
      label: cat6 ? "Months" : t("date"),
      type: "date",
      required: true,
    },
    { name: "expenseHead", label: t("category"), required: true },
    ...(isQuad
      ? [{ name: "expenseName", label: "Expense name" }]
      : []),
    {
      name: "description",
      label: cat6 ? "Remarks" : t("remarksNotes"),
      type: "textarea",
    },
  );

  if (isPettyCategory) {
    base.push(
      { name: "payMode", label: "Pay Mode" },
      { name: "nature", label: "Nature" },
      { name: "location", label: "Location" },
      { name: "billNumber", label: "Bill Number" },
      {
        name: "contractorSalary",
        label: "Contractor Salary",
        type: "number",
      },
      {
        name: "supervisorSalary",
        label: "Supervisor Salary",
        type: "number",
      },
      {
        name: "amount",
        label: "Petty Cash Amount",
        type: "number",
        required: true,
      },
    );
  } else {
    base.push({
      name: "amount",
      label: cat6 ? "Salary Amt" : t("amount"),
      type: "number",
      required: true,
    });
    if (!cat6) {
      base.push(
        { name: "payMode", label: "Pay Mode" },
        { name: "nature", label: "Nature" },
        { name: "location", label: "Location" },
        { name: "billNumber", label: "Bill Number" },
      );
    }
  }

  return base;
}
