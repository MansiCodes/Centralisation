import { ManpowerRole, ManpowerShift } from "@prisma/client";
import { z } from "zod";
import { dateOnlyRegex } from "@/lib/dates";

export const DEFAULT_RATES: Record<ManpowerRole, number> = {
  MANAGER: 4000,
  OPERATOR: 1500,
  HELPER: 800,
};

export const productionSchema = z.object({
  date: z.string().regex(dateOnlyRegex),
  shift: z.enum(ManpowerShift),
  productName: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  notes: z.string().optional().nullable(),
  manpower: z
    .object({
      manager: z.coerce.number().int().nonnegative(),
      operator: z.coerce.number().int().nonnegative(),
      helper: z.coerce.number().int().nonnegative(),
    })
    .optional()
    .default({ manager: 0, operator: 0, helper: 0 }),
});