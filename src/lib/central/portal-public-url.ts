/** Installation portal (login + /apps) public origin. */
export function portalPublicUrl(): string {
  return (
    process.env.PORTAL_PUBLIC_URL ||
    process.env.WORKSPACE_PUBLIC_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}
