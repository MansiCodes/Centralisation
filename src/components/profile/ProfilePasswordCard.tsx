"use client";

import type { useProfileState } from "./useProfileState";

type ProfilePasswordCardProps = {
  p: ReturnType<typeof useProfileState>;
};

export function ProfilePasswordCard({ p }: ProfilePasswordCardProps) {
  return (
    <form className="pnl-profile-card" onSubmit={p.onSavePassword}>
      <h3 className="pnl-profile-card__title">Change Password</h3>

      <label className="pnl-field">
        <span>Current Password</span>
        <input
          type="password"
          value={p.currentPwd}
          onChange={(e) => p.setCurrentPwd(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <label className="pnl-field">
        <span>New Password</span>
        <input
          type="password"
          value={p.newPwd}
          onChange={(e) => p.setNewPwd(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>

      <label className="pnl-field">
        <span>Confirm New Password</span>
        <input
          type="password"
          value={p.confirmPwd}
          onChange={(e) => p.setConfirmPwd(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>

      {p.pwdMsg ? (
        <div className={`pnl-msg ${p.pwdMsg.isError ? "pnl-msg--error" : "pnl-msg--success"}`}>
          {p.pwdMsg.text}
        </div>
      ) : null}

      <button type="submit" className="pnl-save-btn" disabled={p.savingPwd}>
        {p.savingPwd ? "Updating…" : "Change Password"}
      </button>
    </form>
  );
}
