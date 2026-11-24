import React from 'react';
import { useTranslation } from 'react-i18next';

import ServerSearchBar from './ServerSearchBar';

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
        <div className="flex items-center w-auto">
          <div className="min-w-[15px] min-h-[15px] mr-[15px] cursor-pointer bg-position-[0_0] border-none hover:bg-position-[-16px_0] bg-[url('/icon_left_arrow.svg')]" />
          <div className="min-w-[15px] min-h-[15px] mr-[15px] cursor-pointer bg-position-[0_0] border-none hover:bg-position-[-16px_0] bg-[url('/icon_right_arrow.svg')]" />
          <ServerSearchBar />
        </div>
        <div className="flex items-center w-auto [&::-webkit-scrollbar]:h-0">
          <div
            className={`relative flex flex-row items-center justify-center min-w-max h-[30px] p-[5px] mr-[15px] text-text-color-quaternary no-underline cursor-pointer bg-none border border-[#fff0] rounded-[5px] hover:bg-hover hover:border-border before:mr-[5px] before:content-[''] before:bg-position-[0_0] before:min-w-[20px] before:min-h-[20px] before:bg-[url('/icon_home_page.svg')] ${isHomeSection ? "after:absolute after:bottom-[-5px] after:left-1/2 after:w-full after:h-[2px] after:content-[''] after:bg-main-color after:transform-[translateX(-50%)]" : ''}`}
            data-key="60060"
            onClick={onHomeSectionBtnClick}
          >
            {t('home')}
          </div>
        </div>
        <div className="flex items-center w-auto">
          <div
            className="relative flex flex-row items-center justify-center min-w-max h-[30px] p-[5px] mr-[15px] text-text-color-quaternary no-underline cursor-pointer bg-none border border-[#fff0] rounded-[5px] hover:bg-hover hover:border-border before:mr-[5px] before:content-[''] before:bg-position-[0_0] before:min-w-[12px] before:min-h-[12px] before:bg-[url('/icon_create.svg')]"
            data-key="30014"
            onClick={onCreateServerBtnClick}
          >
            {t('create-server')}
          </div>
          {!isPersonalExclusiveSection && (
            <div
              className="relative flex flex-row items-center justify-center min-w-max h-[30px] p-[5px] mr-[15px] text-text-color-quaternary no-underline cursor-pointer bg-none border border-[#fff0] rounded-[5px] hover:bg-hover hover:border-border before:mr-[5px] before:content-[''] before:bg-position-[0_0] before:min-w-[12px] before:min-h-[12px] before:bg-[url('/icon_person.svg')]"
              data-key="60004"
              onClick={onPersonalExclusiveSectionBtnClick}
            >
              {t('personal-exclusive')}
            </div>
          )}
          {isPersonalExclusiveSection && (
            <div
              className="relative flex flex-row items-center justify-center min-w-max h-[30px] p-[5px] mr-[15px] text-text-color-quaternary no-underline cursor-pointer bg-none border border-[#fff0] rounded-[5px] hover:bg-hover hover:border-border before:mr-[5px] before:content-[''] before:bg-position-[0_0] before:min-w-[12px] before:min-h-[12px] before:bg-[url('/back.svg')]"
              data-key="60005"
              onClick={onBackBtnClick}
            >
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
