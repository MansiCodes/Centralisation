import type { RefObject } from "react";
import { logoutAction } from "@/app/actions/auth";
import { IconLogout, IconMenu, IconUserEdit } from "@/components/icons/AppIcons";

type CentralNavbarProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((o: boolean) => boolean)) => void;
  displayName: string;
  email: string;
  shownAvatar: string | null;
  initials: string;
  onEditProfile: () => void;
  onGoHome: () => void;
  navOpen?: boolean;
  onToggleNav?: () => void;
};

export function CentralNavbar({
  menuRef,
  menuOpen,
  setMenuOpen,
  displayName,
  email,
  shownAvatar,
  initials,
  onEditProfile,
  onGoHome,
  navOpen = false,
  onToggleNav,
}: CentralNavbarProps) {
  return (
    <header className="central-navbar">
      {onToggleNav ? (
        <button
          type="button"
          className="central-navbar__menu"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          onClick={onToggleNav}
        >
          <IconMenu size={20} />
        </button>
      ) : null}
      <button type="button" className="central-navbar__brand" onClick={onGoHome}>
        <span>Valuecon</span>
      </button>
      <div className="central-navbar__spacer" />
      <div className="central-navbar__user" ref={menuRef}>
        <button
          type="button"
          className="central-avatar"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          title={displayName || email}
        >
          {shownAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownAvatar} alt="" className="central-avatar__img" />
          ) : (
            initials
          )}
        </button>
        {menuOpen ? (
          <div className="central-menu" role="menu">
            <div className="central-menu__meta">
              <strong>{displayName || "Account"}</strong>
              <span>{email}</span>
            </div>
            <button type="button" role="menuitem" onClick={onEditProfile}>
              <IconUserEdit size={14} />
              Edit profile
            </button>
            <form action={logoutAction}>
              <button type="submit" role="menuitem">
                <IconLogout size={14} />
                Logout
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
