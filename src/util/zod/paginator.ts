import { z } from 'zod';

export const BasePaginatorSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type BasePaginatorInput = z.infer<typeof BasePaginatorSchema>;
