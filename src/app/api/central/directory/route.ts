import { NextResponse } from "next/server";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

/** Portal directory moved to Installation_backend. */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "Use Installation portal directory",
      portalUrl: `${portalPublicUrl()}/apps`,
    },
    { status: 410 },
  );
}
