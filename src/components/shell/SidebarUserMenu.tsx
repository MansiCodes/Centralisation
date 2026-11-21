"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { logoutAction } from "@/app/actions/auth";
import { IconLogout, IconUser } from "@/components/icons/AppIcons";
import { formatRole, initialsFor } from "./app-sidebar-icons";
import type { AppHeaderUser } from "./AppHeader";

type SidebarUserMenuProps = {
  user: AppHeaderUser;
  showLabels: boolean;
  onNavigate?: () => void;
};

export function SidebarUserMenu({
  user,
  showLabels,
  onNavigate,
}: SidebarUserMenuProps) {
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
    <div className="dash-sidebar-user-wrap" ref={rootRef}>
      {open ? (
        <div className="dash-sidebar-user-menu" role="menu">
          <div className="dash-sidebar-user-menu__info">
            <span className="dash-sidebar-user-menu__name">
              {user.name || user.email.split("@")[0]}
            </span>
            <span className="dash-sidebar-user-menu__email" title={user.email}>
              {user.email}
            </span>
            <span className="dash-sidebar-user-menu__role">
              {formatRole(user.role)}
            </span>
          </div>

          <div className="dash-sidebar-user-menu__divider" />

          <Link
            href="/profile"
            className="dash-sidebar-user-menu__item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            <IconUser size={16} />
            <span>Profile</span>
          </Link>

          <form action={logoutAction} className="dash-sidebar-user-menu__form">
            <button
              type="submit"
              className="dash-sidebar-user-menu__item dash-sidebar-user-menu__item--danger"
              role="menuitem"
            >
              <IconLogout size={16} />
              <span>{t("logout")}</span>
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className={`dash-sidebar__user dash-sidebar__user-btn${open ? " is-active" : ""}`}
        title={`Account: ${user.email}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dash-header__avatar" aria-hidden="true">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="dash-header__avatar-img"
            />
          ) : (
            initials
          )}
        </span>
        {showLabels ? (
          <>
            <div className="dash-sidebar__user-meta">
              <span className="dash-header__user-name">
                {formatRole(user.role)}
              </span>
              <span className="dash-sidebar__user-email" title={user.email}>
                {user.email}
              </span>
            </div>
            <span className="dash-sidebar__user-chevron" aria-hidden="true">
              {open ? "▾" : "▴"}
            </span>
          </>
        ) : null}
      </button>
    </div>
  );
}
