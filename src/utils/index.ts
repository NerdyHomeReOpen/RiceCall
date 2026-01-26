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
