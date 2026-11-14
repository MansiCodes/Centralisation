export type CentralAppId = "pnl" | "workspace";

export type CentralAccess = {
  pnl: boolean;
  workspace: boolean;
};

function parseEmailList(raw: string | undefined): Set<string> {
  return new Set(
    String(raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Centralisation portal grants (which apps open after login) — separate from in-app roles.
 *
 * - Portal admin (both apps + /apps chooser): PRIMARY_SUPER_ADMIN_EMAIL and/or CENTRAL_BOTH_EMAILS
 * - App-only SUPER_ADMIN: role inside one app only — does NOT unlock the other app
 *
 * Lists: CENTRAL_BOTH_EMAILS | CENTRAL_PNL_EMAILS | CENTRAL_WORKSPACE_EMAILS
 * Default: CENTRAL_PNL_DEFAULT (P&L only when not listed).
 */
export function resolveCentralAccess(input: {
  email: string | null | undefined;
  globalRole?: string | null;
}): CentralAccess {
  const email = String(input.email || "").toLowerCase().trim();
  const both = parseEmailList(process.env.CENTRAL_BOTH_EMAILS);
  const primary = String(process.env.PRIMARY_SUPER_ADMIN_EMAIL || "")
    .toLowerCase()
    .trim();
  const pnlList = parseEmailList(process.env.CENTRAL_PNL_EMAILS);
  const wsList = parseEmailList(process.env.CENTRAL_WORKSPACE_EMAILS);

  // Gaurav Jain (PRIMARY) + any CENTRAL_BOTH_EMAILS → chooser dashboard for both apps
  if (email && (both.has(email) || (primary && email === primary))) {
    return { pnl: true, workspace: true };
  }

  const listedPnl = Boolean(email && pnlList.has(email));
  const listedWs = Boolean(email && wsList.has(email));

  if (listedPnl || listedWs) {
    return { pnl: listedPnl, workspace: listedWs };
  }

  const defaultPnl = process.env.CENTRAL_PNL_DEFAULT !== "false";
  return { pnl: defaultPnl, workspace: false };
}

export function accessCount(a: CentralAccess): number {
  return Number(a.pnl) + Number(a.workspace);
}
