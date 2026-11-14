import { GlobalRole } from "@prisma/client";
import { z } from "zod";

export const indiaPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10 || (v.startsWith("91") && v.length === 12), {
    message: "Mobile number must be 10 digits",
  })
  .transform((v) => (v.length === 12 ? `+${v}` : `+91${v}`));

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional().nullable(),
  phone: indiaPhoneSchema,
  password: z.string().min(8).max(128),
  globalRole: z.enum(GlobalRole),
  canViewPriceSheet: z.boolean().optional().default(false),
  canMachineSupervise: z.boolean().optional().default(false),
  canAdminMachineProduction: z.boolean().optional().default(false),
  canAccessStock: z.boolean().optional().default(false),
  canManageUsers: z.boolean().optional().default(false),
  plantIds: z.array(z.string().min(1)).optional().default([]),
});

export const patchUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional().nullable(),
  phone: indiaPhoneSchema.optional(),
  globalRole: z.enum(GlobalRole).optional(),
  canViewPriceSheet: z.boolean().optional(),
  canMachineSupervise: z.boolean().optional(),
  canAdminMachineProduction: z.boolean().optional(),
  canAccessStock: z.boolean().optional(),
  canManageUsers: z.boolean().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
  plantIds: z.array(z.string().min(1)).optional(),
});