import { GlobalRole, type User } from "@prisma/client";
import { prisma } from "@/lib/db";

const SUPER_ADMINS = new Set([
  "dual@centralisatian.local",
  "pnlonly@centralisatian.local",
  "superadmin@centralisatian.local",
  "tarun@gmail.com",
  "ridh.jain.rj@gmail.com",
  "gauravjain@gmail.com",
  "gauravjain@atlantatelecables.com",
  "mansi@gmail.com",
]);

async function promoteIfSuperAdmin(id: string) {
  return prisma.user.update({
    where: { id },
    data: {
      globalRole: GlobalRole.SUPER_ADMIN,
      canViewPriceSheet: true,
      canManageUsers: true,
      canAccessStock: true,
      canAdminMachineProduction: true,
      canMachineSupervise: true,
      isActive: true,
    },
  });
}

async function handleExistingSsoUser(
  existing: User,
  normalized: string,
  name?: string | null,
) {
  if (SUPER_ADMINS.has(normalized) && existing.globalRole !== GlobalRole.SUPER_ADMIN) {
    return promoteIfSuperAdmin(existing.id);
  }
  if (existing.isActive) return existing;
  return prisma.user.update({
    where: { id: existing.id },
    data: { isActive: true, name: name?.trim() || existing.name },
  });
}

/** Ensure a P&L user row exists when portal SSO arrives from Installation. */
export async function ensureSsoPnlUser(email: string, name?: string | null) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findFirst({
    where: { email: normalized },
  });
  if (existing) {
    return handleExistingSsoUser(existing, normalized, name);
  }
  const role = SUPER_ADMINS.has(normalized) ? GlobalRole.SUPER_ADMIN : GlobalRole.VIEWER;
  return prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0] || "User",
      globalRole: role,
      isActive: true,
      creditScore: 100,
    },
  });
}
