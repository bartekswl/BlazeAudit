export const LIST_PAGE_SIZE = 25;

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = LIST_PAGE_SIZE,
): {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex,
  };
}
