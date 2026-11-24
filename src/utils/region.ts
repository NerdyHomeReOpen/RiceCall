import type * as Types from '@/types';

import { REGIONS } from '@/constants';

export function getRegion(): Types.RegionKey {
  const language = navigator.language;
  const match = REGIONS.find(({ code }) => code.includes(language));
  if (!match) return 'zh-TW';
  return match.code;
}
