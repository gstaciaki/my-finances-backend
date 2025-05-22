export interface PaginatorParams {
  page: number;
  limit: number;
  filters?: Record<string, any>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
