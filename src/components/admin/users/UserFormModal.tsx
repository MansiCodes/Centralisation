"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { IconUserEdit, IconUserPlus } from "@/components/icons/AppIcons";
import { Button } from "@/components/ui/Button";
import { UserFormModalFields } from "./UserFormModalFields";
import type { UserFormModalProps } from "./user-form-modal-model";
import { useUserFormModal } from "./useUserFormModal";

export function UserFormModal({
  open,
  editing,
  saving,
  error,
  allowSuperAdmin,
  plants,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const titleId = useId();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const form = useUserFormModal({
    open,
    editing,
    saving,
    allowSuperAdmin,
    plants,
    onClose,
    onSubmit,
  });

  if (!form.mounted) return null;

  return (
    <div
      className={`users-modal ${form.visible ? "is-open" : ""}`}
      role="presentation"
    >
      <div
        className="users-modal__backdrop"
        onClick={() => {
          if (!saving) onClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={form.panelRef}
        className="users-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="users-modal__header">
          <h2 id={titleId} className="users-sr-only">
            {form.editingId ? t("editUser") : t("createUser")}
          </h2>
          <div className="users-modal__hero-icon" aria-hidden="true">
            {form.editingId ? (
              <IconUserEdit size={28} />
            ) : (
              <IconUserPlus size={28} />
            )}
          </div>
          <button
            type="button"
            className="users-modal__close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <form
          id="user-form"
          className="users-modal__body"
          onSubmit={form.handleSubmit}
        >
          {error ? <div className="alert alert--error">{error}</div> : null}

          <UserFormModalFields
            firstFieldRef={form.firstFieldRef}
            saving={saving}
            email={form.email}
            setEmail={form.setEmail}
            name={form.name}
            setName={form.setName}
            phone={form.phone}
            setPhone={form.setPhone}
            password={form.password}
            setPassword={form.setPassword}
            showPassword={form.showPassword}
            setShowPassword={form.setShowPassword}
            editingId={form.editingId}
            globalRole={form.globalRole}
            setGlobalRole={form.setGlobalRole}
            roleChoices={form.roleChoices}
            showPlantPicker={form.flags.showPlantPicker}
            requiresPlants={form.flags.requiresPlants}
            activePlants={form.activePlants}
            selectedPlantIds={form.selectedPlantIds}
            plantError={form.plantError}
            extraAccessOptions={form.extraAccessOptions}
            extraAccessValue={form.extraAccessValue}
            extraAccessFieldClassName={`field${form.flags.requiresPlants ? " users-modal__span-2" : ""}`}
            onPlantIdsChange={form.onPlantIdsChange}
            onExtraAccessChange={form.onExtraAccessChange}
          />
        </form>

        <div className="users-modal__footer">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={saving}
            style={{ flex: "none" }}
          >
            {saving
              ? tCommon("saving")
              : form.editingId
                ? t("saveChanges")
                : t("createUser")}
          </Button>
        </div>
      </div>
    </div>
  );
}
