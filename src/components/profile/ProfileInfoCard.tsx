"use client";

import type { useProfileState } from "./useProfileState";

type ProfileInfoCardProps = {
  p: ReturnType<typeof useProfileState>;
};

export function ProfileInfoCard({ p }: ProfileInfoCardProps) {
  const canRemove = Boolean(p.preview);

  return (
    <form className="pnl-profile-card" onSubmit={p.onSaveInfo}>
      <h3 className="pnl-profile-card__title">Profile Information</h3>
      <div className="pnl-avatar-edit">
        <button
          type="button"
          className="pnl-avatar-edit__preview"
          onClick={() => p.fileRef.current?.click()}
          aria-label="Change photo"
        >
          {p.preview ? <img src={p.preview} alt="Avatar" /> : <span>{p.initial}</span>}
        </button>
        <div className="pnl-avatar-edit__actions">
          <button
            type="button"
            className="pnl-btn-secondary"
            onClick={() => p.fileRef.current?.click()}
          >
            Change Photo
          </button>
          <button
            type="button"
            className="pnl-btn-secondary pnl-btn-danger"
            onClick={p.onRemovePhoto}
            disabled={!canRemove}
          >
            Remove Photo
          </button>
          <input
            ref={p.fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={p.onPickFile}
          />
        </div>
      </div>

      <label className="pnl-field">
        <span>Full Name</span>
        <input
          type="text"
          value={p.name}
          onChange={(e) => p.setName(e.target.value)}
          required
          maxLength={120}
        />
      </label>

      <label className="pnl-field">
        <span>Mobile Number</span>
        <input
          type="text"
          value={p.phone}
          onChange={(e) => p.setPhone(e.target.value)}
          maxLength={20}
          placeholder="e.g. 9876543210"
        />
      </label>

      <label className="pnl-field">
        <span>Email</span>
        <input type="email" value={p.email} disabled readOnly />
      </label>

      {p.infoMsg ? (
        <div className={`pnl-msg ${p.infoMsg.isError ? "pnl-msg--error" : "pnl-msg--success"}`}>
          {p.infoMsg.text}
        </div>
      ) : null}

      <button type="submit" className="pnl-save-btn" disabled={p.savingInfo}>
        {p.savingInfo ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
