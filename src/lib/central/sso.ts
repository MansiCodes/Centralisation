import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { CentralAppId } from "./access";

export type SsoClaims = {
  v: 1;
  jti: string;
  email: string;
  name?: string | null;
  app: CentralAppId;
  exp: number;
};

/** jti → { claims, until } — brief replay for Auth.js double authorize. */
const used = new Map<string, { claims: SsoClaims; until: number }>();

function secret(): string {
  const s = process.env.SSO_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("SSO_SECRET (or AUTH_SECRET) is required for SSO");
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

function pruneUsed() {
  const now = Date.now();
  for (const [k, entry] of used) {
    if (entry.until < now) used.delete(k);
  }
}

export function mintSsoCode(input: {
  email: string;
  name?: string | null;
  app: CentralAppId;
  ttlSeconds?: number;
}): string {
  pruneUsed();
  const claims: SsoClaims = {
    v: 1,
    jti: randomBytes(16).toString("hex"),
    email: input.email.toLowerCase().trim(),
    name: input.name ?? null,
    app: input.app,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 5 * 60),
  };
  const payloadB64 = b64url(JSON.stringify(claims));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function consumeSsoCode(
  code: string,
  expectApp?: CentralAppId,
): SsoClaims | null {
  pruneUsed();
  const parts = code.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let claims: SsoClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (claims.v !== 1 || !claims.jti || !claims.email || !claims.app) return null;
  if (claims.exp < Math.floor(Date.now() / 1000)) return null;
  if (expectApp && claims.app !== expectApp) return null;

  const prior = used.get(claims.jti);
  if (prior) {
    // shortcut: Auth.js may call authorize twice; allow same claims for 45s
    return prior.until > Date.now() ? prior.claims : null;
  }

  used.set(claims.jti, { claims, until: Date.now() + 45_000 });
  return claims;
}

export function pnlPublicUrl(): string {
  return (process.env.PNL_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function workspacePublicUrl(): string {
  return (process.env.WORKSPACE_PUBLIC_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function workspaceApiUrl(): string {
  return (process.env.WORKSPACE_API_URL || "http://localhost:5000").replace(/\/$/, "");
}
