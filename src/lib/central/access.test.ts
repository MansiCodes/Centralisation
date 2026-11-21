import assert from "node:assert/strict";
import { accessCount, resolveCentralAccess } from "./access";

/** Match EC2 / Workspace portal lists (P&L side has no Mongo adminType). */
function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

withEnv(
  {
    CENTRAL_BOTH_EMAILS:
      "mansi@gmail.com,gauravjain@gmail.com,gauravjain@atlantatelecables.com,dual@centralisatian.local",
    PRIMARY_SUPER_ADMIN_EMAIL: "gauravjain@gmail.com",
    CENTRAL_WORKSPACE_EMAILS: "wsonly@centralisatian.local",
    CENTRAL_PNL_EMAILS: "pnlonly@centralisatian.local",
    CENTRAL_PNL_DEFAULT: "false",
  },
  () => {
    // Dual / both via email list (P&L does not use Mongo SUPER_ADMIN)
    const dual = resolveCentralAccess({
      email: "dual@centralisatian.local",
      globalRole: "SUPER_ADMIN",
    });
    assert.deepEqual(dual, { pnl: true, workspace: true });
    assert.equal(accessCount(dual), 2);

    assert.deepEqual(
      resolveCentralAccess({ email: "mansi@gmail.com", globalRole: "SUPER_ADMIN" }),
      { pnl: true, workspace: true },
    );
    assert.deepEqual(
      resolveCentralAccess({ email: "gauravjain@gmail.com", globalRole: "SUPER_ADMIN" }),
      { pnl: true, workspace: true },
    );

    // App-only SUPER_ADMIN (Tarun) → default P&L only when not listed (default false → neither unless listed)
    // With CENTRAL_PNL_DEFAULT=false, unlisted → no apps from P&L resolver
    const tarun = resolveCentralAccess({
      email: "tarun@gmail.com",
      globalRole: "SUPER_ADMIN",
    });
    assert.deepEqual(tarun, { pnl: false, workspace: false });
    assert.equal(accessCount(tarun), 0);

    // Explicit P&L-only list
    assert.deepEqual(
      resolveCentralAccess({ email: "pnlonly@centralisatian.local" }),
      { pnl: true, workspace: false },
    );

    // Explicit Workspace-only list (P&L side still resolves lists)
    assert.deepEqual(
      resolveCentralAccess({ email: "wsonly@centralisatian.local" }),
      { pnl: false, workspace: true },
    );
  },
);

// When CENTRAL_PNL_DEFAULT=true (legacy): unlisted → P&L only
withEnv(
  {
    CENTRAL_BOTH_EMAILS: "gauravjain@atlantatelecables.com",
    PRIMARY_SUPER_ADMIN_EMAIL: "gauravjain@gmail.com",
    CENTRAL_PNL_DEFAULT: "true",
    CENTRAL_PNL_EMAILS: undefined,
    CENTRAL_WORKSPACE_EMAILS: undefined,
  },
  () => {
    const tarun = resolveCentralAccess({
      email: "tarun@gmail.com",
      globalRole: "SUPER_ADMIN",
    });
    assert.deepEqual(tarun, { pnl: true, workspace: false });
    assert.equal(accessCount(tarun), 1);

    assert.deepEqual(
      resolveCentralAccess({ email: "gauravjain@gmail.com", globalRole: "SUPER_ADMIN" }),
      { pnl: true, workspace: true },
    );
    assert.deepEqual(
      resolveCentralAccess({
        email: "gauravjain@atlantatelecables.com",
        globalRole: "SUPER_ADMIN",
      }),
      { pnl: true, workspace: true },
    );
  },
);

console.log("access.test.ts ok");
