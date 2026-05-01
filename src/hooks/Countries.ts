import { useEffect, useState } from 'react';

import Env from '@/env';

export const useCountries = () => {
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${Env.get().DOCS_BASE_URL}/country.json`)
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((json) => {
        setCountries(json);
      });
  }, []);

  return { countries };
};
