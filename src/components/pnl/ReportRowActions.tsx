"use client";

import { IconDelete, IconEdit } from "@/components/icons/AppIcons";

export function ReportRowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="pnl-row-actions">
      <button
        type="button"
        className="pnl-row-actions__edit"
        onClick={onEdit}
        disabled={disabled}
        title="Edit"
      >
        <IconEdit size={16} />
      </button>
      <button
        type="button"
        className="pnl-row-actions__delete"
        onClick={onDelete}
        disabled={disabled}
        title="Delete"
      >
        <IconDelete size={16} />
      </button>
    </div>
  );
}
