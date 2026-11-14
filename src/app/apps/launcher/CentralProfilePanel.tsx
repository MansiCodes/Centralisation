import type { FormEvent, RefObject } from "react";
import { compressAvatar } from "./compress-avatar";
import { saveCentralProfile } from "./save-central-profile";

type CentralProfilePanelProps = {
  email: string;
  initials: string;
  shownAvatar: string | null;
  editName: string;
  setEditName: (v: string) => void;
  editPassword: string;
  setEditPassword: (v: string) => void;
  editConfirmPassword: string;
  setEditConfirmPassword: (v: string) => void;
  avatarDraft: string | null;
  setAvatarDraft: (v: string | null) => void;
  profileMsg: string | null;
  setProfileMsg: (v: string | null) => void;
  profileSaving: boolean;
  setProfileSaving: (v: boolean) => void;
  setDisplayName: (v: string) => void;
  setAvatarUrl: (v: string | null) => void;
  fileRef: RefObject<HTMLInputElement | null>;
};

async function handleProfileSubmit(
  e: FormEvent,
  props: CentralProfilePanelProps,
) {
  e.preventDefault();
  props.setProfileSaving(true);
  props.setProfileMsg(null);
  const result = await saveCentralProfile({
    editName: props.editName,
    editPassword: props.editPassword,
    editConfirmPassword: props.editConfirmPassword,
    avatarDraft: props.avatarDraft,
  });
  props.setProfileSaving(false);
  if (!result.ok) {
    props.setProfileMsg(result.message);
    return;
  }
  props.setDisplayName(result.name);
  if (result.avatarUrl !== undefined) props.setAvatarUrl(result.avatarUrl);
  props.setAvatarDraft(null);
  props.setEditPassword("");
  props.setEditConfirmPassword("");
  props.setProfileMsg("Saved.");
}

async function handleAvatarFile(
  file: File,
  setProfileMsg: (v: string | null) => void,
  setAvatarDraft: (v: string | null) => void,
) {
  if (file.size > 2_500_000) {
    setProfileMsg("Image must be under 2.5 MB");
    return;
  }
  try {
    const dataUrl = await compressAvatar(file);
    setAvatarDraft(dataUrl);
    setProfileMsg(null);
  } catch {
    setProfileMsg("Could not read image");
  }
}

export function CentralProfilePanel(props: CentralProfilePanelProps) {
  const { email, initials, shownAvatar, fileRef, profileSaving, profileMsg } = props;

  return (
    <div className="central-profile-wrap">
      <div className="central-profile">
        <p className="central-home__eyebrow">Account</p>
        <h2 className="central-users__title">Edit profile</h2>
        <p className="central-users__lead">
          Update your photo, name, or password for Centralisation / P&amp;L.
        </p>
        <form
          className="central-profile__form"
          onSubmit={(e) => void handleProfileSubmit(e, props)}
        >
          <div className="central-avatar-edit">
            <button
              type="button"
              className="central-avatar-edit__preview"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile picture"
            >
              {shownAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownAvatar} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </button>
            <div className="central-avatar-edit__actions">
              <button type="button" className="central-page-btn" onClick={() => fileRef.current?.click()}>
                Upload photo
              </button>
              {shownAvatar ? (
                <button
                  type="button"
                  className="central-page-btn"
                  onClick={() => props.setAvatarDraft("")}
                >
                  Remove
                </button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  await handleAvatarFile(file, props.setProfileMsg, props.setAvatarDraft);
                }}
              />
            </div>
          </div>

          <label className="central-field">
            <span>Email</span>
            <input type="email" value={email} disabled readOnly />
          </label>
          <label className="central-field">
            <span>Name</span>
            <input
              type="text"
              value={props.editName}
              onChange={(e) => props.setEditName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label className="central-field">
            <span>Password</span>
            <input
              type="password"
              value={props.editPassword}
              onChange={(e) => props.setEditPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
          </label>
          <label className="central-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={props.editConfirmPassword}
              onChange={(e) => props.setEditConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat new password"
            />
          </label>
          {profileMsg ? <p className="central-profile__msg">{profileMsg}</p> : null}
          <button type="submit" className="central-save-btn" disabled={profileSaving}>
            {profileSaving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}