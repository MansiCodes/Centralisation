"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  IconDownload,
  IconFilter,
  IconPlus,
  IconSearch,
} from "@/components/icons/AppIcons";
import { ROLE_LABEL, ROLES } from "./types";

type UsersToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onAddUser: () => void;
  onExport: () => void;
  readOnly?: boolean;
};

function PlusIcon() {
  return <IconPlus size={18} />;
}

function FilterIcon() {
  return <IconFilter size={18} />;
}

function ExportIcon() {
  return <IconDownload size={18} />;
}

export function UsersToolbar({
  query,
  onQueryChange,
  roleFilter,
  onRoleFilterChange,
  onAddUser,
  onExport,
  readOnly = false,
}: UsersToolbarProps) {
  const t = useTranslations("admin");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function onDoc(e: MouseEvent) {
      if (!filterRef.current?.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterOpen]);

  return (
    <div className="users-toolbar">
      <label className="users-toolbar__search">
        <span className="users-sr-only">Search users</span>
        <span className="users-toolbar__search-icon" aria-hidden>
          <IconSearch size={16} />
        </span>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </label>

      <div className="users-toolbar__spacer" aria-hidden />

      <div className="users-toolbar__actions">
        {!readOnly ? (
          <button
            type="button"
            className="users-icon-btn users-icon-btn--primary"
            onClick={onAddUser}
            title={t("addUser")}
            aria-label={t("addUser")}
          >
            <PlusIcon />
          </button>
        ) : null}

        <div className="users-filter" ref={filterRef}>
          <button
            type="button"
            className={`users-icon-btn ${roleFilter !== "ALL" ? "is-active" : ""}`}
            onClick={() => setFilterOpen((v) => !v)}
            title="Filter by role"
            aria-label="Filter by role"
            aria-expanded={filterOpen}
          >
            <FilterIcon />
          </button>
          {filterOpen ? (
            <div className="users-filter__menu" role="listbox" aria-label="Role filter">
              <button
                type="button"
                className={roleFilter === "ALL" ? "is-selected" : ""}
                onClick={() => {
                  onRoleFilterChange("ALL");
                  setFilterOpen(false);
                }}
              >
                All roles
              </button>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={roleFilter === r ? "is-selected" : ""}
                  onClick={() => {
                    onRoleFilterChange(r);
                    setFilterOpen(false);
                  }}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="users-icon-btn"
          onClick={onExport}
          title="Export users"
          aria-label="Export users"
        >
          <ExportIcon />
        </button>
      </div>
    </div>
  );
}
