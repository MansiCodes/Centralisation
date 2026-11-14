import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(128).optional().or(z.literal("")),
    confirmPassword: z.string().min(8).max(128).optional().or(z.literal("")),
    avatarUrl: z.string().max(900_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const pwd = (val.password || "").trim();
    const confirm = (val.confirmPassword || "").trim();
    if (pwd || confirm) {
      if (pwd.length < 8) {
        ctx.addIssue({ code: "custom", message: "Password must be at least 8 characters", path: ["password"] });
      }
      if (pwd !== confirm) {
        ctx.addIssue({ code: "custom", message: "Passwords do not match", path: ["confirmPassword"] });
      }
    }
    if (val.avatarUrl) {
      const ok =
        val.avatarUrl.startsWith("data:image/") ||
        val.avatarUrl.startsWith("https://");
      if (!ok) {
        ctx.addIssue({ code: "custom", message: "Invalid profile picture", path: ["avatarUrl"] });
      }
    }
  });

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { name: true, email: true, avatarUrl: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid profile data";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  const pwd = (parsed.data.password || "").trim();
  const data: { name: string; passwordHash?: string; avatarUrl?: string | null } = {
    name: parsed.data.name,
  };
  if (pwd) {
    data.passwordHash = await bcrypt.hash(pwd, 12);
  }
  if (parsed.data.avatarUrl !== undefined) {
    data.avatarUrl = parsed.data.avatarUrl;
  }

  const user = await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data,
    select: { name: true, email: true, avatarUrl: true },
  });

  return NextResponse.json({
    ok: true,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  });
}
