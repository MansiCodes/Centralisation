import type { CentralAppId } from "./apps-launcher-types";

export async function openCentralApp(
  app: CentralAppId,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/central/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app }),
    });
    const data = (await res.json()) as { ok?: boolean; url?: string; message?: string };
    if (!res.ok || !data.ok || !data.url) {
      return { ok: false, message: data.message || "Could not open application" };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, message: "Could not open application" };
  }
}