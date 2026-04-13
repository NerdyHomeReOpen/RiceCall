import { useEffect, useState } from 'react';

export const useCountries = () => {
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch('https://nerdyhomereopen.github.io/Details/country.json')
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
