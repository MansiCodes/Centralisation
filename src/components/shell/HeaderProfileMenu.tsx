"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { logoutAction } from "@/app/actions/auth";
import { IconLogout, IconUser } from "@/components/icons/AppIcons";
import { formatRole, initialsFor } from "./app-sidebar-icons";
import type { AppHeaderUser } from "./AppHeader";

type HeaderProfileMenuProps = {
  user: AppHeaderUser;
};

export function HeaderProfileMenu({ user }: HeaderProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const initials = initialsFor(user.name, user.email);

  return (
    <div className="dash-profile-menu" ref={rootRef}>
      <button
        type="button"
        className="dash-header__profile-btn dash-profile-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={user.name || user.email}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || "User avatar"}
            className="dash-header__avatar-img"
          />
        ) : (
          <span className="dash-header__avatar-text">{initials}</span>
        )}
      </button>

      {open ? (
        <div className="dash-profile-menu__dropdown" role="menu">
          <div className="dash-profile-menu__user-info">
            <div className="dash-profile-menu__user-avatar">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="dash-header__avatar-img"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="dash-profile-menu__user-details">
              <span className="dash-profile-menu__user-name">
                {user.name || user.email.split("@")[0]}
              </span>
              <span className="dash-profile-menu__user-email" title={user.email}>
                {user.email}
              </span>
              <span className="dash-profile-menu__user-role">
                {formatRole(user.role)}
              </span>
            </div>
          </div>

          <div className="dash-profile-menu__divider" />

          <Link
            href="/profile"
            className="dash-profile-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="dash-profile-menu__item-icon">
              <IconUser size={16} />
            </span>
            <span>Profile</span>
          </Link>

          <form action={logoutAction} className="dash-profile-menu__logout-form">
            <button
              type="submit"
              className="dash-profile-menu__item dash-profile-menu__item--danger"
              role="menuitem"
            >
              <span className="dash-profile-menu__item-icon">
                <IconLogout size={16} />
              </span>
              <span>{t("logout")}</span>
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
