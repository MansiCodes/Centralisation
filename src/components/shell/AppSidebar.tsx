"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppHeaderUser } from "./AppHeader";
import type { NavSection } from "./nav-config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PlantSwitcher, type PlantSwitcherPlant } from "./PlantSwitcher";
import { SidebarNav } from "./app-sidebar-nav";
import { SidebarUserMenu } from "./SidebarUserMenu";

type AppSidebarProps = {
  navSections: NavSection[];
  plants?: PlantSwitcherPlant[];
  currentPlantId?: string | null;
  allowAllPlants?: boolean;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: AppHeaderUser | null;
};

export function AppSidebar({
  navSections,
  plants = [],
  currentPlantId = null,
  allowAllPlants = false,
  collapsed,
  mobileOpen,
  onCloseMobile,
  user,
}: AppSidebarProps) {
  const pathname = usePathname();
  const tCommon = useTranslations("common");

  return (
    <>
      <aside
        className={`dash-sidebar${collapsed ? " dash-sidebar--collapsed" : ""}`}
        aria-label="Sidebar"
      >
        <SidebarNav
          navSections={navSections}
          pathname={pathname}
          showLabels={!collapsed}
        />
        <PlantSwitcher
          plants={plants}
          currentPlantId={currentPlantId}
          allowAllPlants={allowAllPlants}
          showLabels={!collapsed}
        />
        {user ? <SidebarUserMenu user={user} showLabels={!collapsed} /> : null}
      </aside>

      {mobileOpen ? (
        <div
          className="dash-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            className="dash-mobile-nav__backdrop"
            aria-label="Close navigation"
            onClick={onCloseMobile}
          />
          <div className="dash-mobile-nav__panel">
            <SidebarNav
              navSections={navSections}
              pathname={pathname}
              showLabels
              onNavigate={onCloseMobile}
            />
            <PlantSwitcher
              plants={plants}
              currentPlantId={currentPlantId}
              allowAllPlants={allowAllPlants}
              showLabels
              onNavigate={onCloseMobile}
            />
            <div className="dash-mobile-nav__lang">
              <span className="dash-mobile-nav__lang-label">
                {tCommon("language")}
              </span>
              <LanguageSwitcher compact />
            </div>
            {user ? <SidebarUserMenu user={user} showLabels onNavigate={onCloseMobile} /> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}