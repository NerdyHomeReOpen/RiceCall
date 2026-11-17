type SortDirection = 1 | -1;
type SortField<T> = keyof T;

export function sorter<T extends object>(field: SortField<T>, direction: SortDirection = 1): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const valueA = a[field];
    const valueB = b[field];

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction * (valueA - valueB);
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction * valueA.localeCompare(valueB);
    }

    if (valueA instanceof Date && valueB instanceof Date) {
      return direction * (valueA.getTime() - valueB.getTime());
    }

    return 0;
  };
}

export function getNextSortDirection(isSameField: boolean, direction: SortDirection): SortDirection {
  if (isSameField && direction === -1) return 1;
  return -1;
}

export function getSortIndicator(isSorted: boolean, direction: SortDirection): string {
  if (!isSorted) return '';
  return direction === 1 ? '⏶' : '⏷';
}
