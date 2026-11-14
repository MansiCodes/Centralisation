"use client";

import { useTranslations } from "next-intl";
import { logoutAction } from "@/app/actions/auth";
import { IconLogout } from "@/components/icons/AppIcons";

export function LogoutButton() {
  const t = useTranslations("common");
  return (
    <form action={logoutAction} className="dash-header__logout-form">
      <button
        type="submit"
        className="dash-header__logout"
        title={t("logout")}
        aria-label={t("logout")}
      >
        <span className="dash-header__logout-icon">
          <IconLogout size={16} />
        </span>
        <span className="dash-header__logout-text">{t("logout")}</span>
      </button>
    </form>
  );
}
