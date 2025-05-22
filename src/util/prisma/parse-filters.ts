// eslint-disable-next-line
export function autoParseFilters<T extends Record<string, any>>(filters: T): Record<string, any> {
  // eslint-disable-next-line
  const parsed: Record<string, any> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {
      parsed[key] = {
        contains: value,
        mode: 'insensitive',
      };
    } else if (value instanceof Date) {
      parsed[key] = {
        gte: value,
      };
    } else {
      parsed[key] = value;
    }
  }

  return parsed;
}
