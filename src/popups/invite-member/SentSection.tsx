import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

interface SentSectionProps {
  receiverMember: Types.Member;
  onModifyBtnClick: () => void;
  onConfirmBtnClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = React.memo(({ receiverMember, onModifyBtnClick, onConfirmBtnClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('invite-member-label')}</div>
          <div className="row">
            <div className="relative self-center w-[40px] h-[40px] mr-[5px] before:absolute before:-top-px before:-left-px before:z-1 before:min-w-[42px] before:min-h-[42px] before:content-[''] before:bg-[url('/channel/server_logo_border.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-cover">
              <Image src={receiverMember.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="receiver_avatar" width={40} height={40} loading="lazy" draggable="false" />
            </div>
            <div className="flex flex-1 flex-col justify-around h-full">
              <div className="link-text">
                {receiverMember.name} ({receiverMember.displayId})
              </div>
              <div className="sub-text">
                {t('contribution')}: {receiverMember.contribution}
              </div>
            </div>
          </div>
          <div className="w-full my-[5px] border-b border-b-border" />
          <div className="hint-text">{t('member-invitation-sent')}</div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={onModifyBtnClick}>
          {t('modify')}
        </div>
        <div className="button" onClick={onConfirmBtnClick}>
          {t('confirm')}
        </div>
      </div>
    </>
  );
});

SentSection.displayName = 'SentSection';

export default SentSection;
