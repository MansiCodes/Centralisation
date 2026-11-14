"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CentralAccess } from "@/lib/central/access";
import type { CentralDirectoryUser } from "@/lib/central/directory-types";
import "./central.css";
import type { CentralAppId, MainView } from "./launcher/apps-launcher-types";
import { CentralHomePanel } from "./launcher/CentralHomePanel";
import { CentralNavbar } from "./launcher/CentralNavbar";
import { CentralProfilePanel } from "./launcher/CentralProfilePanel";
import { CentralSidebar } from "./launcher/CentralSidebar";
import { CentralUsersDirectory } from "./launcher/CentralUsersDirectory";
import { openCentralApp } from "./launcher/open-central-app";
import { useCentralBootstrap } from "./launcher/use-central-bootstrap";
import { useUserPagination } from "./launcher/use-user-pagination";

export function AppsLauncher({
  email,
  name,
  access,
}: {
  email: string;
  name: string | null;
  access: CentralAccess;
}) {
  const [view, setView] = useState<MainView>("home");
  const [busy, setBusy] = useState<CentralAppId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<CentralDirectoryUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [displayName, setDisplayName] = useState(name || "");
  const [editName, setEditName] = useState(name || "");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (displayName || email).trim().charAt(0).toUpperCase() || "U";
  const shownAvatar = avatarDraft === "" ? null : avatarDraft || avatarUrl;

  useCentralBootstrap(
    name,
    setUsers,
    setUsersError,
    setUsersLoading,
    setDisplayName,
    setAvatarUrl,
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 800px)");
    function onViewport() {
      if (!mq.matches) setNavOpen(false);
    }
    onViewport();
    mq.addEventListener("change", onViewport);
    return () => mq.removeEventListener("change", onViewport);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [view]);

  function setViewAndClose(next: MainView) {
    setView(next);
    setNavOpen(false);
  }

  async function handleOpenApp(app: CentralAppId) {
    setError(null);
    setBusy(app);
    const result = await openCentralApp(app);
    if (!result.ok) {
      setError(result.message);
      setBusy(null);
      return;
    }
    window.location.href = result.url;
  }

  const { pageCount, pageUsers, pageButtons } = useUserPagination(users, page);

  const onEditProfile = useCallback(() => {
    setMenuOpen(false);
    setEditName(displayName || "");
    setEditPassword("");
    setEditConfirmPassword("");
    setAvatarDraft(null);
    setProfileMsg(null);
    setView("profile");
  }, [displayName]);

  let mainContent;
  if (view === "home") {
    mainContent = (
      <CentralHomePanel
        access={access}
        busy={busy}
        onOpenApp={handleOpenApp}
      />
    );
  } else if (view === "profile") {
    mainContent = (
      <CentralProfilePanel
        email={email}
        initials={initials}
        shownAvatar={shownAvatar}
        editName={editName}
        setEditName={setEditName}
        editPassword={editPassword}
        setEditPassword={setEditPassword}
        editConfirmPassword={editConfirmPassword}
        setEditConfirmPassword={setEditConfirmPassword}
        avatarDraft={avatarDraft}
        setAvatarDraft={setAvatarDraft}
        profileMsg={profileMsg}
        setProfileMsg={setProfileMsg}
        profileSaving={profileSaving}
        setProfileSaving={setProfileSaving}
        setDisplayName={setDisplayName}
        setAvatarUrl={setAvatarUrl}
        fileRef={fileRef}
      />
    );
  } else {
    mainContent = (
      <CentralUsersDirectory
        users={users}
        usersLoading={usersLoading}
        usersError={usersError}
        page={page}
        setPage={setPage}
        pageUsers={pageUsers}
        pageCount={pageCount}
        pageButtons={pageButtons}
      />
    );
  }

  return (
    <div className="central-shell">
      <CentralNavbar
        menuRef={menuRef}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        displayName={displayName}
        email={email}
        shownAvatar={shownAvatar}
        initials={initials}
        onEditProfile={onEditProfile}
        onGoHome={() => setViewAndClose("home")}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((o) => !o)}
      />

      <div className={`central-body${navOpen ? " is-nav-open" : ""}`}>
        {navOpen ? (
          <button
            type="button"
            className="central-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <CentralSidebar
          view={view}
          setView={setViewAndClose}
          access={access}
          busy={busy}
          onOpenApp={handleOpenApp}
          usersLoading={usersLoading}
          userCount={users.length}
        />

        <main className="central-main">
          {error ? (
            <p className="central-alert" role="alert">
              {error}
            </p>
          ) : null}
          {mainContent}
        </main>
      </div>
    </div>
  );
}