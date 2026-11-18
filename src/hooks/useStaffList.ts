import { useEffect, useState } from 'react';

import type * as Types from '@/types';

import Env from '@/utils/env';

export type UseStaffListResult = { staffList: Types.Staff[] };

export const useStaffList = (): UseStaffListResult => {
  const [staffList, setStaffList] = useState<Types.Staff[]>([]);

  useEffect(() => {
    fetch(`${Env.get().DOCS_BASE_URL}/staff.json`)
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((json) => {
        setStaffList(json);
      });
  }, []);

  return { staffList };
};
