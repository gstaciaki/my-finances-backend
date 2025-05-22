import { z } from 'zod';

export const BasePaginatorSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
