import { useEffect, useState } from 'react';

import type * as Types from '@/types';

export const useStaffList = () => {
  const [staffList, setStaffList] = useState<Types.Staff[]>([]);

  useEffect(() => {
    fetch('https://nerdyhomereopen.github.io/Details/staff.json')
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
