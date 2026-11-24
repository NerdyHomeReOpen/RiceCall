import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { openAlertDialog } from '@/services';

import { SERVER_OPTIONS } from '@/constants';

import ServerOption from './ServerOption';

interface ChangeServerPageProps {
  display: boolean;
  onBackToLoginBtnClick: () => void;
}

const ChangeServerPageComponent: React.FC<ChangeServerPageProps> = React.memo(({ display, onBackToLoginBtnClick }) => {
  const { t } = useTranslation();

  const handleServerSelect = (value: 'prod' | 'dev') => {
    if (value === 'dev') {
      openAlertDialog(t('confirm-change-server-to-dev'), () => {
        ipc.env.change(value);
        onBackToLoginBtnClick();
      });
    } else {
      ipc.env.change(value);
      onBackToLoginBtnClick();
    }
  };

  const handleBackToLoginBtnClick = () => {
    onBackToLoginBtnClick();
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background-secondary" style={display ? {} : { display: 'none' }}>
      <main className="flex flex-col gap-[10px] items-center justify-center w-[226px] h-full">
        <div className="block min-w-[226px] min-h-[54px] bg-[url('/login_logo.svg')] bg-no-repeat bg-center bg-contain" />
        <div className="grid grid-cols-[repeat(1,1fr)] gap-[10px] justify-items-center w-full max-w-[400px]">
          {SERVER_OPTIONS.map((option) => (
            <ServerOption key={option.value} option={option} onServerSelect={handleServerSelect} />
          ))}
        </div>
      </main>
      <div className="flex items-center justify-start w-full px-[15px] py-[10px] mt-auto text-[0.9rem] text-text-color-quaternary bg-footer-background border-t border-t-border">
        <div
          className="flex items-end no-underline cursor-pointer hover:text-[#0073c6] before:min-w-[14px] before:min-h-[14px] before:mr-[5px] before:align-middle before:content-[''] before:bg-no-repeat before:bg-[position:0_0]"
          onClick={handleBackToLoginBtnClick}
        >
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

ChangeServerPageComponent.displayName = 'ChangeServerPageComponent';

const ChangeServerPage = dynamic(() => Promise.resolve(ChangeServerPageComponent), { ssr: false });

export default ChangeServerPage;
