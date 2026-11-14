import { NextResponse } from "next/server";
import type { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type UsersActor = {
  id: string;
  email: string | null;
  globalRole: GlobalRole;
  canManageUsers: boolean;
};

export async function loadUsersActor(
  session: { user?: { id?: string } } | null | undefined,
): Promise<{ actor: UsersActor } | { error: NextResponse }> {
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }),
    };
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      globalRole: true,
      canManageUsers: true,
    },
  });
  if (!actor) {
    return {
      error: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { actor };
}

export function usersAccessOpts(actor: UsersActor) {
  return { canManageUsers: actor.canManageUsers };
}