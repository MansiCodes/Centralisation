import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(20).optional().nullable().or(z.literal("")),
    currentPassword: z.string().max(128).optional().or(z.literal("")),
    password: z.string().min(8).max(128).optional().or(z.literal("")),
    confirmPassword: z.string().min(8).max(128).optional().or(z.literal("")),
    avatarUrl: z.string().max(2_000_000).optional().nullable(),
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
    if (val.avatarUrl && !val.avatarUrl.startsWith("data:image/") && !val.avatarUrl.startsWith("https://")) {
      ctx.addIssue({ code: "custom", message: "Invalid profile picture", path: ["avatarUrl"] });
    }
  });

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { name: true, email: true, avatarUrl: true, phone: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    name: user.name || "",
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    phone: user.phone || "",
  });
}

async function verifyCurrentPassword(storedHash: string | null, currentPwd?: string) {
  if (!storedHash) return true;
  if (!currentPwd) return false;
  return bcrypt.compare(currentPwd, storedHash);
}

async function prepareProfileUpdates(parsed: z.infer<typeof bodySchema>) {
  const data: { name: string; phone?: string | null; passwordHash?: string; avatarUrl?: string | null } = {
    name: parsed.name,
  };
  if (parsed.phone !== undefined) {
    data.phone = parsed.phone ? parsed.phone.trim() : null;
  }
  const pwd = (parsed.password || "").trim();
  if (pwd) {
    data.passwordHash = await bcrypt.hash(pwd, 12);
  }
  if (parsed.avatarUrl !== undefined) {
    data.avatarUrl = parsed.avatarUrl;
  }
  return data;
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
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }
  const email = session.user.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }
  if ((parsed.data.password || "").trim()) {
    const valid = await verifyCurrentPassword(existing.passwordHash, parsed.data.currentPassword);
    if (!valid) {
      return NextResponse.json({ ok: false, message: "Current password is incorrect" }, { status: 400 });
    }
  }
  const updates = await prepareProfileUpdates(parsed.data);
  const user = await prisma.user.update({
    where: { email },
    data: updates,
    select: { name: true, email: true, avatarUrl: true, phone: true },
  });
  return NextResponse.json({ ok: true, name: user.name, email: user.email, avatarUrl: user.avatarUrl, phone: user.phone });
}
