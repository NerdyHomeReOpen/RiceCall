import { useEffect, useState } from 'react';

import type * as Types from '@/types';

import Env from '@/utils/env';

export const useStaffList = () => {
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
