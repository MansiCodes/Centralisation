import { NextResponse } from "next/server";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

/** Portal open-app mint moved to Installation_backend. */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Use Installation portal to open apps",
      portalUrl: `${portalPublicUrl()}/apps`,
    },
    { status: 410 },
  );
}
