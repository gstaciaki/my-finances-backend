import { Paginated } from '@src/types/paginator';

export function getPaginationData<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): Paginated<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
