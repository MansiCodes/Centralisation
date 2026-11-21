import { redirect } from "next/navigation";
import { portalPublicUrl } from "@/lib/central/portal-public-url";

/** App chooser moved to Installation_frontend — keep route for bookmarks. */
export default function AppsPage() {
  redirect(`${portalPublicUrl()}/apps`);
}
