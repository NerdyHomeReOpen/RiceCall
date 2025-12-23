type SortDirection = 1 | -1;
type SortField<T> = keyof T;

/**
 * Create a sorter function for sorting an array of objects
 *
 * Example usage:
 * ```ts
 * const users = [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }];
 * users.sort(createSorter('age', -1)); // Sort by age in descending order
 * users.sort(createSorter('name')); // Sort by name in ascending order
 * ```
 *
 * @param field - The field to sort by
 * @param direction - The direction to sort by (1 for ascending, -1 for descending)
 * @returns A function that sorts an array of objects by the specified field in the specified direction
 */
export function Sorter<T extends object>(field: SortField<T>, direction: SortDirection = 1) {
  return (a: T, b: T) => {
    const valueA = a[field];
    const valueB = b[field];

    // Handle number sorting
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction * (valueA - valueB);
    }

    // Handle string sorting
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction * valueA.localeCompare(valueB);
    }

    // Handle date sorting
    if (valueA instanceof Date && valueB instanceof Date) {
      return direction * (valueA.getTime() - valueB.getTime());
    }

    return 0;
  };
}

export default Sorter;
