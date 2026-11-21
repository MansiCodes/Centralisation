"use client";

import { useProfileState } from "./useProfileState";
import { ProfileInfoCard } from "./ProfileInfoCard";
import { ProfilePasswordCard } from "./ProfilePasswordCard";
import "./profile.css";

export function ProfileClient() {
  const p = useProfileState();

  if (p.loading) {
    return (
      <div className="pnl-profile-page">
        <p style={{ color: "var(--fg-muted)" }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="pnl-profile-page">
      <div className="pnl-profile-header">
        <h1 className="pnl-profile-header__title">My Profile</h1>
        <p className="pnl-profile-header__subtitle">
          Manage your personal information and password
        </p>
      </div>

      <div className="pnl-profile-grid">
        <ProfileInfoCard p={p} />
        <ProfilePasswordCard p={p} />
      </div>
    </div>
  );
}
