import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { accessCount, resolveCentralAccess } from "@/lib/central/access";
import { CENTRAL_APP_COOKIE, isPnlChosenToday } from "@/lib/central/app-session";
import { prisma } from "@/lib/db";
import {
  canAccessMachineProduction,
  canAdminMachineProduction,
  canApproveEntries,
  canEnterData,
  canViewPnl,
  canViewPriceSheet,
  canViewUsersDirectory,
  hasGlobalPlantAccess,
  isAccountantPnlLimited,
  isAdminOrHead,
  isMachineSupervisorOnly,
  isPlantManager,
  isSuperAdmin,
} from "@/lib/rbac";
import { resolveSelectedPlantId } from "@/lib/selected-plant";
import { isQuadSignalPlant } from "@/lib/plant-layout";
import { machineSupervisorShell } from "./app-layout-ms-shell";
import {
  getLayoutRepairedPlantIds,
  getLayoutSession,
  getLayoutSwitchablePlants,
} from "./app-layout-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getLayoutSession();
  if (!session?.user) {
    redirect("/login");
  }

  const portalAccess = resolveCentralAccess({
    email: session.user.email,
    globalRole: session.user.globalRole,
  });
  const multiAppPortal = accessCount(portalAccess) > 1;
  if (multiAppPortal) {
    const jar = await cookies();
    if (!isPnlChosenToday(jar.get(CENTRAL_APP_COOKIE)?.value)) {
      redirect("/apps");
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      canAccessStock: true,
      canMachineSupervise: true,
      canAdminMachineProduction: true,
      canViewPriceSheet: true,
      canManageUsers: true,
      globalRole: true,
      name: true,
      email: true,
      isActive: true,
    },
  });
  if (!dbUser || !dbUser.isActive) {
    redirect("/login");
  }
  const user = {
    ...session.user,
    globalRole: dbUser.globalRole,
    canAccessStock: Boolean(dbUser.canAccessStock),
    canMachineSupervise: Boolean(dbUser.canMachineSupervise),
    canAdminMachineProduction: Boolean(dbUser.canAdminMachineProduction),
    canViewPriceSheet: Boolean(dbUser.canViewPriceSheet),
    canManageUsers: Boolean(dbUser.canManageUsers),
    name: dbUser.name ?? session.user.name,
    email: dbUser.email ?? session.user.email,
  };
  const role = user.globalRole;
  const globalPlantAccess = role ? hasGlobalPlantAccess(role) : false;

  const mpOpts = {
    canMachineSupervise: Boolean(user.canMachineSupervise),
    canAdminMachineProduction: Boolean(user.canAdminMachineProduction),
  };
  const mpAdmin = role ? canAdminMachineProduction(role, mpOpts) : false;
  if (role && isMachineSupervisorOnly(role) && !user.canAccessStock) {
    return machineSupervisorShell(children, {
      user: {
        name: user.name ?? null,
        email: user.email ?? "",
        globalRole: String(user.globalRole),
      },
      mpAdmin,
      multiAppPortal,
    });
  }

  const plantIds = user
    ? await getLayoutRepairedPlantIds(
        user.id,
        role ?? null,
        Boolean(user.canAccessStock),
      )
    : [];
  const selectedPlantId = user
    ? await resolveSelectedPlantId(user.id, {
        hasGlobalPlantAccess: globalPlantAccess,
      })
    : null;
  const primaryPlantId = selectedPlantId ?? plantIds[0] ?? null;

  const switchablePlants = await getLayoutSwitchablePlants(
    plantIds,
    globalPlantAccess,
  );

  const selectedFromList = selectedPlantId
    ? switchablePlants.find((p) => p.id === selectedPlantId)
    : null;
  const selectedPlant = selectedFromList
    ? {
        id: selectedFromList.id,
        name: selectedFromList.name,
        code: selectedFromList.code,
      }
    : null;
  const selectedPlantRaw = selectedPlant;

  const showPnl =
    role && !isMachineSupervisorOnly(role) ? canViewPnl(role) : false;
  const pnlSalesPurchaseOnly = role ? isAccountantPnlLimited(role) : false;
  const showPriceSheet =
    !!user &&
    !isMachineSupervisorOnly(role) &&
    (hasGlobalPlantAccess(user.globalRole) || canViewPriceSheet(user));
  const showMachineProduction = role
    ? canAccessMachineProduction(role, mpOpts)
    : false;
  const showAdmin = role && !isMachineSupervisorOnly(role) ? isAdminOrHead(role) : false;
  const showUsers =
    role && !isMachineSupervisorOnly(role)
      ? canViewUsersDirectory(role, { canManageUsers: user.canManageUsers })
      : false;
  const showApprovals =
    role && !isMachineSupervisorOnly(role) ? canApproveEntries(role) : false;
  const showStock =
    !!selectedPlantRaw &&
    isQuadSignalPlant(selectedPlantRaw.code) &&
    (role !== "MACHINE_SUPERVISOR" || Boolean(user?.canAccessStock));
  const showSuper = role ? isSuperAdmin(role) : false;
  const isManager = role ? isPlantManager(role) : false;
  const canEnter = role ? canEnterData(role) : false;
  const showSwitchPlant = plantIds.length > 1;

  return (
    <AppShell
      navFlags={{
        showPnl,
        pnlSalesPurchaseOnly,
        showPriceSheet,
        showMachineProduction,
        isMachineSupervisor: role ? isMachineSupervisorOnly(role) : false,
        showAdmin,
        showUsers,
        showApprovals,
        showStock,
        showSuper,
        showMpAdmin: mpAdmin,
        isManager,
        primaryPlantId,
        showSwitchPlant,
        selectedPlantName: selectedPlant?.name ?? null,
      }}
      user={
        user
          ? {
              name: user.name ?? null,
              email: user.email ?? "",
              role: user.globalRole,
              canAccessStock: Boolean(user.canAccessStock),
            }
          : null
      }
      canEnter={canEnter}
      plants={switchablePlants}
      currentPlantId={selectedPlantId}
      allowAllPlants={false}
      entryPlant={selectedPlant}
      showAppsHome={multiAppPortal}
    >
      {children}
    </AppShell>
  );
}