import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'auditor'])
});

export const freezeUserSchema = z.object({
  isFrozen: z.boolean()
});
