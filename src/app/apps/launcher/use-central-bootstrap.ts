import { useEffect } from "react";
import type { CentralDirectoryUser } from "@/lib/central/directory-types";

export function useCentralBootstrap(
  name: string | null,
  onUsers: (users: CentralDirectoryUser[]) => void,
  onUsersError: (msg: string | null) => void,
  onUsersLoading: (loading: boolean) => void,
  onDisplayName: (name: string) => void,
  onAvatarUrl: (url: string | null) => void,
) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      onUsersLoading(true);
      onUsersError(null);
      try {
        const [dirRes, profileRes] = await Promise.all([
          fetch("/api/central/directory"),
          fetch("/api/central/profile"),
        ]);
        const data = (await dirRes.json()) as {
          ok?: boolean;
          users?: CentralDirectoryUser[];
          message?: string;
        };
        if (!dirRes.ok || !data.ok) {
          if (!cancelled) onUsersError(data.message || "Could not load users");
        } else if (!cancelled) {
          onUsers(data.users || []);
        }

        const profile = (await profileRes.json()) as {
          ok?: boolean;
          name?: string | null;
          avatarUrl?: string | null;
        };
        if (!cancelled && profileRes.ok && profile.ok) {
          if (profile.name) onDisplayName(profile.name);
          onAvatarUrl(profile.avatarUrl || null);
        }
      } catch {
        if (!cancelled) onUsersError("Could not load users");
      } finally {
        if (!cancelled) onUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, onAvatarUrl, onDisplayName, onUsers, onUsersError, onUsersLoading]);
}