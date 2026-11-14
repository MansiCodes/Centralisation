import assert from "node:assert/strict";
import { accessCount, resolveCentralAccess } from "./access";

process.env.CENTRAL_BOTH_EMAILS = "gauravjain@atlantatelecables.com";
process.env.PRIMARY_SUPER_ADMIN_EMAIL = "gauravjain@gmail.com";
process.env.CENTRAL_PNL_DEFAULT = "true";
delete process.env.CENTRAL_PNL_EMAILS;
delete process.env.CENTRAL_WORKSPACE_EMAILS;

// App-only SUPER_ADMIN (Tarun) → P&L only
const tarun = resolveCentralAccess({
  email: "tarun@gmail.com",
  globalRole: "SUPER_ADMIN",
});
assert.deepEqual(tarun, { pnl: true, workspace: false });
assert.equal(accessCount(tarun), 1);

// Portal admin via PRIMARY_SUPER_ADMIN_EMAIL
const gauravGmail = resolveCentralAccess({
  email: "gauravjain@gmail.com",
  globalRole: "SUPER_ADMIN",
});
assert.deepEqual(gauravGmail, { pnl: true, workspace: true });
assert.equal(accessCount(gauravGmail), 2);

// Portal admin via CENTRAL_BOTH_EMAILS
const gauravWork = resolveCentralAccess({
  email: "gauravjain@atlantatelecables.com",
  globalRole: "SUPER_ADMIN",
});
assert.deepEqual(gauravWork, { pnl: true, workspace: true });

console.log("access.test.ts ok");
