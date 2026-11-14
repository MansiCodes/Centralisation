"use client";

export function StockOrdersClearDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="stock-confirm-dialog" role="presentation">
      <button
        type="button"
        className="stock-confirm-dialog__backdrop"
        aria-label="No"
        onClick={onCancel}
      />
      <div
        className="stock-confirm-dialog__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stock-clear-title"
      >
        <h2 id="stock-clear-title" className="stock-confirm-dialog__title">
          Clear uploaded file?
        </h2>
        <p className="stock-confirm-dialog__copy">
          Are you sure you want to clear the uploaded files?
        </p>
        <div className="stock-confirm-dialog__actions">
          <button type="button" className="stock-confirm-dialog__no" onClick={onCancel}>
            No
          </button>
          <button type="button" className="stock-confirm-dialog__yes" onClick={onConfirm}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}