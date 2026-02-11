export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export function calculatePagination(
  totalItems: number,
  page: number = 1,
  pageSize: number = 10
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    previousPage: hasPreviousPage ? currentPage - 1 : null,
  };
}
