import React from 'react';
import { useTranslation } from 'react-i18next';

import ServerSearchBar from '@/components/ServerSearchBar';

import styles from './Home.module.css';

interface HomePageHeaderProps {
  isHomeSection: boolean;
  isPersonalExclusiveSection: boolean;
  onHomeSectionBtnClick: () => void;
  onCreateServerBtnClick: () => void;
  onPersonalExclusiveSectionBtnClick: () => void;
  onBackBtnClick: () => void;
}

const HomePageHeader: React.FC<HomePageHeaderProps> = React.memo(
  ({ isHomeSection, isPersonalExclusiveSection, onHomeSectionBtnClick, onCreateServerBtnClick, onPersonalExclusiveSectionBtnClick, onBackBtnClick }) => {
    const { t } = useTranslation();

    return (
      <>
        <div className={styles['header-left']}>
          <div className={styles['back-button']} />
          <div className={styles['forward-button']} />
          <ServerSearchBar />
        </div>
        <div className={styles['header-mid']}>
          <div className={`${styles['navigate-button']} ${isHomeSection ? styles['active'] : ''}`} data-key="60060" onClick={onHomeSectionBtnClick}>
            {t('home')}
          </div>
        </div>
        <div className={styles['header-right']}>
          <div className={styles['navigate-button']} data-key="30014" onClick={onCreateServerBtnClick}>
            {t('create-server')}
          </div>
          {!isPersonalExclusiveSection && (
            <div className={styles['navigate-button']} data-key="60004" onClick={onPersonalExclusiveSectionBtnClick}>
              {t('personal-exclusive')}
            </div>
          )}
          {isPersonalExclusiveSection && (
            <div className={styles['navigate-button']} data-key="60005" onClick={onBackBtnClick}>
              {t('back')}
            </div>
          )}
        </div>
      </>
    );
  },
);

HomePageHeader.displayName = 'HomePageHeader';

export default HomePageHeader;
