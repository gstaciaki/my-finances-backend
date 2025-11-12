import { DECIMAL_PLACES_LIMIT } from './zod/currency';

export function formatCurrencyToOutput(val: number): string {
  const divisor = Math.pow(10, DECIMAL_PLACES_LIMIT);
  const formatted = (val / divisor).toFixed(DECIMAL_PLACES_LIMIT);
  return formatted;
}
