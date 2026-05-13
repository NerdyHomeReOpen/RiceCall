import type * as Types from '@/types';

/**
 * Clean the menu items by removing duplicate separators and ensuring that separators are not placed at the beginning or end of the menu.
 * @param items - The menu items to clean.
 * @returns The cleaned menu items.
 */
export function cleanMenu(items: Types.ContextMenuItem[]): Types.ContextMenuItem[] {
  const preFiltered = items.filter((item) => item.id === 'separator' || item.show !== false);
  const result: Types.ContextMenuItem[] = [];

  for (let i = 0; i < preFiltered.length; i++) {
    const cur = preFiltered[i];
    if (cur.id === 'separator') {
      if (result.length === 0) continue;
      const hasVisibleAfter = preFiltered.slice(i + 1).some((it) => it.id !== 'separator');
      if (!hasVisibleAfter) continue;
      if (result[result.length - 1].id === 'separator') continue;
    }
    result.push(cur);
  }

  return result;
}

/**
 * Compare two objects and return the difference
 * @param newObj - The new object
 * @param originalObj - The original object
 * @returns The difference between the two objects
 */
export function objDiff<T extends object>(newObj: Partial<T>, originalObj: T): Partial<T> {
  return Object.keys(newObj).reduce((acc, key) => {
    if (newObj[key as keyof T] !== originalObj[key as keyof T]) {
      acc[key as keyof T] = newObj[key as keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}

export * from './color';
export * from './contextMenu';
export * from './default';
export * from './encodeAudio';
export * from './env';
export * from './language';
export * from './logger';
export * from './platform';
export * from './region';
export * from './sorter';
export * from './tagConverter';
