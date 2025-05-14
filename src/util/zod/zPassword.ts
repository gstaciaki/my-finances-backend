import { z } from 'zod';
import PasswordUtil from '@src/util/password';

export const zPassword = () =>
  z.string().superRefine((password, ctx) => {
    const error = PasswordUtil.checkPasswordRules(password);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
      });
    }
  });
