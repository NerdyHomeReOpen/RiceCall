import React from 'react';
import { useTranslation } from 'react-i18next';

const HomePageNotAvailable: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return <div>{t('not-available-page')}</div>;
});

HomePageNotAvailable.displayName = 'HomePageNotAvailable';

export default HomePageNotAvailable;
