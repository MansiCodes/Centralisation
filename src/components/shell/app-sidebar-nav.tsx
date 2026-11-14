"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { IconNav } from "@/components/icons/AppIcons";
import type { NavIconName, NavSection } from "./nav-config";
import { findActiveNavItem } from "./nav-config";

function navSectionTitle(
  t: ReturnType<typeof useTranslations<"nav">>,
  key: string,
) {
  if (key === "work" || key === "reports" || key === "admin") {
    return t(key);
  }
  return key;
}

function navItemLabel(
  t: ReturnType<typeof useTranslations<"nav">>,
  key: string,
) {
  switch (key) {
    case "dashboard":
      return t("dashboard");
    case "approvals":
      return "Approvals";
    case "stock":
      return t("stock");
    case "pnl":
      return t("pnl");
    case "price-sheet":
      return t("priceSheet");
    case "machine-production":
      return t("machineProduction");
    case "machine-production-admin":
      return t("mpAdmin");
    case "users":
      return t("users");
    case "integrations":
      return t("integrations");
    case "audit":
      return t("audit");
    default:
      return key;
  }
}

function NavIcon({ name }: { name: NavIconName }) {
  return <IconNav name={name} size={20} />;
}

export function SidebarNav({
  navSections,
  pathname,
  showLabels,
  onNavigate,
}: {
  navSections: NavSection[];
  pathname: string;
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  const tNav = useTranslations("nav");
  const activeItem = findActiveNavItem(pathname, navSections);

  return (
    <nav className="dash-sidebar__nav" aria-label="Main">
      {navSections.map((section) => (
        <div className="dash-sidebar__section" key={section.key}>
          {showLabels ? (
            <div className="dash-sidebar__section-title">
              {navSectionTitle(tNav, section.key)}
            </div>
          ) : null}
          {section.items.map((item) => {
            const label = navItemLabel(tNav, item.key);
            const active = activeItem?.key === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="dash-sidebar__link"
                title={showLabels ? undefined : label}
              >
                <span className="dash-sidebar__icon">
                  <NavIcon name={item.icon} />
                </span>
                <span className="dash-sidebar__label">{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}