import type { Dispatch, SetStateAction } from "react";
import type { CentralDirectoryUser } from "@/lib/central/directory-types";
import { CENTRAL_PAGE_SIZE } from "./apps-launcher-types";

type CentralUsersDirectoryProps = {
  users: CentralDirectoryUser[];
  usersLoading: boolean;
  usersError: string | null;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageUsers: CentralDirectoryUser[];
  pageCount: number;
  pageButtons: number[];
};

export function CentralUsersDirectory({
  users,
  usersLoading,
  usersError,
  page,
  setPage,
  pageUsers,
  pageCount,
  pageButtons,
}: CentralUsersDirectoryProps) {
  return (
    <div className="central-users-panel">
      <p className="central-home__eyebrow">Directory</p>
      <h2 className="central-users__title">All users</h2>
      <p className="central-users__lead">
        Combined view across P&amp;L and Workspace. Each app still manages its own users
        inside.
      </p>

      {usersLoading ? (
        <p className="central-users__lead">Loading users…</p>
      ) : usersError ? (
        <p className="central-alert" role="alert">
          {usersError}
        </p>
      ) : users.length === 0 ? (
        <p className="central-users__lead">No users found.</p>
      ) : (
        <>
          <section className="central-section">
            <h3>
              Showing {(page - 1) * CENTRAL_PAGE_SIZE + 1}–
              {Math.min(page * CENTRAL_PAGE_SIZE, users.length)} of {users.length}
            </h3>
            <div className="central-table">
              {pageUsers.map((u) => (
                <div key={`${u.app}-${u.id}`} className="central-row" title={u.email}>
                  <div style={{ minWidth: 0 }}>
                    <div className="central-row__name">{u.name || u.email}</div>
                    <div className="central-row__meta">
                      {u.email}
                      {u.role ? ` · ${u.role}` : ""}
                      {!u.active ? " · inactive" : ""}
                    </div>
                  </div>
                  <span className={`central-badge${u.app === "workspace" ? " central-badge--ws" : ""}`}>
                    {u.app === "pnl" ? "P&L" : "Workspace"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="central-pager">
            <div className="central-pager__info">
              Page {page} of {pageCount}
            </div>
            <div className="central-pager__btns">
              <button
                type="button"
                className="central-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {pageButtons.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`central-page-btn${n === page ? " is-current" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="central-page-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}