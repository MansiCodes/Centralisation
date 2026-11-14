import { AppShell } from "@/components/shell/AppShell";

type MsShellUser = {
  name?: string | null | undefined;
  email?: string | null | undefined;
  globalRole: string;
};

export function machineSupervisorShell(
  children: React.ReactNode,
  params: {
    user: MsShellUser;
    mpAdmin: boolean;
    multiAppPortal: boolean;
  },
) {
  const { user, mpAdmin, multiAppPortal } = params;
  return (
    <AppShell
      navFlags={{
        showPnl: false,
        showPriceSheet: false,
        showMachineProduction: true,
        isMachineSupervisor: true,
        showAdmin: false,
        showUsers: false,
        showApprovals: false,
        showStock: false,
        showSuper: false,
        showMpAdmin: mpAdmin,
        isManager: false,
        primaryPlantId: null,
        showSwitchPlant: false,
        selectedPlantName: null,
      }}
      user={{
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.globalRole,
        canAccessStock: false,
      }}
      canEnter={false}
      plants={[]}
      currentPlantId={null}
      allowAllPlants={false}
      showAppsHome={multiAppPortal}
    >
      {children}
    </AppShell>
  );
}