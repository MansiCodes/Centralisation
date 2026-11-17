import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Ensure a P&L user row exists when portal SSO arrives from Installation. */
export async function ensureSsoPnlUser(email: string, name?: string | null) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findFirst({
    where: { email: normalized },
  });
  if (existing) {
    if (existing.isActive) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        name: name?.trim() || existing.name,
      },
    });
  }
  return prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0] || "User",
      globalRole: GlobalRole.VIEWER,
      isActive: true,
      creditScore: 100,
    },
  });
}
