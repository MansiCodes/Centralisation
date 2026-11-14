"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  IconCalendar,
  IconMenu,
  IconPlus,
  IconSidebar,
} from "@/components/icons/AppIcons";
import { LogoutButton } from "@/components/LogoutButton";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { todayLocalISO } from "@/lib/client-forms";
import {
  requestOpenTodayEntry,
  storeEntryDate,
} from "@/lib/today-entry";
import { localeToBcp47, type AppLocale } from "@/i18n/config";
import { findActiveNavItem, type NavSection } from "./nav-config";

function MenuIcon({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return <IconSidebar size={22} />;
  return <IconMenu size={22} />;
}

function CalendarIcon() {
  return <IconCalendar size={16} />;
}

function PlusIcon() {
  return <IconPlus size={16} />;
}

function formatHeaderDate(iso: string, withYear: boolean, locale: AppLocale): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(localeToBcp47(locale), {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" as const } : {}),
  });
}

export type AppHeaderUser = {
  name: string | null;
  email: string;
  role: string;
  canAccessStock?: boolean;
};

type AppHeaderProps = {
  navSections: NavSection[];
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  canEnter?: boolean;
  showAppsHome?: boolean;
};

export function AppHeader({
  navSections,
  sidebarCollapsed,
  onMenuClick,
  canEnter = false,
  showAppsHome = false,
}: AppHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const activeItem = findActiveNavItem(pathname, navSections);
  const homeHref =
    navSections
      .flatMap((s) => s.items)
      .find((item) => item.key === "dashboard")?.href ?? "/";
  const today = useMemo(() => todayLocalISO(), []);
  const dateLabel = useMemo(
    () => formatHeaderDate(today, true, locale),
    [today, locale],
  );
  const dateShort = useMemo(
    () => formatHeaderDate(today, false, locale),
    [today, locale],
  );

  const contextLabel = (() => {
    if (!activeItem) return null;
    switch (activeItem.key) {
      case "dashboard":
        return tNav("dashboard");
      case "approvals":
        return "Approvals";
      case "stock":
        return tNav("stock");
      case "pnl":
        return tNav("pnl");
      case "price-sheet":
        return tNav("priceSheet");
      case "machine-production":
        return tNav("machineProduction");
      case "machine-production-admin":
        return tNav("mpAdmin");
      case "users":
        return tNav("users");
      case "integrations":
        return tNav("integrations");
      case "audit":
        return tNav("audit");
      default:
        return activeItem.label;
    }
  })();

  function onAddTodayEntry() {
    storeEntryDate(today);
    requestOpenTodayEntry();
  }

  return (
    <header className="dash-header">
      <button
        type="button"
        className="dash-header__hamburger"
        onClick={onMenuClick}
        aria-label={
          sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
        }
        aria-pressed={sidebarCollapsed}
      >
        <MenuIcon collapsed={sidebarCollapsed} />
      </button>

      <Link href={homeHref} className="dash-header__brand">
        <span>{t("brandCable")}</span>
        <span>{t("brandJunction")}</span>
      </Link>

      {contextLabel ? (
        <span className="dash-header__context">{contextLabel}</span>
      ) : null}

      <div className="dash-header__spacer" />

      {canEnter ? (
        <div className="dash-header__actions">
          <button
            type="button"
            className="dash-header__add-entry"
            onClick={onAddTodayEntry}
          >
            <PlusIcon />
            <span>{t("todaysEntry")}</span>
          </button>

          <time className="dash-header__date" dateTime={today}>
            <CalendarIcon />
            <span className="dash-header__date-label">
              <span className="dash-header__date-full">{dateLabel}</span>
              <span className="dash-header__date-short">{dateShort}</span>
            </span>
          </time>
        </div>
      ) : null}

      {showAppsHome ? (
        <Link
          href="/apps"
          className="dash-header__logout dash-header__apps"
          title="All apps"
          style={{ textDecoration: "none" }}
        >
          Apps
        </Link>
      ) : null}
      <LanguageSwitcher compact />
      <LogoutButton />
    </header>
  );
}
