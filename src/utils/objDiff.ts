/**
 * Compare two objects and return the difference
 * @param newObj - The new object
 * @param originalObj - The original object
 * @returns The difference between the two objects
 */
export default function objDiff<T extends object>(newObj: Partial<T>, originalObj: T): Partial<T> {
  return Object.keys(newObj).reduce((acc, key) => {
    if (newObj[key as keyof T] !== originalObj[key as keyof T]) {
      acc[key as keyof T] = newObj[key as keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}
