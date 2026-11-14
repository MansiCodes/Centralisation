"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatINR } from "@/lib/format/inr";
import { ReportTable } from "@/components/pnl/ReportTable";
import { Pagination } from "@/components/ui/Pagination";
import { usePaginatedReport } from "@/components/pnl/usePaginatedReport";
import type { PvcExpenseSection } from "@/lib/plant-catalogs";
import { ReportRowActions } from "@/components/pnl/ReportRowActions";
import { EntryEditDrawer, toYmd } from "@/components/pnl/EntryEditDrawer";
import { DeleteConfirmDialog } from "@/components/pnl/DeleteConfirmDialog";
import { collectBillPhotoUrls } from "@/lib/bill-photos";
import { toast } from "sonner";
import { deletePvcExpenseRow, patchPvcExpenseRow } from "./pvc-expense-register-api";
import { usePvcExpenseRegisterColumns } from "./pvc-expense-register-columns";
import {
  PvcExpenseCategoryNav,
  headsForSection,
} from "./PvcExpenseCategoryNav";
import { getRowEntityInfo, type PvcExpenseRow } from "./pvc-expense-register-types";

export function PvcExpenseRegisterReport({
  plantId,
  from,
  to,
  canMutate = true,
}: {
  plantId: string;
  from: string;
  to: string;
  canMutate?: boolean;
}) {
  const t = useTranslations("pnl");
  const [section, setSection] = useState<PvcExpenseSection>("direct");
  const sectionHeads = useMemo(() => headsForSection(section), [section]);
  const [category, setCategory] = useState<string>(
    sectionHeads[0] ?? "Fuel & Power",
  );

  const baseUrl = `/api/plants/${plantId}/pvc-expense-register?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&category=${encodeURIComponent(category)}`;

  const { rows, page, pageSize, total, loading, error, response, reload, setPage, setPageSize } =
    usePaginatedReport<PvcExpenseRow>(baseUrl, t("networkError"), 20);

  const totals = response?.totals as { amount?: number } | undefined;

  const [editingRow, setEditingRow] = useState<PvcExpenseRow | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [pendingDeleteRow, setPendingDeleteRow] = useState<PvcExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDeleteRow || deleting) return;
    if (!getRowEntityInfo(pendingDeleteRow)) return;

    setDeleting(true);
    const result = await deletePvcExpenseRow(plantId, pendingDeleteRow);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Entry deleted");
    setPendingDeleteRow(null);
    reload();
  }

  async function saveEdit() {
    if (!editingRow || saving) return;
    if (!getRowEntityInfo(editingRow)) return;

    setSaving(true);
    setEditError(null);
    const result = await patchPvcExpenseRow(plantId, editingRow, editValues, photoUrls);
    setSaving(false);
    if (!result.ok) {
      setEditError(result.error ?? "Save failed");
      return;
    }
    toast.success("Entry updated");
    setEditingRow(null);
    reload();
  }

  const columns = usePvcExpenseRegisterColumns(page, pageSize);

  function onSectionChange(next: PvcExpenseSection) {
    setSection(next);
    const heads = headsForSection(next);
    setCategory(heads[0] ?? "");
    setPage(1);
  }

  return (
    <section className="pnl-report-panel pnl-report-panel--expense">
      <h3 className="pnl-report-panel__title">{t("expenseTitle")}</h3>

      <PvcExpenseCategoryNav
        section={section}
        category={category}
        sectionHeads={sectionHeads}
        onSectionChange={onSectionChange}
        onCategoryChange={(head) => {
          setCategory(head);
          setPage(1);
        }}
      />

      {error ? <div className="alert alert--error">{error}</div> : null}
      <ReportTable
        columns={
          canMutate
            ? [
                ...columns,
                {
                  key: "actions",
                  label: "Actions",
                  compact: true,
                  render: (r) => {
                    const info = getRowEntityInfo(r);
                    if (!info) return "—";
                    return (
                      <ReportRowActions
                        onEdit={() => {
                          setEditingRow(r);
                          setEditValues({
                            date: toYmd(r.sortDate),
                            expenseHead: r.expenseLabel,
                            description: r.description ?? "",
                            amount: String(r.amount ?? ""),
                          });
                          setPhotoUrls(collectBillPhotoUrls(r));
                          setEditError(null);
                        }}
                        onDelete={() => setPendingDeleteRow(r)}
                      />
                    );
                  },
                },
              ]
            : columns
        }
        rows={rows}
        loading={loading}
        emptyLabel={t("noRecords")}
        variant="register"
        footer={
          totals && rows.length > 0
            ? { pnl: "TOTAL", amount: formatINR(totals.amount ?? 0) }
            : undefined
        }
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      <EntryEditDrawer
        open={Boolean(editingRow)}
        title={`Edit ${editingRow?.expenseLabel ?? "expense"}`}
        fields={[
          { name: "date", label: t("date"), type: "date", required: true },
          { name: "expenseHead", label: t("category"), required: true },
          { name: "description", label: t("remarksNotes"), type: "textarea" },
          { name: "amount", label: t("amount"), type: "number", required: true },
        ]}
        values={editValues}
        saving={saving}
        error={editError}
        onChange={(name, val) =>
          setEditValues((prev) => ({ ...prev, [name]: val }))
        }
        onClose={() => setEditingRow(null)}
        upload={{
          urls: photoUrls,
          onChange: setPhotoUrls,
          label: "Upload bill/document (optional)",
        }}
        onSave={() => void saveEdit()}
      />
      <DeleteConfirmDialog
        open={Boolean(pendingDeleteRow)}
        deleting={deleting}
        onNo={() => setPendingDeleteRow(null)}
        onYes={() => void confirmDelete()}
        title={`Delete ${pendingDeleteRow?.expenseLabel ?? "entry"}?`}
        message={`Are you sure you want to delete this ${pendingDeleteRow?.expenseLabel ?? "expense"} record (${pendingDeleteRow?.description ?? ""})? This cannot be undone.`}
      />
    </section>
  );
}