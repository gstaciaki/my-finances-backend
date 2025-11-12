import { z } from 'zod';

export const DECIMAL_PLACES_LIMIT = 4;

export const zCurrency = z
  .number()
  .refine(
    val => {
      const regex = new RegExp(`^\\d+(\\.\\d{1,${DECIMAL_PLACES_LIMIT}})?$`);
      return regex.test(val.toString());
    },
    {
      message: `Valor deve ter no máximo ${DECIMAL_PLACES_LIMIT} casas decimais`,
    },
  )
  .transform(val => {
    const multiplier = Math.pow(10, DECIMAL_PLACES_LIMIT);
    return Math.round(val * multiplier);
  });
